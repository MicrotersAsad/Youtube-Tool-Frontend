import { connectToDatabase } from '../../../utils/mongodb';

/**
 * API route to handle fetching tickets based on userId.
 */
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    // Fetch tickets based on userId
    try {
      const { userId } = req.query;
      let query = {};

      // Filter by user ID if provided
      if (userId) {
        query.userId = userId;
      }

      // Fetch tickets based on the query
      const tickets = await db.collection('tickets').find(query).toArray();

      if (tickets.length === 0) {
        return res.status(404).json({ success: false, message: 'No tickets found' });
      }

      res.status(200).json({ success: true, tickets });
    } catch (error) {
      console.error('Failed to fetch ticket(s):', error);
      res.status(500).json({ success: false, message: 'Failed to fetch ticket(s)' });
    }
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
