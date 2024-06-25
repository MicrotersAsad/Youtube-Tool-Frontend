import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const { country, category } = req.query;

  if (!country || !category) {
    return res.status(400).json({ message: 'Country and category are required' });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    // Fetch video categories
    const categoryUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${country}&key=${apiKey}`;
    const categoryResponse = await fetch(categoryUrl);
    const categoryData = await categoryResponse.json();

    if (!categoryResponse.ok || !categoryData.items) {
      throw new Error('Failed to fetch video categories');
    }

    const categoryDict = categoryData.items.reduce((acc, item) => {
      acc[item.id] = item.snippet.title;
      return acc;
    }, {});

    // Fetch trending videos
    let videoUrl = `https://www.googleapis.com/youtube/v3/videos?chart=mostPopular&part=snippet,contentDetails,statistics&maxResults=12&key=${apiKey}`;
    if (country !== 'All') {
      videoUrl += `&regionCode=${country}`;
    }
    if (category !== 'All') {
      videoUrl += `&videoCategoryId=${category}`;
    }

    const videoResponse = await fetch(videoUrl);
    const videoData = await videoResponse.json();

    if (!videoResponse.ok || !videoData.items) {
      throw new Error('Failed to fetch trending videos');
    }

    const videos = videoData.items.map(item => ({
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channel: item.snippet.channelTitle,
      uploadedAt: item.snippet.publishedAt,
      category: categoryDict[item.snippet.categoryId] || 'Unknown',
      likes: item.statistics.likeCount,
      comments: item.statistics.commentCount,
      views: item.statistics.viewCount,
      videoId: item.id,
    }));

    res.status(200).json({ videos, categories: categoryDict });
  } catch (error) {
    console.error('Error fetching trending videos:', error.message);
    res.status(500).json({ message: 'Error fetching trending videos' });
  }
}
