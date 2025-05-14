
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { selectedPlan, userId } = req.body;

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price: selectedPlan === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID,
//           quantity: 1,
//         },
//       ],
//       mode: 'subscription',
//       success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
//       metadata: {
//         userId,
//         plan: selectedPlan,
//       },
//     });

//     return res.status(200).json({ id: session.id });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// }

// pages/api/create-stripe-session.js

// pages/api/create-stripe-session.js

// pages/api/create-stripe-session.js

import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Verify the user's JWT using server-only secret
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { selectedPlan, userId } = req.body;
  if (!selectedPlan || !userId) {
    return res.status(400).json({ error: 'selectedPlan and userId are required' });
  }
  if (decoded.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: cannot create session for other users' });
  }

  try {
    // 2) Load Stripe credentials and price IDs from MongoDB
    const { db } = await connectToDatabase();
    const cfg = db.collection('paymentConfig');
    const stripeDoc = await cfg.findOne({ key: 'stripe_config' });

    const secretKey      = stripeDoc?.config?.STRIPE_SECRET_KEY;
    const yearlyPriceId  = stripeDoc?.config?.STRIPE_YEARLY_PRICE_ID;
    const monthlyPriceId = stripeDoc?.config?.STRIPE_MONTHLY_PRICE_ID;

    if (!secretKey || !yearlyPriceId || !monthlyPriceId) {
      return res.status(500).json({ error: 'Stripe configuration missing in DB' });
    }

    // 3) Initialize Stripe client dynamically
    const stripe = new Stripe(secretKey);

    // 4) Create the subscription checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan === 'yearly' ? yearlyPriceId : monthlyPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: { userId, plan: selectedPlan },
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe Session Creation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
