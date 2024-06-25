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
    const apiKey ='AIzaSyDbDR0hLu7_UQ7QW8sv_X6iDuIB3qZYl7M';


    // Fetch video details
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;
    const videoResponse = await fetch(videoDetailsUrl);
    const videoData = await videoResponse.json();
    console.log(videoData);

    if (!videoResponse.ok || !videoData.items || videoData.items.length === 0) {
      throw new Error('Failed to fetch video details');
    }

    // Fetch captions
    const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
    const captionsResponse = await fetch(captionsUrl);
    
    const captionsData = await captionsResponse.json();
    console.log(captionsData);
    if (!captionsResponse.ok || !captionsData.items || captionsData.items.length === 0) {
      throw new Error('Failed to fetch captions');
    }

    const captionId = captionsData.items[0].id;

    const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srv3&key=${apiKey}`;
    const captionResponse = await fetch(captionUrl)
    console.log(captionResponse);
    const captionData = await captionResponse.text(); // Use .text() to get raw caption data
console.log(captionData);
    if (!captionResponse.ok) {
      throw new Error('Failed to fetch transcript');
    }

    res.status(200).json({ transcript: captionData });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching data' });
  }
}
