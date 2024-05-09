// This file should be placed in the pages/api directory of your Next.js project.

import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { videoUrl } = req.body;
    const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');

    if (!videoId) {
        return res.status(400).json({ message: 'Invalid YouTube video URL' });
    }

    try {
        const apiKey = process.env.YOUTUBE_API_KEY; // Ensure you have this in your environment variables
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;
        const response = await fetch(url);
        const data = await response.json();
        if (response.status !== 200) throw new Error(data.error.message);
        const tags = data.items[0].snippet.tags || [];
        res.status(200).json({ tags });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
