import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { slug } = req.body;
  let db, client;

  try {
    ({ db, client } = await connectToDatabase());
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error' });
  }

  const blogs = db.collection('blogs');

  try {
    const result = await blogs.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.status(200).json(result.value);
  } catch (error) {
    console.error('Increment view count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

