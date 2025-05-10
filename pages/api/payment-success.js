// import { connectToDatabase } from '../../utils/mongodb';
// import Stripe from 'stripe';
// import paypal from '@paypal/checkout-server-sdk';
// import jwt from 'jsonwebtoken';
// const { ObjectId } = require('mongodb');

// import { collection, addDoc } from 'firebase/firestore'; // Firestore methods
// import { firestore } from '../../lib/firebase';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // PayPal configuration
// const paypalClientId = process.env.PAYPAL_CLIENT_ID;
// const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
// const paypalEnv = process.env.PAYPAL_ENV === 'sandbox' 
//   ? new paypal.core.SandboxEnvironment(paypalClientId, paypalClientSecret)
//   : new paypal.core.LiveEnvironment(paypalClientId, paypalClientSecret);
// const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     console.error('Payment Success - Method not allowed:', req.method);
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { provider, sessionId, userId, selectedPlan } = req.body;
//   console.log('Payment Success - Request:', { provider, sessionId, userId, selectedPlan });

//   if (!provider || !sessionId || !userId || !selectedPlan) {
//     const missingFields = [];
//     if (!provider) missingFields.push('provider');
//     if (!sessionId) missingFields.push('sessionId');
//     if (!userId) missingFields.push('userId');
//     if (!selectedPlan) missingFields.push('selectedPlan');
//     console.error('Payment Success - Missing required fields:', missingFields);
//     return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
//   }

//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.error('Payment Success - Authorization header issue:', { authHeader });
//     return res.status(401).json({ error: 'Authorization header missing or invalid' });
//   }

//   const token = authHeader.split(' ')[1];
//   console.log('Payment Success - Received Token:', token ? `${token.slice(0, 10)}...` : 'None');
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log('Payment Success - Decoded Token:', {
//       id: decoded.id,
//       email: decoded.email,
//       exp: decoded.exp,
//     });
//   } catch (error) {
//     console.error('Payment Success - Token Verification Error:', {
//       message: error.message,
//       name: error.name,
//       token: token ? 'Present' : 'Missing',
//     });
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ error: 'Token has expired' });
//     }
//     return res.status(401).json({ error: `Invalid token: ${error.message}` });
//   }

//   if (decoded.id !== userId) {
//     console.error('Payment Success - Token ID mismatch:', { decodedId: decoded.id, userId });
//     return res.status(403).json({ error: 'Forbidden: You can only process your own payment' });
//   }

//   try {
//     // Connect to MongoDB
//     let db;
//     try {
//       const connection = await connectToDatabase();
//       db = connection.db;
//       console.log('Payment Success - Connected to MongoDB');
//     } catch (dbError) {
//       console.error('Payment Success - MongoDB connection failed:', dbError.message, dbError.stack);
//       return res.status(500).json({ error: 'Database connection error' });
//     }

//     const usersCollection = db.collection('user');
//     const ordersCollection = db.collection('order');

//     // Check if order collection exists
//     const collections = await db.listCollections().toArray();
//     const orderCollectionExists = collections.some(col => col.name === 'order');
//     console.log('Payment Success - Order collection exists:', orderCollectionExists);
//     if (!orderCollectionExists) {
//       console.error('Payment Success - Order collection not found');
//       return res.status(500).json({ error: 'Order collection not found in database' });
//     }

//     // Verify user exists
//     let user;
//     try {
//       user = await usersCollection.findOne({ _id: new ObjectId(userId) });
//       console.log('Payment Success - User query result:', user ? { id: user._id, email: user.email } : 'No user found');
//     } catch (userError) {
//       console.error('Payment Success - User query failed:', userError.message, userError.stack);
//       return res.status(500).json({ error: 'User query error' });
//     }

//     if (!user) {
//       console.error('Payment Success - User not found:', userId);
//       return res.status(404).json({ error: 'User not found in database' });
//     }

