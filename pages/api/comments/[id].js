// pages/api/comments/[id].js
import { connectToDatabase, ObjectId } from '../../../utils/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { method } = req;
  const blogId = req.query.id;

  if (!ObjectId.isValid(blogId)) {
    res.status(400).json({ error: 'Invalid blog ID' });
    return;
  }

  const { db } = await connectToDatabase();
  const commentsCollection = db.collection('comments');

  switch (method) {
    case 'GET':
      try {
        const comments = await commentsCollection
          .find({ blogId: new ObjectId(blogId), parentId: null })
          .toArray();

        for (let comment of comments) {
          comment.replies = await commentsCollection
            .find({ parentId: comment._id })
            .toArray();
        }

        res.status(200).json(comments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
      }
      break;

    case 'POST':
      try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token received:', token);

        if (!token) {
          res.status(401).json({ error: 'Not authenticated' });
          return;
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
          console.log('Decoded token:', decoded);
        } catch (error) {
          console.error('Token verification failed:', error);
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        const { content, parentId } = req.body;

        if (!content) {
          res.status(400).json({ error: 'Content is required' });
          return;
        }

        const newComment = {
          blogId: new ObjectId(blogId),
          content,
          parentId: parentId ? new ObjectId(parentId) : null,
          author: decoded.username,
          authorProfile: decoded.profileImage,
          createdAt: new Date(),
        };

        const result = await commentsCollection.insertOne(newComment);

        res.status(201).json({ ...newComment, _id: result.insertedId });
      } catch (error) {
        console.error('Failed to add comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
      }
      break;

    case 'DELETE':
      try {
        const { commentId } = req.body;

        if (!ObjectId.isValid(commentId)) {
          res.status(400).json({ error: 'Invalid comment ID' });
          return;
        }

        const result = await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });

        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Comment deleted successfully' });
        } else {
          res.status(404).json({ error: 'Comment not found' });
        }
      } catch (error) {
        console.error('Failed to delete comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
