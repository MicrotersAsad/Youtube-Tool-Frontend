// pages/api/incrementView.js
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug } = req.body;

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

  try {
    const result = await db.collection('blogs').updateOne(
      { 'translations.slug': slug },
      { $inc: { viewCount: 1 } }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({ message: 'View count incremented' });
    } else {
      return res.status(404).json({ message: 'Blog post not found' });
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
