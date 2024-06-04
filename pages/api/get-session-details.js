import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export default async (req = NextApiRequest, res = NextApiResponse) => {
  if (req.method === 'POST') {
    const { sessionId } = req.body;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer'],
      });
      res.status(200).json(session);
    } catch (error) {
      console.error('Error fetching session details:', error);
      res.status(500).json({ error: 'Error fetching session details' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
