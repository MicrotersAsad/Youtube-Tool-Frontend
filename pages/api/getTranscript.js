import fetch from 'node-fetch';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const { videoUrl } = req.body;
  const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');

  if (!videoId) {
    return res.status(400).json({ message: 'Invalid YouTube video URL' });
  }

  try {
    const { db } = await connectToDatabase();
    const tokens = await db.collection('ytApi').find({ active: true }).toArray();

    for (const token of tokens) {
      const apiKey = token.token;

      try {
        // Fetch video details
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;
        const videoResponse = await fetch(videoDetailsUrl);
        const videoData = await videoResponse.json();

        if (!videoResponse.ok || !videoData.items || videoData.items.length === 0) {
          throw new Error('Failed to fetch video details');
        }

        // Fetch captions
        const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
        const captionsResponse = await fetch(captionsUrl);
        const captionsData = await captionsResponse.json();

        if (!captionsResponse.ok || !captionsData.items || captionsData.items.length === 0) {
          throw new Error('Failed to fetch captions');
        }

        const captionId = captionsData.items[0].id;
        const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srv3&key=${apiKey}`;
        const captionResponse = await fetch(captionUrl);
        const captionData = await captionResponse.text();

        if (!captionResponse.ok) {
          throw new Error('Failed to fetch transcript');
        }

        return res.status(200).json({ transcript: captionData });
      } catch (error) {
        if (error.message === 'Quota Exceeded') {
          console.log(`Quota exceeded for API key: ${apiKey}`);
          continue;
        }
        console.error('Error fetching video data:', error.message);
        continue;
      }
    }

    res.status(500).json({ message: 'All API keys exhausted or error occurred' });
  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({ message: 'Database connection error' });
  }
}
