import { connectToDatabase } from "../../utils/mongodb";

export default async function handler(req, res) {
  const { db, client } = await connectToDatabase();

  if (req.method === 'GET') {
    const activeCount = await db.collection('active_sessions').countDocuments();
    return res.status(200).json({ activeUsers: activeCount });
  } else if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    await db.collection('active_sessions').insertOne({ userId, loginTime: new Date() });
    return res.status(200).json({ message: 'User logged in' });
  } else if (req.method === 'DELETE') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    await db.collection('active_sessions').deleteOne({ userId });
    return res.status(200).json({ message: 'User logged out' });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
