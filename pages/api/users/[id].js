// /pages/api/users/[id].js
import { connectToDatabase, ObjectId } from '../../../utils/mongodb';

/**
 * API route to fetch a specific user by ID from the "users" collection.
 */
export default async function handler(req, res) {
  const { id } = req.query;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
