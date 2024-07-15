// pages/api/comments/[slug].js
import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req, res) {
  const { method, query } = req;
  const { slug } = query;

  if (!slug) {
    return res.status(400).json({ message: 'Slug is required' });
  }

  let db, client;

  try {
    ({ db, client } = await connectToDatabase());
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error' });
  }

  const comments = db.collection('comments');

  switch (method) {
    case 'GET':
      try {
        const result = await comments.find({ slug }).toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error('GET error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    case 'POST':
      const { content, parentId } = req.body;
      const author = req.user?.username || 'Anonymous';
      const authorProfile = req.user?.profileImage || null;

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const comment = {
        slug,
        content,
        parentId: parentId ? new ObjectId(parentId) : null,
        author,
        authorProfile,
        createdAt: new Date(),
      };

      try {
        const result = await comments.insertOne(comment);

        if (!result.insertedId) {
          return res.status(500).json({ message: 'Failed to insert comment' });
        }

        res.status(201).json(comment);
      } catch (error) {
        console.error('POST error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
