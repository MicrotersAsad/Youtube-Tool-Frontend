import { connectToDatabase } from '../../utils/mongodb';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

const getStartOfPeriod = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'daily':
      return startOfDay(now);
    case 'weekly':
      return startOfWeek(now, { weekStartsOn: 1 });
    case 'monthly':
      return startOfMonth(now);
    case 'yearly':
      return startOfYear(now);
    case 'total':
      return null; // Indicating no date restriction for the total filter
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

    let visits;
    if (filter === 'total') {
      // Fetch all visits if filter is "total"
      visits = await db.collection('siteVisits').find({}).toArray();
      // Return total count of all visits
      return res.status(200).json({ totalCount: visits.length });
    } else if (startDate) {
      // Fetch visits based on start date for other filters
      visits = await db.collection('siteVisits').find({ timestamp: { $gte: startDate } }).toArray();
    } else {
      // If no valid filter is provided, return an error
      return res.status(400).json({ success: false, message: 'Invalid filter parameter' });
    }

    // Group visits by day and count them for other filters
    const visitCounts = visits.reduce((acc, visit) => {
      const date = visit.timestamp.toISOString().split('T')[0]; // Get date part only
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    // Convert to array format for the chart
    const visitData = Object.keys(visitCounts).map(date => ({
      date,
      value: visitCounts[date],
    }));

    res.status(200).json(visitData);
  } catch (error) {
    console.error('Error fetching site visits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
