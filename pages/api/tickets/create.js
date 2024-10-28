// /pages/api/tickets/create.js
import { connectToDatabase, ObjectId } from '../../../utils/mongodb';

/**
 * API route to create and fetch a ticket in the "tickets" collection.
 */
export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'POST') {
    // Create a new ticket
    try {
      const { userId,userName, subject, description, attachments, priority } = req.body;

      const newTicket = {
        ticketId: generateUniqueId(),
        userId,
        userName,
        subject,
        description,
        attachments: attachments || [],
        priority: priority || 'medium', // Default to "medium" if not provided
        status: 'open',
        comments: [],
        createdAt: new Date(),
      };

      const result = await db.collection('tickets').insertOne(newTicket);
      res.status(201).json({ success: true, ticket: result.ops[0] });
    } catch (error) {
      console.error('Failed to create ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to create ticket' });
    }
  } else if (req.method === 'GET') {
    // Fetch a specific ticket or all tickets for a user
    try {
      const { ticketId, userId } = req.query;
      let query = {};

      // Filter by ticket ID if provided
      if (ticketId) {
        query.ticketId = ticketId;
      }

      // Filter by user ID if provided
      if (userId) {
        query.userId = userId;
      }
      // Filter by user ID if provided
    

      // Fetch the ticket or tickets
      const tickets = await db.collection('tickets').find(query).toArray();

      if (tickets.length === 0) {
        return res.status(404).json({ success: false, message: 'No tickets found' });
      }

      res.status(200).json({ success: true, tickets });
    } catch (error) {
      console.error('Failed to fetch ticket(s):', error);
      res.status(500).json({ success: false, message: 'Failed to fetch ticket(s)' });
    }
  } else if (req.method === 'PATCH') {
    // Update ticket's status or add a comment
    try {
      const { ticketId } = req.query;
      const { status, comment } = req.body;

      let updateFields = {};

      if (status) {
        updateFields.status = status;
      }

      if (comment) {
        updateFields.status = 'pending'; // Set status to "pending" when a new comment is added
        updateFields.$push = { comments: { ...comment, createdAt: new Date() } };
      }

      const result = await db.collection('tickets').updateOne(
        { ticketId: ticketId },
        { $set: updateFields, ...(comment && { $push: { comments: { ...comment, createdAt: new Date() } } }) }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Failed to update ticket' });
      }

      res.status(200).json({ success: true, message: 'Ticket updated successfully' });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to update ticket' });
    }
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['POST', 'GET', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to generate unique IDs (using a random method, you can choose another)
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 10);
}
