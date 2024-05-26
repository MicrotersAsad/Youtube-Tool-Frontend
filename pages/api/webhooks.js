// pages/api/webhook.js
import Stripe from 'stripe';
import getRawBody from 'raw-body';
import { updateUserAccess } from '../../utils/db'; // Ensure this function updates the user access in your database

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET;

export default async (req, res) => {
  if (req.method === 'POST') {
    let event;

    try {
      const rawBody = await getRawBody(req);
      const sig = req.headers['stripe-signature'];

      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook Error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const customerId = session.customer;
        try {
          await updateUserAccess(customerId, true); // Grant access
          console.log('User access updated successfully');
        } catch (err) {
          console.error('Error updating user access:', err.message);
        }
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const isActive = subscription.status === 'active';
        try {
          await updateUserAccess(subscription.customer, isActive); // Update access based on subscription status
          console.log('User subscription updated successfully');
        } catch (err) {
          console.error('Error updating user subscription:', err.message);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
