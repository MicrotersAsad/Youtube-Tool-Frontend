import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    await db.collection('siteVisits').insertOne({ timestamp: new Date() });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
