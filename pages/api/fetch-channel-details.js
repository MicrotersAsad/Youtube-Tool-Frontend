import fetch from 'node-fetch';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    const { videoUrl } = req.body;
    const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');

    if (!videoId) {
        return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    try {
        const { db } = await connectToDatabase();
        const tokens = await db.collection('ytApi').find({ active: true }).toArray();

        for (const token of tokens) {
            const apiKey = token.token;
            try {
                const data = await fetchVideoData(videoId, apiKey);
                return res.status(200).json(data);
            } catch (error) {
                if (error.message === 'Quota Exceeded') {
                    console.log(`Quota exceeded for API key: ${apiKey}`);
                    continue; // Try the next API key
                }
                console.error('Error fetching video data:', error.message);
                continue; // Continue to the next API key on other errors
            }
        }

        res.status(500).json({ message: 'All API keys exhausted or error occurred' });
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({ message: 'Database connection error' });
    }
}

async function fetchVideoData(videoId, apiKey) {

    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
    const videoResponse = await fetch(videoApiUrl);
    const videoData = await videoResponse.json();

    if (videoResponse.status === 403) {
        throw new Error('Quota Exceeded');
    }

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
