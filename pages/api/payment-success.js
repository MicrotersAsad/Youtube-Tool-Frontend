// pages/api/payment-success.js
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';
import { firestore } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import paypal from '@paypal/checkout-server-sdk'; // Add PayPal SDK

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// Initialize PayPal environment (for verification if needed)
const paypalEnvironment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Received Token:', token); // Debug token

  let user;
  try {
    user = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    console.log('Verified User:', user); // Debug verified user
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { sessionId, orderId } = req.body; // Accept both sessionId (Stripe) and orderId (PayPal)

  if (!sessionId && !orderId) {
    return res.status(400).json({ error: 'Session ID or Order ID is required' });
  }

  try {
    const { db } = await connectToDatabase();

    let updateData;
    if (sessionId) {
      // Handle Stripe payment
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });

      const subscription = stripeSession.subscription;
      const metadata = stripeSession.metadata;

      updateData = {
        paymentDetails: {
          paymentStatus: 'success',
          stripeSessionId: sessionId,
          stripeCustomerId: stripeSession.customer,
          subscriptionPlan: metadata.plan || (subscription.plan.interval === 'year' ? 'Yearly' : 'Monthly'),
          subscriptionValidUntil: new Date(subscription.current_period_end * 1000),
          amountPaid: stripeSession.amount_total / 100,
          currency: stripeSession.currency,
          paymentMethod: stripeSession.payment_method_types[0],
          updatedAt: new Date(),
        },
      };
    } else if (orderId) {
      // Handle PayPal payment (verify and extract details)
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const order = await paypalClient.execute(request);
      const payment = order.result.purchase_units[0];

      updateData = {
        paymentDetails: {
          paymentStatus: 'success',
          paypalOrderId: orderId,
          subscriptionPlan: payment.amount.value === '60.00' ? 'Yearly' : 'Monthly',
          amountPaid: parseFloat(payment.amount.value),
          currency: payment.amount.currency_code,
          paymentMethod: 'paypal',
          updatedAt: new Date(),
        },
      };
    }

    if (!updateData) {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    const updateResult = await db.collection('user').updateOne(
      { email: user.email },
      { $set: updateData },
      { upsert: true }
    );
    console.log('Update Result:', updateResult);

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add notification (same for both Stripe and PayPal)
    const amountPaid = updateData.paymentDetails.amountPaid;
    const plan = updateData.paymentDetails.subscriptionPlan;
    await addDoc(collection(firestore, 'notifications'), {
      type: 'payment_success',
      message: `${user.email} has successfully completed a payment of $${amountPaid} for the plan ${plan}.`,
      createdAt: new Date(),
      recipientUserId: 'admin',
      read: false,
    });

    res.status(200).json({ message: 'Payment status updated to success' });
  } catch (error) {
    console.error('Failed to update payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status', details: error.message });
  }
};