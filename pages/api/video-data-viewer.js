import fetch from 'node-fetch';

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { videoUrl } = req.body;
    if (!videoUrl) {
        res.status(400).json({ error: 'Video URL is required' });
        return;
    }

    try {
        const videoDetails = await fetchVideoDetails(videoUrl);
        res.status(200).json(videoDetails);
    } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).json({ error: error.message });
    }
}

async function fetchVideoDetails(videoUrl) {
    const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }

    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${apiKey}`;
    const videoResponse = await fetch(videoApiUrl);
    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
        throw new Error('No video data found');
    }

    const video = videoData.items[0];
    const categoryId = video.snippet.categoryId;

    // Fetch category name
    const categoryApiUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=${categoryId}&key=${apiKey}`;
    const categoryResponse = await fetch(categoryApiUrl);
    const categoryData = await categoryResponse.json();

    if (!categoryData.items || categoryData.items.length === 0) {
        throw new Error('No category data found');
    }

    const category = categoryData.items[0].snippet.title;

    // Processing thumbnails
    const thumbnails = video.snippet.thumbnails;
    const formattedThumbnails = {};
    Object.keys(thumbnails).forEach(key => {
        formattedThumbnails[key] = {
            url: thumbnails[key].url,
            width: thumbnails[key].width,
            height: thumbnails[key].height
        };
    });

    return {
        category,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        dislikeCount: video.statistics.dislikeCount,
        commentCount: video.statistics.commentCount,
        videoTags: video.snippet.tags ? video.snippet.tags.join(", ") : "No tags",
        description: video.snippet.description,
        audioLanguage: video.snippet.defaultAudioLanguage || video.snippet.defaultLanguage,
        publishedAt: video.snippet.publishedAt,
        isMonetized: 'Unknown', // YouTube API does not provide direct monetization status
        isEmbeddable: video.status ? (video.status.embeddable ? 'Yes' : 'No') : 'Unknown',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnails: formattedThumbnails
    };
}

export default handler;
