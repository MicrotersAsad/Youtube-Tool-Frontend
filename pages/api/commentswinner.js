// pages/api/comments.js
import fetch from 'node-fetch';
import { connectToDatabase } from '../../utils/mongodb';

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
    const { db } = await connectToDatabase();
    const tokens = await db.collection('ytApi').find({ active: true }).toArray();

    for (const token of tokens) {
      const apiKey = token.token;
      let url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&textFormat=plainText&part=snippet,replies&videoId=${videoId}&maxResults=100`;

      const comments = [];
      let nextPageToken = null;

      do {
        const response = await fetch(`${url}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
        const data = await response.json();

        if (!response.ok || !data.items) {
          if (data.error?.errors[0]?.reason === 'quotaExceeded') {
            console.log(`Quota exceeded for API key: ${apiKey}`);
            break; // Try the next API key
          } else {
            throw new Error('Failed to fetch comments');
          }
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

      if (comments.length > 0) {
        res.status(200).json(comments);
        return;
      }
    }

    res.status(500).json({ message: 'All API keys exhausted or error occurred' });
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    res.status(500).json({ message: 'Error fetching comments' });
  }
}
