// /pages/api/users/index.js
import { connectToDatabase } from '../../../utils/mongodb';

/**
 * API route to fetch all users from the "users" collection.
 */
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const users = await db.collection('users').find().toArray();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
