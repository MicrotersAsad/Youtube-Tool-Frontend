// pages/api/user-visits.js
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { filter } = req.query;

  try {
    const { db } = await connectToDatabase();
    const userVisits = await db.collection('visitors').find({}).toArray();

    const now = new Date();
    let filteredData;

    const filterData = (data, filter) => {
      switch (filter) {
        case 'daily':
          return data.filter(item => {
            const date = new Date(item.date);
            return date.toDateString() === now.toDateString();
          });
        case 'weekly':
          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 7);
          return data.filter(item => {
            const date = new Date(item.date);
            return date >= lastWeek && date <= now;
          });
        case 'monthly':
          const lastMonth = new Date();
          lastMonth.setMonth(now.getMonth() - 1);
          return data.filter(item => {
            const date = new Date(item.date);
            return date >= lastMonth && date <= now;
          });
        case 'yearly':
          const lastYear = new Date();
          lastYear.setFullYear(now.getFullYear() - 1);
          return data.filter(item => {
            const date = new Date(item.date);
            return date >= lastYear && date <= now;
          });
        default:
          return data;
      }
    };

    filteredData = filterData(userVisits, filter);
    console.log(`Filtered Data (${filter}):`, filteredData); // Log the filtered data

    res.status(200).json(filteredData);
  } catch (error) {
    console.error('Error fetching user visit data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
