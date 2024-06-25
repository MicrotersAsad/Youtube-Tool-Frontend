// pages/api/comments.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }

  const { videoId, includeReplies } = req.query;

  if (!videoId) {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    let url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&textFormat=plainText&part=snippet,replies&videoId=${videoId}&maxResults=100`;

    const comments = [];
    let nextPageToken = null;

    do {
      const response = await fetch(`${url}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
      const data = await response.json();

      if (!response.ok || !data.items) {
        throw new Error('Failed to fetch comments');
      }

      data.items.forEach(item => {
        comments.push({
          user: item.snippet.topLevelComment.snippet.authorDisplayName,
          avatar: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          likes: item.snippet.topLevelComment.snippet.likeCount,
          replies: item.snippet.totalReplyCount,
          channelUrl: item.snippet.topLevelComment.snippet.authorChannelUrl,
        });

        if (includeReplies && item.replies) {
          item.replies.comments.forEach(reply => {
            comments.push({
              user: reply.snippet.authorDisplayName,
              avatar: reply.snippet.authorProfileImageUrl,
              text: reply.snippet.textDisplay,
              likes: reply.snippet.likeCount,
              replies: 0,
            });
          });
        }
      });

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    res.status(500).json({ message: 'Error fetching comments' });
  }
}
