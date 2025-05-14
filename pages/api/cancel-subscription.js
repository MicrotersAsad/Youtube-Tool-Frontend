import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
const paypal = require('@paypal/checkout-server-sdk');
const { ObjectId } = require('mongodb');

const validateEnvironment = () => {
  const requiredEnvVars = ['NEXT_PUBLIC_JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

const validateRequest = (req) => {
  if (req.method !== 'POST') {
    throw { status: 405, message: 'Method not allowed' };
  }
  if (!req.body.userId) {
    throw { status: 400, message: 'Missing userId' };
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, message: 'Authorization header missing or invalid' };
  }
  return authHeader.split(' ')[1];
};

const verifyToken = (token, userId) => {
  try {
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    if (String(decoded.id) !== String(userId)) {
      throw { status: 403, message: 'Forbidden: You can only cancel your own subscription' };
    }
    return decoded;
  } catch (error) {
    throw { status: 401, message: 'Invalid or expired token', details: error.message };
  }
};

const findUser = async (db, userId) => {
  const usersCollection = db.collection('user');
  let user = await usersCollection.findOne({ _id: userId });
  
  if (!user) {
    try {
      user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    } catch (objIdError) {
      console.log('ObjectId conversion error:', objIdError.message);
    }
  }
  
  if (!user) {
    throw { status: 404, message: 'User not found in database' };
  }
  
  if (!user.paymentDetails) {
    throw { status: 400, message: 'No payment details found' };
  }
  
  return user;
};

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
    throw { status: 500, message: 'Missing payment credentials in config' };
  }

  return {
    stripe: new Stripe(STRIPE_SECRET_KEY),
    paypal: new paypal.core.PayPalHttpClient(
      new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    )
  };
};

const cancelStripeSubscription = async (stripeClient, paymentDetails) => {
  let subscriptionId = paymentDetails.subscriptionId;
  
  if (!subscriptionId && paymentDetails.sessionId) {
    const session = await stripeClient.checkout.sessions.retrieve(paymentDetails.sessionId);
    subscriptionId = session?.subscription;
  }

  if (subscriptionId) {
    try {
      const subscription = await stripeClient.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscriptionId;
    } catch (error) {
      console.error('Stripe cancellation error:', error.message);
      return null;
    }
  }
  return null;
};

const cancelPaypalSubscription = async (paypalClient, paymentDetails) => {
  if (paymentDetails.provider === 'paypal' && paymentDetails.subscriptionId) {
    try {
      const request = new paypal.subscriptions.SubscriptionsCancelRequest(paymentDetails.subscriptionId);
      await paypalClient.execute(request);
      return true;
    } catch (error) {
      console.error('PayPal cancellation error:', error.message);
      return false;
    }
  }
  return false;
};

const updateUserSubscription = async (usersCollection, user, stripeSubscriptionId) => {
  const updatedPaymentDetails = {
    ...user.paymentDetails,
    subscriptionStatus: 'canceled',
    canceledAt: new Date(),
    ...(stripeSubscriptionId && !user.paymentDetails.subscriptionId ? { subscriptionId: stripeSubscriptionId } : {})
  };

  const updateResult = await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        plan: 'free',
        updatedAt: new Date(),
        paymentDetails: updatedPaymentDetails
      }
    }
  );

  if (updateResult.matchedCount === 0) {
    throw { status: 404, message: 'User not found for update' };
  }

  return updateResult;
};

const generateNewToken = (user) => {
  const userData = {
    id: user._id,
    _id: user._id,
    email: user.email,
    plan: 'free',
    paymentDetails: user.paymentDetails
  };
  
  return jwt.sign(userData, process.env.NEXT_PUBLIC_JWT_SECRET, { expiresIn: '7d' });
};

export default async function handler(req, res) {
  try {
    validateEnvironment();
    const token = validateRequest(req);
    const { userId } = req.body;
    
    const decoded = verifyToken(token, userId);
    const { db } = await connectToDatabase();
    const user = await findUser(db, userId);
    const { stripe, paypal } = await initializePaymentClients(db);
    
    let stripeSubscriptionId = null;
    if (user.paymentDetails.provider === 'stripe') {
      stripeSubscriptionId = await cancelStripeSubscription(stripe, user.paymentDetails);
    } else if (user.paymentDetails.provider === 'paypal') {
      await cancelPaypalSubscription(paypal, user.paymentDetails);
    }

    await updateUserSubscription(db.collection('user'), user, stripeSubscriptionId);
    const updatedUser = await db.collection('user').findOne({ _id: user._id });
    
    if (!updatedUser) {
      return res.status(200).json({
        message: 'Subscription canceled successfully, but could not fetch updated user data',
        success: true
      });
    }

    const newToken = generateNewToken(updatedUser);
    
    return res.status(200).json({
      message: 'Subscription canceled successfully',
      token: newToken,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        plan: updatedUser.plan,
        paymentDetails: updatedUser.paymentDetails
      }
    });
  } catch (error) {
    console.error('Cancel Subscription Error:', {
      message: error.message,
      status: error.status || 500,
      details: error.details || 'No additional details'
    });
    
    return res.status(error.status || 500).json({
      error: error.message || 'Internal server error'
    });
  }
}