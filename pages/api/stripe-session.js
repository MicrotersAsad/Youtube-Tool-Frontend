import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items'],
    });

    return res.status(200).json({
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
      line_items: session.line_items,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Stripe Session Retrieval Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}