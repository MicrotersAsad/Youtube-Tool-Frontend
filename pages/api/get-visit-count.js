import { connectToDatabase } from '../../utils/mongodb';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

const getStartOfPeriod = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'daily':
      return startOfDay(now);
    case 'weekly':
      return startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
    case 'monthly':
      return startOfMonth(now);
    case 'yearly':
      return startOfYear(now);
    default:
      return startOfDay(now);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { filter } = req.query;
  const startDate = getStartOfPeriod(filter);

  try {
    const { db } = await connectToDatabase();
    const visitCount = await db.collection('siteVisits').countDocuments({ timestamp: { $gte: startDate } });

    res.status(200).json({ success: true, visitCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
