import { connectToDatabase } from '../../../utils/mongodb';
import { firestore } from '../../../lib/firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'POST') {
    await handleCreateTicket(req, res, db);
  } else if (req.method === 'GET') {
    await handleGetTickets(req, res, db);
  } else if (req.method === 'PATCH') {
    await handleUpdateTicket(req, res, db);
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PATCH']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}

// Create Ticket
async function handleCreateTicket(req, res, db) {
  try {
    const { userId, userName, subject, description, attachments, priority } = req.body;

    // Validation
    if (!userId || !userName || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newTicket = {
      ticketId: uuidv4(),
      userId,
      userName,
      subject,
      description,
      attachments: attachments || [],
      priority: priority || 'medium',
      status: 'open',
      comments: [],
      createdAt: new Date(),
    };

    // Insert the ticket into MongoDB
    const result = await db.collection('tickets').insertOne(newTicket);

    if (result.acknowledged) {
      // Add a notification in Firestore
      await addDoc(collection(firestore, 'notifications'), {
        type: 'ticket_created',
        message: `${userName} created a new ticket: ${subject}`,
        ticketId: newTicket.ticketId,
        recipientUserId: userId,
        createdAt: new Date(),
        read: false,
      });

      res.status(201).json({ success: true, ticket: newTicket });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create ticket' });
    }
  } catch (error) {
    console.error('Error during ticket creation: ', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket due to server error' });
  }
}

// Get Tickets
async function handleGetTickets(req, res, db) {
  try {
    const { ticketId, userId } = req.query;
    const query = {};

    if (ticketId) query.ticketId = ticketId;
    if (userId) query.userId = userId;

    const tickets = await db.collection('tickets').find(query).toArray();

    if (tickets.length === 0) {
      return res.status(404).json({ success: false, message: 'No tickets found' });
    }

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching tickets: ', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
}

// Update Ticket
// Update Ticket
async function handleUpdateTicket(req, res, db) {
  try {
    const { ticketId } = req.query;
    const { status, comment, userId, userName, recipientUserId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    if (!comment || !userId || !userName || !recipientUserId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // MongoDB: Update the ticket with the new comment
    const updateFields = {
      $push: {
        comments: {
          userId,
          userName,
          message: comment,
          createdAt: new Date(),
        },
      },
    };

    if (status) {
      updateFields.$set = { status };
    }

    const result = await db.collection('tickets').updateOne(
      { ticketId },
      updateFields
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found or no changes made' });
    }

    // Firestore: Add a notification for the recipient
    const notificationRef = collection(firestore, 'notifications');
    await addDoc(notificationRef, {
      type: 'comment_added',
      message: `${userName} commented on your ticket ${ticketId}: "${comment}".`,
      ticketId,
      recipientUserId, // Include recipientUserId properly
      createdAt: new Date(),
      read: false,
    });

    res.status(200).json({ success: true, message: 'Comment added and notification sent' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
}

