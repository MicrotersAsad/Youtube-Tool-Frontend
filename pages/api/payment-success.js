import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import jwt from 'jsonwebtoken';
const { ObjectId } = require('mongodb');
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

// Validate environment variables
const validateEnvironment = () => {
  const requiredEnvVars = ['NEXT_PUBLIC_JWT_SECRET', 'NEXT_PUBLIC_BASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Initialize payment clients
const initializePaymentClients = async (db) => {
  const configCollection = db.collection('paymentConfig');
  const [stripeCfg, paypalCfg] = await Promise.all([
    configCollection.findOne({ key: 'stripe_config' }),
    configCollection.findOne({ key: 'paypal_config' })
  ]);

  const STRIPE_SECRET_KEY = stripeCfg?.config?.STRIPE_SECRET_KEY;
  const PAYPAL_CLIENT_ID = paypalCfg?.config?.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = paypalCfg?.config?.PAYPAL_CLIENT_SECRET;

  if (!STRIPE_SECRET_KEY || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error('Payment credentials missing in paymentConfig', {
      stripe: !!STRIPE_SECRET_KEY,
      paypalClientId: !!PAYPAL_CLIENT_ID,
      paypalClientSecret: !!PAYPAL_CLIENT_SECRET
    });
    throw new Error('Payment credentials missing in paymentConfig');
  }

  console.log('Stripe Secret Key:', STRIPE_SECRET_KEY);
  console.log('PayPal Client ID:', PAYPAL_CLIENT_ID);
  console.log('PayPal Client Secret:', PAYPAL_CLIENT_SECRET);

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const paypalEnv = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
  const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

  return { stripe, paypalClient };
};

// Validate request
const validateRequest = (req) => {
  if (req.method !== 'POST') {
    throw { status: 405, message: 'Method not allowed' };
  }

  const { provider, sessionId, userId, selectedPlan } = req.body;
  const missingFields = [];
  if (!provider) missingFields.push('provider');
  if (!sessionId) missingFields.push('sessionId');
  if (!selectedPlan) missingFields.push('selectedPlan');
  if (missingFields.length > 0) {
    throw {
      status: 400,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  if (!['stripe', 'paypal'].includes(provider)) {
    throw { status: 400, message: `Invalid provider: ${provider}` };
  }

  if (!['monthly', 'yearly'].includes(selectedPlan)) {
    throw { status: 400, message: `Invalid selectedPlan: ${selectedPlan}` };
  }

  const authHeader = req.headers.authorization;
  return { authHeader, provider, sessionId, userId, selectedPlan };
};

// Verify JWT token
const verifyToken = (authHeader, userId) => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null; // Allow anonymous access if no token
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    if (userId && userId !== 'anonymous' && String(decoded.id) !== String(userId)) {
      throw {
        status: 403,
        message: 'Forbidden: You can only process your own payment'
      };
    }
    console.log('Payment Success - Decoded Token:', {
      id: decoded.id,
      email: decoded.email,
      exp: decoded.exp
    });
    return decoded;
  } catch (error) {
    console.error('Payment Success - Token Verification Error:', {
      message: error.message,
      name: error.name
    });
    throw {
      status: 401,
      message: error.name === 'TokenExpiredError' ? 'Token has expired' : `Invalid token: ${error.message}`
    };
  }
};

// Verify user
const verifyUser = async (usersCollection, userId) => {
  if (!userId || userId === 'anonymous') {
    return null;
  }

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw { status: 404, message: 'User not found in database' };
    }
    console.log('Payment Success - User query result:', { id: user._id, email: user.email });
    return user;
  } catch (error) {
    console.error('Payment Success - User query failed:', error.message);
    throw { status: 500, message: 'User query error', details: error.message };
  }
};

// Verify Stripe payment
const verifyStripePayment = async (stripe, sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription']
  });
  if (session.payment_status !== 'paid') {
    throw { status: 400, message: 'Payment not completed' };
  }
  return {
    paymentStatus: session.payment_status,
    subscriptionId: session.subscription?.id || 'N/A',
    amount: session.amount_total / 100,
    currency: session.currency
  };
};

// Verify PayPal payment
const verifyPaypalPayment = async (paypalClient, sessionId, planConfig) => {
  const request = new paypal.orders.OrdersGetRequest(sessionId);
  const response = await paypalClient.execute(request);
  const order = response.result;
  if (order.status !== 'COMPLETED') {
    throw { status: 400, message: `PayPal order not completed: ${order.status}` };
  }
  return {
    paymentStatus: order.status.toLowerCase(),
    subscriptionId: 'N/A',
    amount: planConfig.amount,
    currency: planConfig.currency
  };
};

