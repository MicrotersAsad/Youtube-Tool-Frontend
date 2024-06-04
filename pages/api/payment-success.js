import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export default async (req, res) => {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    let user;

    try {
      user = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { sessionId } = req.body;

    try {
      const { db } = await connectToDatabase();

      // Fetch the session details from Stripe
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer'],
      });

      // Update user with payment details
      const updateData = {
        paymentStatus: 'success',
        stripeSessionId: sessionId,
        stripeCustomerId: stripeSession.customer,
        subscriptionPlan: stripeSession.metadata.plan,
        paymentDetails: {
          amountPaid: stripeSession.amount_total / 100,
          currency: stripeSession.currency,
          paymentMethod: stripeSession.payment_method_types[0],
        },
      };

      await db.collection('user').updateOne(
        { email: user.email },
        { $set: updateData }
      );

      res.status(200).json({ message: 'Payment status updated to success' });
    } catch (error) {
      console.error('Failed to update payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
