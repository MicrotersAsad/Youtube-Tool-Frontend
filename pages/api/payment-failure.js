import { getSession } from 'next-auth/react';
import { connectToDatabase } from '../../utils/mongodb';

export default async (req, res) => {
  if (req.method === 'POST') {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { user } = session;

    try {
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { email: user.email },
        { $set: { paymentStatus: 'failed' } }
      );
      res.status(200).json({ message: 'Payment status updated to failed' });
    } catch (error) {
      console.error('Failed to update payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
