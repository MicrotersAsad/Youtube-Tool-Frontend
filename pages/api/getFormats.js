// pages/api/getFormats.js
import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url } = req.body;

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
      // Get video information from YouTube URL
      const videoInfo = await ytdl.getInfo(url);
      const formats = videoInfo.formats;

      // Filter out only the formats that have video and audio available
      const availableFormats = formats.filter(format => format.hasVideo && format.hasAudio);

      // Send the available formats to the frontend
      res.status(200).json({ formats: availableFormats });
    } catch (err) {
      console.error('Error fetching formats:', err);
      res.status(500).json({ error: 'Error fetching formats' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
