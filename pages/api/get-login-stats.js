import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // Aggregate login data by browser
    const browserStats = await db.collection('login_logs').aggregate([
      { $group: { _id: "$browser", count: { $sum: 1 } } },
    ]).toArray();

    // Aggregate login data by OS
    const osStats = await db.collection('login_logs').aggregate([
      { $group: { _id: "$os", count: { $sum: 1 } } },
    ]).toArray();

    // Aggregate login data by Country
    const countryStats = await db.collection('login_logs').aggregate([
      { $group: { _id: "$country", count: { $sum: 1 } } },
    ]).toArray();

    return res.status(200).json({
      browserStats,
      osStats,
      countryStats,
    });
  } catch (error) {
    console.error('Error fetching login stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
