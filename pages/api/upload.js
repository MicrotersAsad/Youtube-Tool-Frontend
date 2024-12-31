import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'; // Ensure DeleteObjectCommand is imported
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import ytdl from '@distube/ytdl-core';
import { v4 as uuidv4 } from 'uuid';

// Configure S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url, quality } = req.body;

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
      const videoInfo = await ytdl.getInfo(url);
      const videoTitle = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${videoTitle}-${uuidv4()}.mp4`;

      const formats = videoInfo.formats;

      // Try to find the requested format
      let selectedFormat = formats.find((format) => format.qualityLabel === quality);

      if (!selectedFormat) {
        // If the requested quality is not available, fall back to the highest available quality
        console.log(`Requested quality (${quality}) not available. Falling back to highest video.`);
        selectedFormat = formats.find((format) =>
          ['1080p', '720p', '480p', '360p'].includes(format.qualityLabel)
        );
        
        if (!selectedFormat) {
          throw new Error('No suitable video format found.');
        }

        console.log(`Falling back to: ${selectedFormat.qualityLabel}`);
      }

      // Create a video stream with the selected format
      const videoStream = ytdl(url, {
        quality: selectedFormat.itag, // Use the 'itag' corresponding to the selected format
        filter: 'audioandvideo', // Make sure to download both audio and video
      });

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileName,
          Body: videoStream,
          ContentType: 'video/mp4',
          ContentDisposition: `attachment; filename="${fileName}"`,
        },
      });

      upload.on('httpUploadProgress', (progress) => {
        console.log('Upload progress:', progress);
      });

      // Perform the upload to S3
      await upload.done();

      // Generate a pre-signed URL for the uploaded video
      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileName,
          ResponseContentDisposition: `attachment; filename="${fileName}"`, // Forced download
          ResponseContentType: 'video/mp4', // Set response content type to video/mp4
        }),
        { expiresIn: 600 } // URL valid for 10 minutes
      );

      // Set up the 6 minute timer for deleting the video from S3
      setTimeout(async () => {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
          }));
          console.log(`File ${fileName} deleted from S3 after 6 minutes.`);
        } catch (err) {
          console.error('Error deleting video from S3:', err);
        }
      }, 180000); // 3 minutes = 180000 milliseconds

      // Send the pre-signed URL to the frontend
      res.status(200).json({ downloadUrl: signedUrl });
    } catch (err) {
      console.error('Error uploading to S3:', err);
      res.status(500).json({ error: 'Error uploading video' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