//     // Plan configuration
//     const plans = {
//       yearly: { plan: 'yearly_premium', amount: 60.00, currency: 'usd' },
//       monthly: { plan: 'monthly_premium', amount: 8.00, currency: 'usd' },
//     };

//     const planConfig = plans[selectedPlan];
//     if (!planConfig) {
//       console.error('Payment Success - Invalid plan:', selectedPlan);
//       return res.status(400).json({ error: `Invalid plan: ${selectedPlan}` });
//     }

//     let paymentStatus, subscriptionId, amount, currency;

//     if (provider === 'stripe') {
//       // Verify the Stripe checkout session
//       let session;
//       try {
//         session = await stripe.checkout.sessions.retrieve(sessionId, {
//           expand: ['subscription'],
//         });
//         console.log('Payment Success - Stripe session retrieved:', { payment_status: session.payment_status });
//       } catch (stripeError) {
//         console.error('Payment Success - Stripe session retrieval failed:', stripeError.message, stripeError.stack);
//         return res.status(500).json({ error: `Stripe session retrieval failed: ${stripeError.message}` });
//       }

//       if (session.payment_status !== 'paid') {
//         console.error('Payment Success - Stripe payment not completed:', session.payment_status);
//         return res.status(400).json({ error: 'Payment not completed' });
//       }

//       paymentStatus = session.payment_status;
//       subscriptionId = session.subscription?.id || 'N/A';
//       amount = session.amount_total / 100;
//       currency = session.currency;
//     } else if (provider === 'paypal') {
//       // Verify PayPal order
//       if (!paypalClientId || !paypalClientSecret) {
//         console.error('Payment Success - PayPal credentials missing');
//         return res.status(500).json({ error: 'PayPal credentials are missing' });
//       }

//       let order;
//       try {
//         const request = new paypal.orders.OrdersGetRequest(sessionId);
//         const response = await paypalClient.execute(request);
//         order = response.result;
//         console.log('Payment Success - PayPal order retrieved:', { status: order.status });
//       } catch (paypalError) {
//         console.error('Payment Success - PayPal order retrieval failed:', paypalError.message, paypalError.stack);
//         return res.status(500).json({ error: `PayPal order retrieval failed: ${paypalError.message}` });
//       }

//       if (order.status !== 'COMPLETED') {
//         console.error('Payment Success - PayPal order not completed:', order.status);
//         return res.status(400).json({ error: `PayPal order not completed: ${order.status}` });
//       }

//       paymentStatus = order.status.toLowerCase();
//       subscriptionId = 'N/A'; // Use order ID if needed: sessionId
//       amount = planConfig.amount;
//       currency = planConfig.currency;
//     } else {
//       console.error('Payment Success - Unsupported provider:', provider);
//       return res.status(400).json({ error: `Unsupported provider: ${provider}` });
//     }

//     // Check for existing order to prevent duplicates
//     let existingOrder;
//     try {
//       existingOrder = await ordersCollection.findOne({ sessionId });
//       console.log('Payment Success - Existing order check:', existingOrder ? existingOrder._id : 'No existing order');
//     } catch (existingOrderError) {
//       console.error('Payment Success - Existing order query failed:', existingOrderError.message, existingOrderError.stack);
//       return res.status(500).json({ error: 'Existing order query error' });
//     }

//     if (existingOrder) {
//       console.log('Payment Success - Order already exists:', existingOrder._id);
//       return res.status(200).json({
//         message: 'Order already created',
//         order: {
//           orderId: existingOrder._id,
//           email: existingOrder.email,
//           plan: existingOrder.plan,
//           amount: existingOrder.amount,
//           currency: existingOrder.currency,
//           provider: existingOrder.provider,
//           sessionId: existingOrder.sessionId,
//           subscriptionId: existingOrder.subscriptionId,
//           paymentStatus: existingOrder.paymentStatus,
//           createdAt: existingOrder.createdAt,
//         },
//       });
//     }

