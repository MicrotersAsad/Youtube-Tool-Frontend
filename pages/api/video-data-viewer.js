// import fetch from 'node-fetch';
// import { getUserIp } from '../../utils/getUserIp';
// import rateLimit from '../../utils/rateLimit';

// const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
// const limiter = rateLimit({ interval: 24 * 60 * 60 * 1000, limit: 2 }); // 24 hours, 2 requests

// // Simple in-memory storage (use a database in production)
// const fetchCounts = {};

// async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const userIp = getUserIp(req);

//   limiter(req, res, async () => {
//     const { videoUrl } = req.body;
//     if (!videoUrl) {
//       return res.status(400).json({ error: 'Video URL is required' });
//     }

//     // Check if the IP has exceeded the fetch limit
//     if (!fetchCounts[userIp]) {
//       fetchCounts[userIp] = 0;
//     }

//     if (fetchCounts[userIp] >= 2) {
//       return res.status(429).json({ error: 'Fetch limit exceeded. Please upgrade for unlimited access.' });
//     }

//     try {
//       const videoDetails = await fetchVideoDetails(videoUrl);
//       fetchCounts[userIp] += 1; // Increment fetch count
//       return res.status(200).json(videoDetails);
//     } catch (error) {
//       console.error('Error in handler while fetching video details:', error);
//       return res.status(500).json({ error: error.message });
//     }
//   });
// }

// async function fetchVideoDetails(videoUrl) {
//   let videoId;
//   try {
//     videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
//     if (!videoId) {
//       throw new Error('Invalid YouTube URL');
//     }
//   } catch (error) {
//     console.error('Error parsing video URL:', error);
//     throw new Error('Invalid YouTube URL');
//   }

//   const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${apiKey}`;

//   try {
//     console.log('Fetching video data from URL:', videoApiUrl);
//     const videoResponse = await fetch(videoApiUrl);
//     if (!videoResponse.ok) {
//       throw new Error(`YouTube API responded with status ${videoResponse.status}`);
//     }

//     const videoData = await videoResponse.json();
//     if (!videoData.items || videoData.items.length === 0) {
//       throw new Error('No video data found');
//     }

//     const video = videoData.items[0];
//     const categoryId = video.snippet.categoryId;

//     // Fetch category name
//     const categoryApiUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=${categoryId}&key=${apiKey}`;
//     console.log('Fetching category data from URL:', categoryApiUrl);
//     const categoryResponse = await fetch(categoryApiUrl);
//     if (!categoryResponse.ok) {
//       throw new Error(`YouTube API (categories) responded with status ${categoryResponse.status}`);
//     }

//     const categoryData = await categoryResponse.json();
//     if (!categoryData.items || categoryData.items.length === 0) {
//       throw new Error('No category data found');
//     }

//     const category = categoryData.items[0].snippet.title;

//     // Processing thumbnails
//     const thumbnails = video.snippet.thumbnails;
//     const formattedThumbnails = {};
//     Object.keys(thumbnails).forEach(key => {
//       formattedThumbnails[key] = {
//         url: thumbnails[key].url,
//         width: thumbnails[key].width,
//         height: thumbnails[key].height
//       };
//     });

//     return {
//       category,
//       duration: video.contentDetails.duration,
//       viewCount: video.statistics.viewCount,
//       likeCount: video.statistics.likeCount,
//       dislikeCount: video.statistics.dislikeCount,
//       commentCount: video.statistics.commentCount,
//       videoTags: video.snippet.tags ? video.snippet.tags.join(", ") : "No tags",
//       description: video.snippet.description,
//       audioLanguage: video.snippet.defaultAudioLanguage || video.snippet.defaultLanguage,
//       publishedAt: video.snippet.publishedAt,
//       isMonetized: 'Unknown',
//       isEmbeddable: video.status ? (video.status.embeddable ? 'Yes' : 'No') : 'Unknown',
//       videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
//       thumbnails: formattedThumbnails
//     };
//   } catch (error) {
//     console.error('Error fetching video details:', error);
//     throw new Error('Failed to fetch video details');
//   }
// }
import puppeteer from 'puppeteer';

