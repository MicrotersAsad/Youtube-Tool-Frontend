// /pages/api/tickets/[ticketId].js
import { connectToDatabase, ObjectId } from '../../../utils/mongodb';

/**
 * API route to fetch, update, and delete specific ticket data by its unique ID.
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
      const { status, comment, userId,userName } = req.body;

  
      

      // Find and update the ticket status or add a comment
      if (status) {
        await db.collection('tickets').updateOne(
          { ticketId },
          { $set: { status } }
        );
      }

      if (comment) {
        // Update the ticket status to "pending" when a new comment is added
        await db.collection('tickets').updateOne(
          { ticketId },
          {
            $set: { status: 'pending' },
            $push: {
              comments: { 
                userId, 
                userName, // Add the fetched userName field
                message: comment, 
                createdAt: new Date() 
              },
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
  } else if (req.method === 'DELETE') {
    try {
      const { commentId } = req.body; // The ID of the comment to delete

      // Remove the comment by filtering the comments array
      const result = await db.collection('tickets').updateOne(
        { ticketId },
        { $pull: { comments: { _id: new ObjectId(commentId) } } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Comment not found or already deleted' });
      }

      const updatedTicket = await db.collection('tickets').findOne({ ticketId });
      res.status(200).json({ success: true, ticket: updatedTicket });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}