//     // Create order in order collection
//     const order = {
//       userId: new ObjectId(userId),
//       email: user.email || decoded.email || 'unknown',
//       plan: planConfig.plan,
//       amount,
//       currency,
//       provider,
//       sessionId,
//       subscriptionId,
//       paymentStatus,
//       createdAt: new Date(),
//     };
//     console.log('Payment Success - Order object:', order);

//     let orderResult;
//     try {
//       orderResult = await ordersCollection.insertOne(order);
//       console.log('Payment Success - Order inserted successfully:', { orderId: orderResult.insertedId });
//     } catch (insertError) {
//       console.error('Payment Success - Order insertion failed:', insertError.message, insertError.stack);
//       return res.status(500).json({ error: `Order insertion error: ${insertError.message}` });
//     }

//     // Add admin notification to Firestore
//     try {
//       await addDoc(collection(firestore, 'notifications'), {
//         type: 'payment_success',
//         message: `${user.email || decoded.email || 'Unknown user'} has successfully completed a payment of $${amount} for the plan ${planConfig.plan}.`,
//         createdAt: new Date(),
//         recipientUserId: 'admin', // Replace with actual admin ID if needed
//         read: false,
//       });
//       console.log('Payment Success - Admin notification added to Firestore');
//     } catch (notificationError) {
//       console.warn('Payment Success - Failed to add admin notification:', notificationError.message, notificationError.stack);
//       // Continue despite notification failure
//     }

//     // Update user's plan and payment details
//     let updateResult;
//     try {
//       updateResult = await usersCollection.updateOne(
//         { _id: new ObjectId(userId) },
//         {
//           $set: {
//             plan: planConfig.plan,
//             updatedAt: new Date(),
//             paymentDetails: {
//               provider,
//               sessionId,
//               subscriptionId,
//               amount,
//               currency,
//               paymentStatus,
//               createdAt: new Date(),
//             },
//           },
//         }
//       );
//       console.log('Payment Success - User update result:', {
//         matchedCount: updateResult.matchedCount,
//         modifiedCount: updateResult.modifiedCount,
//       });
//       if (updateResult.matchedCount === 0) {
//         console.warn('Payment Success - User document not found for update:', userId);
//       }
//       if (updateResult.modifiedCount === 0) {
//         console.warn('Payment Success - User document not modified:', userId);
//       }
//     } catch (updateError) {
//       console.warn('Payment Success - User update failed:', updateError.message, updateError.stack);
//       // Continue despite update failure
//     }

//     return res.status(200).json({
//       message: 'Payment verified, user updated, and order created',
//       order: {
//         orderId: orderResult.insertedId,
//         email: user.email || decoded.email || 'unknown',
//         plan: planConfig.plan,
//         amount,
//         currency,
//         provider,
//         sessionId,
//         subscriptionId,
//         paymentStatus,
//         createdAt: order.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error('Payment Success - Error:', {
//       message: error.message,
//       stack: error.stack,
//     });
//     return res.status(500).json({ error: `Server error: ${error.message}` });
//   }
// }"
// "

import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import jwt from 'jsonwebtoken';
const { ObjectId } = require('mongodb');

