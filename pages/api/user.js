import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const users = await db.collection('user').find({}).toArray();
    res.status(200).json(users);
  } catch (error) {
    // console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
