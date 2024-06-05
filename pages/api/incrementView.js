import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { slug } = req.body;
  if (!slug) {
    return res.status(400).json({ message: 'Slug is required' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('blogs');

    const result = await collection.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.status(200).json(result.value);
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