function convertDuration(duration) {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  // Remove the PT prefix
  duration = duration.replace('PT', '');

  // Match the hours, minutes, and seconds using regular expressions
  const hourMatch = duration.match(/(\d+)H/);
  const minuteMatch = duration.match(/(\d+)M/);
  const secondMatch = duration.match(/(\d+)S/);

  if (hourMatch) hours = parseInt(hourMatch[1]);
  if (minuteMatch) minutes = parseInt(minuteMatch[1]);
  if (secondMatch) seconds = parseInt(secondMatch[1]);

  // Format the time as HH:MM:SS
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { videoUrl, hasUnlimitedAccess, role } = req.body;

  // Check if the user has unlimited access or is an admin
  const isAdmin = role === 'admin';
  const hasAccess = hasUnlimitedAccess || isAdmin;

  if (!hasAccess && !fetchCounts[userIp]) {
    fetchCounts[userIp] = 0;
  }

  if (!hasAccess && fetchCounts[userIp] >= 3) {
    return res.status(429).json({ error: 'Fetch limit exceeded. Please upgrade for unlimited access.' });
  }

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    console.log('Starting Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`Navigating to: ${videoUrl}`);
    await page.goto(videoUrl, { waitUntil: 'networkidle2' });

    const videoData = await page.evaluate(() => {
      const title = document.querySelector('h1.title')?.innerText || '';
      const views = document.querySelector('span.view-count')?.innerText || '';

      // Fetching like count
      const likeButton = document.querySelector('button[aria-label^="like this video"]');
      const likes = likeButton ? likeButton.querySelector('yt-formatted-string')?.innerText : '';

      // Fetching dislikes (dislikes count might be hidden)
      const dislikes = ''; // Placeholder as YouTube hides dislikes count

      const description = document.querySelector('div#description')?.innerText || '';
      const uploadDate = document.querySelector('span.style-scope.ytd-video-primary-info-renderer')?.innerText || '';
      const channelName = document.querySelector('yt-formatted-string.ytd-channel-name a')?.innerText || '';
      const channelUrl = document.querySelector('yt-formatted-string.ytd-channel-name a')?.href || '';
      const subscribers = document.querySelector('yt-formatted-string#owner-sub-count')?.innerText || '';
      const commentCount = document.querySelector('h2#count yt-formatted-string span')?.innerText || '';

      // Processing thumbnails
      const thumbnail = document.querySelector('link[rel="image_src"]')?.href || '';

      // Attempt to extract duration from meta tags or structured data
      const duration = document.querySelector('meta[itemprop="duration"]')?.getAttribute('content') || '';

      // Attempt to extract category from structured data
      const category = document.querySelector('meta[itemprop="genre"]')?.getAttribute('content') || '';

      // Attempt to extract audio language from structured data
      const audioLanguage = document.querySelector('meta[itemprop="inLanguage"]')?.getAttribute('content') || '';

      // Attempt to extract embeddability from structured data or meta tags
      const isEmbeddable = document.querySelector('meta[property="og:video:embed_url"]') ? 'Yes' : 'No';

      const videoTags = Array.from(document.querySelectorAll('meta[name="keywords"]')).map(tag => tag.content).join(', ');

      return {
        title,
        views,
        likes,
        dislikes,
        description,
        uploadDate,
        channelName,
        channelUrl,
        subscribers,
        commentCount,
        thumbnail,
        category,
        duration,
        audioLanguage,
        isEmbeddable,
        videoTags,
      };
    });

    videoData.duration = convertDuration(videoData.duration);

    console.log(`Video data: ${JSON.stringify(videoData)}`);
    await browser.close();

    if (!hasAccess) {
      fetchCounts[userIp] += 1; // Increment fetch count
    }

    res.status(200).json(videoData);
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



