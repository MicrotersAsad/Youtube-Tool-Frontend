import Stripe from 'stripe';

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { payment_intent } = req.query;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
    res.status(200).json(paymentIntent);
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    res.status(500).json({ error: 'Failed to fetch payment intent' });
  }
}
