// pages/api/fetch-url.js
import fetch from 'node-fetch';

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
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.items || data.items.length === 0) {
      throw new Error('Failed to fetch video tags');
    }

    const tags = data.items[0].snippet.tags || [];
    res.status(200).json({ tags });
  } catch (error) {
    // console.error('Error fetching video tags:', error.message);
    res.status(500).json({ message: 'Error fetching video tags' });
  }
}
