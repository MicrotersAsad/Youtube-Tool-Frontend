import { getSession } from 'next-auth/react';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export default async (req, res) => {
  if (req.method === 'POST') {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subscriptionId } = req.body;

    try {
      const canceledSubscription = await stripe.subscriptions.del(subscriptionId);
      res.status(200).json({ message: 'Subscription canceled successfully', canceledSubscription });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