import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal configuration
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalEnv = process.env.PAYPAL_ENV === 'sandbox'
  ? new paypal.core.SandboxEnvironment(paypalClientId, paypalClientSecret)
  : new paypal.core.LiveEnvironment(paypalClientId, paypalClientSecret);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.error('Payment Success - Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, sessionId, userId, selectedPlan } = req.body;
  console.log('Payment Success - Request:', { provider, sessionId, userId, selectedPlan });

  if (!provider || !sessionId || !selectedPlan) {
    const missingFields = [];
    if (!provider) missingFields.push('provider');
    if (!sessionId) missingFields.push('sessionId');
    if (!selectedPlan) missingFields.push('selectedPlan');
    console.error('Payment Success - Missing required fields:', missingFields);
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  let decoded = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log('Payment Success - Received Token:', token ? `${token.slice(0, 10)}...` : 'None');
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Payment Success - Decoded Token:', {
        id: decoded.id,
        email: decoded.email,
        exp: decoded.exp,
      });
    } catch (error) {
      console.error('Payment Success - Token Verification Error:', {
        message: error.message,
        name: error.name,
        token: token ? 'Present' : 'Missing',
      });
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      }
      return res.status(401).json({ error: `Invalid token: ${error.message}` });
    }
  }

  // Allow anonymous userId if token is not provided
  const effectiveUserId = decoded ? decoded.id : userId === 'anonymous' ? null : userId;
  if (effectiveUserId && decoded && decoded.id !== effectiveUserId) {
    console.error('Payment Success - Token ID mismatch:', { decodedId: decoded.id, userId });
    return res.status(403).json({ error: 'Forbidden: You can only process your own payment' });
  }

  try {
    // Connect to MongoDB
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
      console.log('Payment Success - Connected to MongoDB');
    } catch (dbError) {
      console.error('Payment Success - MongoDB connection failed:', dbError.message, dbError.stack);
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('user');
    const ordersCollection = db.collection('order');

    // Check if order collection exists
    const collections = await db.listCollections().toArray();
    const orderCollectionExists = collections.some((col) => col.name === 'order');
    console.log('Payment Success - Order collection exists:', orderCollectionExists);
    if (!orderCollectionExists) {
      console.error('Payment Success - Order collection not found');
      return res.status(500).json({ error: 'Order collection not found in database' });
    }

    // Verify user if userId is provided
    let user = null;
    if (effectiveUserId && effectiveUserId !== 'anonymous') {
      try {
        user = await usersCollection.findOne({ _id: new ObjectId(effectiveUserId) });
        console.log('Payment Success - User query result:', user ? { id: user._id, email: user.email } : 'No user found');
      } catch (userError) {
        console.error('Payment Success - User query failed:', userError.message, userError.stack);
        return res.status(500).json({ error: 'User query error' });
      }

      if (!user) {
        console.error('Payment Success - User not found:', effectiveUserId);
        return res.status(404).json({ error: 'User not found in database' });
      }
    }

    // Plan configuration
    const plans = {
      yearly: { plan: 'yearly_premium', amount: 60.0, currency: 'usd' },
      monthly: { plan: 'monthly_premium', amount: 8.0, currency: 'usd' },
    };

    const planConfig = plans[selectedPlan];
    if (!planConfig) {
      console.error('Payment Success - Invalid plan:', selectedPlan);
      return res.status(400).json({ error: `Invalid plan: ${selectedPlan}` });
    }

    let paymentStatus, subscriptionId, amount, currency;

    if (provider === 'stripe') {
      // Verify the Stripe checkout session
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
        });
        console.log('Payment Success - Stripe session retrieved:', { payment_status: session.payment_status });
      } catch (stripeError) {
        console.error('Payment Success - Stripe session retrieval failed:', stripeError.message, stripeError.stack);
        return res.status(500).json({ error: `Stripe session retrieval failed: ${stripeError.message}` });
      }

      if (session.payment_status !== 'paid') {
        console.error('Payment Success - Stripe payment not completed:', session.payment_status);
        return res.status(400).json({ error: 'Payment not completed' });
      }

      paymentStatus = session.payment_status;
      subscriptionId = session.subscription?.id || 'N/A';
      amount = session.amount_total / 100;
      currency = session.currency;
    } else if (provider === 'paypal') {
      // Verify PayPal order
      if (!paypalClientId || !paypalClientSecret) {
        console.error('Payment Success - PayPal credentials missing');
        return res.status(500).json({ error: 'PayPal credentials are missing' });
      }

      let order;
      try {
        const request = new paypal.orders.OrdersGetRequest(sessionId);
        const response = await paypalClient.execute(request);
        order = response.result;
        console.log('Payment Success - PayPal order retrieved:', { status: order.status });
      } catch (paypalError) {
        console.error('Payment Success - PayPal order retrieval failed:', paypalError.message, paypalError.stack);
        return res.status(500).json({ error: `PayPal order retrieval failed: ${paypalError.message}` });
      }

      if (order.status !== 'COMPLETED') {
        console.error('Payment Success - PayPal order not completed:', order.status);
        return res.status(400).json({ error: `PayPal order not completed: ${order.status}` });
      }

      paymentStatus = order.status.toLowerCase();
      subscriptionId = 'N/A'; // Use order ID if needed: sessionId
      amount = planConfig.amount;
      currency = planConfig.currency;
    } else {
      console.error('Payment Success - Unsupported provider:', provider);
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    // Check for existing order to prevent duplicates
    let existingOrder;
    try {
      existingOrder = await ordersCollection.findOne({ sessionId });
      console.log('Payment Success - Existing order check:', existingOrder ? existingOrder._id : 'No existing order');
    } catch (existingOrderError) {
      console.error('Payment Success - Existing order query failed:', existingOrderError.message, existingOrderError.stack);
      return res.status(500).json({ error: 'Existing order query error' });
    }

    if (existingOrder) {
      console.log('Payment Success - Order already exists:', existingOrder._id);
      return res.status(200).json({
        message: 'Order already created',
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
          createdAt: existingOrder.createdAt,
        },
      });
    }

    // Create order in order collection
    const order = {
      userId: effectiveUserId ? new ObjectId(effectiveUserId) : null,
      email: user?.email || decoded?.email || 'anonymous',
      plan: planConfig.plan,
      amount,
      currency,
      provider,
      sessionId,
      subscriptionId,
      paymentStatus,
      createdAt: new Date(),
    };
    console.log('Payment Success - Order object:', order);

    let orderResult;
    try {
      orderResult = await ordersCollection.insertOne(order);
      console.log('Payment Success - Order inserted successfully:', { orderId: orderResult.insertedId });
    } catch (insertError) {
      console.error('Payment Success - Order insertion failed:', insertError.message, insertError.stack);
      return res.status(500).json({ error: `Order insertion error: ${insertError.message}` });
    }

    // Add admin notification to Firestore
    try {
      await addDoc(collection(firestore, 'notifications'), {
        type: 'payment_success',
        message: `${user?.email || decoded?.email || 'Anonymous user'} has successfully completed a payment of $${amount} for the plan ${planConfig.plan}.`,
        createdAt: new Date(),
        recipientUserId: 'admin', // Replace with actual admin ID if needed
        read: false,
      });
      console.log('Payment Success - Admin notification added to Firestore');
    } catch (notificationError) {
      console.warn('Payment Success - Failed to add admin notification:', notificationError.message, notificationError.stack);
      // Continue despite notification failure
    }

    // Update user's plan and payment details if user exists
    if (effectiveUserId && user) {
      let updateResult;
      try {
        updateResult = await usersCollection.updateOne(
          { _id: new ObjectId(effectiveUserId) },
          {
            $set: {
              plan: planConfig.plan,
              updatedAt: new Date(),
              paymentDetails: {
                provider,
                sessionId,
                subscriptionId,
                amount,
                currency,
                paymentStatus,
                createdAt: new Date(),
              },
            },
          }
        );
        console.log('Payment Success - User update result:', {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
        });
        if (updateResult.matchedCount === 0) {
          console.warn('Payment Success - User document not found for update:', effectiveUserId);
        }
        if (updateResult.modifiedCount === 0) {
          console.warn('Payment Success - User document not modified:', effectiveUserId);
        }
      } catch (updateError) {
        console.warn('Payment Success - User update failed:', updateError.message, updateError.stack);
        // Continue despite update failure
      }
    }

    return res.status(200).json({
      message: 'Payment verified, user updated, and order created',
      order: {
        orderId: orderResult.insertedId,
        email: user?.email || decoded?.email || 'anonymous',
        plan: planConfig.plan,
        amount,
        currency,
        provider,
        sessionId,
        subscriptionId,
        paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Payment Success - Error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
}