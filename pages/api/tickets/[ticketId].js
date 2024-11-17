import { connectToDatabase, ObjectId } from '../../../utils/mongodb';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase'; // Firestore setup

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
      const { status, comment, userId, userName } = req.body;

      // Update ticket status
      if (status) {
        await db.collection('tickets').updateOne(
          { ticketId },
          { $set: { status } }
        );

        // Add a notification for the status update
        await addDoc(collection(firestore, 'notifications'), {
          type: 'status_update',
          message: `Your ticket ${ticketId} status has been updated to ${status}.`,
          ticketId,
          userId, // স্পেসিফিক ইউজারের জন্য
          createdAt: new Date(),
          read: false,
        });
      }

      // Add a comment and update the ticket to "pending" status
      if (comment) {
        await db.collection('tickets').updateOne(
          { ticketId },
          {
            $set: { status: 'pending' },
            $push: {
              comments: {
                userId,
                userName, // Add the userName to the comment
                message: comment,
                createdAt: new Date(),
              },
            },
          }
        );

        // Add a notification for the new comment
        await addDoc(collection(firestore, 'notifications'), {
          type: 'comment_added',
          message: `${userName} commented on your ticket ${ticketId}: "${comment}".`,
          ticketId,
          userId, // স্পেসিফিক ইউজারের জন্য
          createdAt: new Date(),
          read: false,
        });
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

      // Add a notification for the deleted comment
      await addDoc(collection(firestore, 'notifications'), {
        type: 'comment_deleted',
        message: `A comment was deleted from your ticket ${ticketId}.`,
        ticketId,
        createdAt: new Date(),
        read: false,
      });

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
