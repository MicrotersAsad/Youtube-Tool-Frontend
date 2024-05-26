import fetch from 'node-fetch';
import { getUserIp } from '../../utils/getUserIp';
import rateLimit from '../../utils/rateLimit';

const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const limiter = rateLimit({ interval: 24 * 60 * 60 * 1000, limit: 2 }); // 24 hours, 2 requests

// Simple in-memory storage (use a database in production)
const fetchCounts = {};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userIp = getUserIp(req);

  limiter(req, res, async () => {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Check if the IP has exceeded the fetch limit
    if (!fetchCounts[userIp]) {
      fetchCounts[userIp] = 0;
    }

    if (fetchCounts[userIp] >= 2) {
      return res.status(429).json({ error: 'Fetch limit exceeded. Please upgrade for unlimited access.' });
    }

    try {
      const videoDetails = await fetchVideoDetails(videoUrl);
      fetchCounts[userIp] += 1; // Increment fetch count
      return res.status(200).json(videoDetails);
    } catch (error) {
      console.error('Error in handler while fetching video details:', error);
      return res.status(500).json({ error: error.message });
    }
  });
}

async function fetchVideoDetails(videoUrl) {
  let videoId;
  try {
    videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
  } catch (error) {
    console.error('Error parsing video URL:', error);
    throw new Error('Invalid YouTube URL');
  }

  const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${apiKey}`;

  try {
    console.log('Fetching video data from URL:', videoApiUrl);
    const videoResponse = await fetch(videoApiUrl);
    if (!videoResponse.ok) {
      throw new Error(`YouTube API responded with status ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('No video data found');
    }

    const video = videoData.items[0];
    const categoryId = video.snippet.categoryId;

    // Fetch category name
    const categoryApiUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=${categoryId}&key=${apiKey}`;
    console.log('Fetching category data from URL:', categoryApiUrl);
    const categoryResponse = await fetch(categoryApiUrl);
    if (!categoryResponse.ok) {
      throw new Error(`YouTube API (categories) responded with status ${categoryResponse.status}`);
    }

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
      isMonetized: 'Unknown',
      isEmbeddable: video.status ? (video.status.embeddable ? 'Yes' : 'No') : 'Unknown',
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnails: formattedThumbnails
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
}

export default handler;