// Create order
const createOrder = async (ordersCollection, user, decoded, paymentData, planConfig, provider, sessionId, effectiveUserId) => {
  const order = {
    userId: effectiveUserId ? new ObjectId(effectiveUserId) : null,
    email: user?.email || decoded?.email || 'anonymous',
    plan: planConfig.plan,
    amount: paymentData.amount,
    currency: paymentData.currency,
    provider,
    sessionId,
    subscriptionId: paymentData.subscriptionId,
    paymentStatus: paymentData.paymentStatus,
    createdAt: new Date()
  };

  const existingOrder = await ordersCollection.findOne({ sessionId });
  if (existingOrder) {
    console.log('Payment Success - Order already exists:', existingOrder._id);
    return {
      exists: true,
      order: {
        orderId: existingOrder._id,
        email: existingOrder.email,
        plan: existingOrder.plan,
        amount: existingOrder.amount,
        currency: existingOrder.currency,
        provider: existingOrder.provider,
        sessionId: existingOrder.sessionId,
        subscriptionId: existingOrder.subscriptionId,
        paymentStatus: existingOrder.paymentStatus,
        createdAt: existingOrder.createdAt
      }
    };
  }

  const orderResult = await ordersCollection.insertOne(order);
  console.log('Payment Success - Order inserted successfully:', { orderId: orderResult.insertedId });
  return {
    exists: false,
    order: {
      orderId: orderResult.insertedId,
      ...order
    }
  };
};

// Update user
const updateUser = async (usersCollection, effectiveUserId, user, provider, sessionId, paymentData, planConfig) => {
  if (!effectiveUserId || !user) {
    return;
  }

  const updateResult = await usersCollection.updateOne(
    { _id: new ObjectId(effectiveUserId) },
    {
      $set: {
        plan: planConfig.plan,
        updatedAt: new Date(),
        paymentDetails: {
          provider,
          sessionId,
          subscriptionId: paymentData.subscriptionId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          paymentStatus: paymentData.paymentStatus,
          createdAt: new Date()
        }
      }
    }
  );

  console.log('Payment Success - User update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount
  });
};

// Add admin notification
const addAdminNotification = async (user, decoded, amount, planConfig) => {
  try {
    await addDoc(collection(firestore, 'notifications'), {
      type: 'payment_success',
      message: `${user?.email || decoded?.email || 'Anonymous user'} has successfully completed a payment of $${amount} for the plan ${planConfig.plan}.`,
      createdAt: new Date(),
      recipientUserId: 'admin',
      read: false
    });
    console.log('Payment Success - Admin notification added to Firestore');
  } catch (error) {
    console.warn('Payment Success - Failed to add admin notification:', error.message);
  }
};

export default async function handler(req, res) {
  try {
    validateEnvironment();
    const { authHeader, provider, sessionId, userId, selectedPlan } = validateRequest(req);
    const decoded = verifyToken(authHeader, userId);
    const effectiveUserId = decoded ? decoded.id : userId === 'anonymous' ? null : userId;

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('user');
    const ordersCollection = db.collection('order');

    const collections = await db.listCollections().toArray();
    if (!collections.some(col => col.name === 'order')) {
      throw { status: 500, message: 'Order collection not found in database' };
    }

    const user = await verifyUser(usersCollection, effectiveUserId);
    const { stripe, paypalClient } = await initializePaymentClients(db);

    const plans = {
      yearly: { plan: 'yearly_premium', amount: 60.0, currency: 'usd' },
      monthly: { plan: 'monthly_premium', amount: 8.0, currency: 'usd' }
    };
    const planConfig = plans[selectedPlan];
    if (!planConfig) {
      throw { status: 400, message: `Invalid plan: ${selectedPlan}` };
    }

    let paymentData;
    if (provider === 'stripe') {
      paymentData = await verifyStripePayment(stripe, sessionId);
    } else if (provider === 'paypal') {
      paymentData = await verifyPaypalPayment(paypalClient, sessionId, planConfig);
    }

    const { exists, order } = await createOrder(
      ordersCollection,
      user,
      decoded,
      paymentData,
      planConfig,
      provider,
      sessionId,
      effectiveUserId
    );

    if (exists) {
      return res.status(200).json({
        message: 'Order already created',
        order
      });
    }

    await updateUser(usersCollection, effectiveUserId, user, provider, sessionId, paymentData, planConfig);
    await addAdminNotification(user, decoded, paymentData.amount, planConfig);

    return res.status(200).json({
      message: 'Payment verified, user updated, and order created',
      order
    });
  } catch (error) {
    console.error('Payment Success - Error:', {
      message: error.message,
      status: error.status || 500,
      details: error.details || 'No additional details'
    });
    return res.status(error.status || 500).json({
      error: error.message || 'Server error'
    });
  }
}