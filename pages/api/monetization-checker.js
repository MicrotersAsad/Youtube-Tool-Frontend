import fetch from 'node-fetch';

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { url } = req.body;
    if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    try {
        const details = await fetchDetails(url);
        res.status(200).json(details);
    } catch (error) {
        console.error('Error fetching details:', error);
        res.status(500).json({ error: error.message });
    }
}

async function fetchDetails(url) {
    const parsedUrl = new URL(url);
    let videoId = null;
    let channelId = null;

    if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
        if (parsedUrl.pathname === '/watch') {
            videoId = parsedUrl.searchParams.get('v');
        } else if (parsedUrl.pathname.startsWith('/channel/')) {
            channelId = parsedUrl.pathname.split('/')[2];
        } else if (parsedUrl.pathname.startsWith('/c/') || parsedUrl.pathname.startsWith('/user/')) {
            const customUrl = parsedUrl.pathname.split('/')[2];
            channelId = await getChannelIdFromCustomUrlOrUsername(customUrl);
        }
    } else if (parsedUrl.hostname === 'youtu.be') {
        videoId = parsedUrl.pathname.substring(1);
    }

    if (!videoId && !channelId) {
        throw new Error('Invalid YouTube URL');
    }

    if (videoId) {
        return await fetchVideoData(videoId);
    } else if (channelId) {
        return await fetchChannelData(channelId);
    }
}

async function fetchVideoData(videoId) {
    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${apiKey}`;
    const videoResponse = await fetch(videoApiUrl);
    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
        throw new Error('No video data found');
    }

    const video = videoData.items[0];
    const channelUrl = `https://www.youtube.com/channel/${video.snippet.channelId}`;

    return {
        type: 'video',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        channelUrl: channelUrl,
        title: video.snippet.title,
        description: video.snippet.description,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        dislikeCount: video.statistics.dislikeCount,
        commentCount: video.statistics.commentCount,
        duration: video.contentDetails.duration,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        channelTitle: video.snippet.channelTitle,
        isMonetized: video.status.madeForKids ? 'No' : 'Likely Yes' // Example logic for monetization
    };
}

async function fetchChannelData(channelId) {
    const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
    const channelResponse = await fetch(channelApiUrl);
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
        throw new Error('No channel data found');
    }

    const channel = channelData.items[0];
    const brandingSettings = channel.brandingSettings || {};
    const isMonetized = brandingSettings.image || brandingSettings.channel;

    return {
        type: 'channel',
        channelUrl: `https://www.youtube.com/channel/${channelId}`,
        title: channel.snippet.title,
        description: channel.snippet.description,
        viewCount: channel.statistics.viewCount,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        isMonetized: isMonetized ? 'Likely Yes' : 'Unknown',
        thumbnails: channel.snippet.thumbnails
    };
}

async function getChannelIdFromCustomUrlOrUsername(customUrl) {
    const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${customUrl}&key=${apiKey}`;
    const searchResponse = await fetch(searchApiUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
        throw new Error('No channel data found for custom URL or username');
    }

    return searchData.items[0].id.channelId;
}

export default handler;
