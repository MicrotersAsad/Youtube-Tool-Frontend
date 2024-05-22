// pages/api/youtube.js
import fetch from 'node-fetch';

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    const { videoUrl } = req.body;

    try {
        const data = await fetchVideoData(videoUrl);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function fetchVideoData(videoUrl) {
    const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }

    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
    const videoResponse = await fetch(videoApiUrl);
    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
        throw new Error('No data found for the provided video ID');
    }

    const video = videoData.items[0];
    const channelID = video.snippet.channelId;

    const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelID}&key=${apiKey}`;
    const channelResponse = await fetch(channelApiUrl);
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
        throw new Error('No channel data found');
    }

    const channel = channelData.items[0];

    return {
        channelId: channelID,
        channelName: video.snippet.channelTitle,
        channelUrl: `https://www.youtube.com/channel/${channelID}`,
        channelDescription: channel.snippet.description,
        subscribers: channel.statistics.subscriberCount,
        totalViews: channel.statistics.viewCount,
        videoCount: channel.statistics.videoCount,
        channelProfileImage: channel.snippet.thumbnails.default.url,
        channelBannerImage: channel.brandingSettings.image.bannerImageUrl,
        channelTags: channel.snippet.tags ? channel.snippet.tags.join(", ") : "No tags",
        hasAdvertised: channel.statistics.commentCount ? 'Yes' : 'No',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
}

export default handler;
