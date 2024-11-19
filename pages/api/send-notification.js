import { firestore } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { recipientUserId, type, message, ticketId } = req.body;

      if (!recipientUserId || !type || !message) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Add a new notification to Firestore
      await addDoc(collection(firestore, 'notifications'), {
        recipientUserId,
        type,
        message,
        ticketId: ticketId || null, // Optional field
        createdAt: new Date(),
        read: false,
      });

      res.status(201).json({ success: true, message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }
}
