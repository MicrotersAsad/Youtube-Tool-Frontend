// /pages/api/tickets/[ticketId].js
import { connectToDatabase, ObjectId } from '../../../utils/mongodb';

/**
 * API route to fetch and update a specific ticket by its unique ID.
 */
export default async function handler(req, res) {
  const { ticketId } = req.query;
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const ticket = await db.collection('tickets').findOne({ ticketId });
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      res.status(200).json({ success: true, ticket });
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { status, comment, userId } = req.body;

      // Find and update the ticket status or add a comment
      if (status) {
        await db.collection('tickets').updateOne({ ticketId }, { $set: { status } });
      }

      if (comment) {
        await db.collection('tickets').updateOne(
          { ticketId },
          {
            $push: {
              comments: { userId, message: comment, createdAt: new Date() },
            },
          }
        );
      }

      const updatedTicket = await db.collection('tickets').findOne({ ticketId });
      res.status(200).json({ success: true, ticket: updatedTicket });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to update ticket' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
