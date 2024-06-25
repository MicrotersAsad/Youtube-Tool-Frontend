// pages/api/summarize.js

import { getSubtitles } from 'youtube-captions-scraper';
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
    // Fetch the transcript
    const captions = await getSubtitles({ videoID: videoId });

    // Fetch video info
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`;
    const videoInfoResponse = await fetch(videoInfoUrl);
    const videoInfoData = await videoInfoResponse.json();
    if (!videoInfoData.items || videoInfoData.items.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const videoInfo = videoInfoData.items[0];
    const duration = videoInfo.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const videoDuration = `${duration[1] ? duration[1].slice(0, -1) + 'h ' : ''}${duration[2] ? duration[2].slice(0, -1) + 'm ' : ''}${duration[3] ? duration[3].slice(0, -1) + 's' : ''}`.trim();

    const totalDuration = captions[captions.length - 1].start + captions[captions.length - 1].dur;
    const segmentDuration = 60; // Split per minute
    let segments = [];
    let currentSegment = [];
    let currentTime = 0;

    captions.forEach(caption => {
      const captionEndTime = caption.start + caption.dur;
      if (captionEndTime > currentTime + segmentDuration) {
        segments.push(currentSegment);
        currentSegment = [];
        currentTime += segmentDuration;
      }
      currentSegment.push(caption);
    });

    if (currentSegment.length) {
      segments.push(currentSegment);
    }

    // Summarize each segment
    const summaries = await Promise.all(segments.map(async segment => {
      const transcript = segment.map(caption => caption.text).join(' ');
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: `Summarize the following transcript: ${transcript}` }],
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      return data.choices[0].message.content;
    }));

    res.status(200).json({ 
      videoInfo: {
        title: videoInfo.snippet.title,
        author: videoInfo.snippet.channelTitle,
        duration: videoDuration,
        readTime: `${Math.ceil(totalDuration / 60)} min`,
        thumbnail: videoInfo.snippet.thumbnails.high.url,
        publishedAt: videoInfo.snippet.publishedAt, // Added category
      },
      captions: segments, 
      summaries 
    })
    console.log(videoInfo);
  } catch (error) {
    console.error('Error fetching video captions or summarizing:', error);
    res.status(500).json({ message: 'Error fetching video captions or summarizing' });
  }
}
