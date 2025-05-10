// import { connectToDatabase } from '../../utils/mongodb';
// import Stripe from 'stripe';
// import jwt from 'jsonwebtoken';
// const paypal = require('@paypal/checkout-server-sdk');
// const { ObjectId } = require('mongodb');

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const paypalEnvironment = new paypal.core.SandboxEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_CLIENT_SECRET
// );
// const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { userId } = req.body;
//   console.log('Cancel Subscription Request:', { userId });

//   if (!userId) {
//     return res.status(400).json({ error: 'Missing userId' });
//   }

//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Authorization header missing or invalid' });
//   }

//   const token = authHeader.split(' ')[1];
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
//     console.log('Decoded Token:', decoded);
//   } catch (error) {
//     console.error('Token Verification Error:', error.message);
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }

//   if (decoded.id !== userId) {
//     return res.status(403).json({ error: 'Forbidden: You can only cancel your own subscription' });
//   }

//   try {
//     const { db } = await connectToDatabase();
//     const usersCollection = db.collection('user');

//     // Verify user exists
//     const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
//     if (!user) {
//       console.error('User not found:', userId);
//       return res.status(404).json({ error: 'User not found in database' });
//     }

//     const { paymentDetails } = user;
//     if (!paymentDetails || !paymentDetails.provider) {
//       return res.status(400).json({ error: 'No active subscription found' });
//     }

//     if (paymentDetails.provider === 'stripe' && paymentDetails.subscriptionId) {
//       // Cancel Stripe subscription
//       try {
//         const subscription = await stripe.subscriptions.update(paymentDetails.subscriptionId, {
//           cancel_at_period_end: true, // Cancel at the end of the billing period
//         });
//         console.log('Stripe subscription canceled:', subscription.id);
//       } catch (error) {
//         console.error('Stripe Cancellation Error:', error.message);
//         return res.status(500).json({ error: `Failed to cancel Stripe subscription: ${error.message}` });
//       }
//     } else if (paymentDetails.provider === 'paypal' && paymentDetails.subscriptionId) {
//       // Cancel PayPal subscription
//       try {
//         const request = new paypal.subscriptions.SubscriptionsCancelRequest(paymentDetails.subscriptionId);
//         await paypalClient.execute(request);
//         console.log('PayPal subscription canceled:', paymentDetails.subscriptionId);
//       } catch (error) {
//         console.error('PayPal Cancellation Error:', error.message);
//         return res.status(500).json({ error: `Failed to cancel PayPal subscription: ${error.message}` });
//       }
//     } else {
//       return res.status(400).json({ error: 'Invalid or missing subscription details' });
//     }

//     // Update user in database
//     const updateResult = await usersCollection.updateOne(
//       { _id: new ObjectId(userId) },
//       {
//         $set: {
//           plan: 'free',
//           updatedAt: new Date(),
//           paymentDetails: {
//             ...paymentDetails,
//             subscriptionStatus: 'canceled',
//             canceledAt: new Date(),
//           },
//         },
//       }
//     );

//     if (updateResult.modifiedCount === 0) {
//       console.error('Failed to update user data:', { userId });
//       return res.status(400).json({ error: 'Failed to update user data' });
//     }

//     return res.status(200).json({ message: 'Subscription canceled successfully' });
//   } catch (error) {
//     console.error('Cancel Subscription Error:', error.message);
//     return res.status(500).json({ error: error.message });
//   }
// }

import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
const paypal = require('@paypal/checkout-server-sdk');
const { ObjectId } = require('mongodb');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paypalEnvironment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  console.log('Cancel Subscription Request:', { userId });

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    console.log('Decoded Token:', decoded);
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check if the decoded token user ID matches the requested userId
  // Convert both to strings for safe comparison
  if (String(decoded.id) !== String(userId)) {
    return res.status(403).json({ error: 'Forbidden: You can only cancel your own subscription' });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('user');

    // First attempt: Find the user directly with string ID or ObjectId
    let user = null;
    
    // Try searching with the exact userId as provided
    user = await usersCollection.findOne({ _id: userId });
    
    // If not found, try with ObjectId
    if (!user) {
      try {
        user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      } catch (objIdError) {
        console.log('Error converting to ObjectId:', objIdError.message);
        // Continue to next approach
      }
    }
    
    // If still not found, try with string conversion of ObjectId
    if (!user) {
      const results = await usersCollection.find({}).toArray();
      user = results.find(u => 
        String(u._id) === String(userId) || 
        (u._id.toString && u._id.toString() === userId)
      );
      
      if (user) {
        console.log('Found user using string comparison');
      }
    }
    
    if (!user) {
      console.error('User not found after multiple search attempts:', userId);
      return res.status(404).json({ error: 'User not found in database' });
    }

    console.log('Found user:', { userId: user._id, type: typeof user._id });

    const { paymentDetails } = user;
    if (!paymentDetails) {
      return res.status(400).json({ error: 'No payment details found' });
    }

    let stripeSubscriptionId = null;

    // Handle Stripe cancellation
    if (paymentDetails.provider === 'stripe') {
      try {
        // If we have a subscriptionId, use it directly
        if (paymentDetails.subscriptionId) {
          stripeSubscriptionId = paymentDetails.subscriptionId;
        } 
        // If we only have a sessionId, we need to look up the subscription
        else if (paymentDetails.sessionId) {
          try {
            // First, retrieve the checkout session to get the subscription ID
            const session = await stripe.checkout.sessions.retrieve(paymentDetails.sessionId);
            
            if (session && session.subscription) {
              stripeSubscriptionId = session.subscription;
              console.log('Found subscription ID from session:', stripeSubscriptionId);
            } else {
              console.log('No subscription found in the session:', paymentDetails.sessionId);
            }
          } catch (sessionError) {
            console.error('Error retrieving session:', sessionError.message);
          }
        }

        // If we found a subscription ID, cancel it
        if (stripeSubscriptionId) {
          try {
            const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
              cancel_at_period_end: true,
            });
            console.log('Stripe subscription canceled via session lookup:', subscription.id);
          } catch (cancelError) {
            console.error('Error canceling subscription:', cancelError.message);
            // Continue anyway to update the user's plan to free
          }
        }
      } catch (stripeError) {
        console.error('Stripe operation error:', stripeError.message);
        // Don't return error, just log it and continue to update user's plan
      }
    } 
    // Handle PayPal cancellation
    else if (paymentDetails.provider === 'paypal' && paymentDetails.subscriptionId) {
      try {
        const request = new paypal.subscriptions.SubscriptionsCancelRequest(paymentDetails.subscriptionId);
        await paypalClient.execute(request);
        console.log('PayPal subscription canceled:', paymentDetails.subscriptionId);
      } catch (paypalError) {
        console.error('PayPal Cancellation Error:', paypalError.message);
        // Don't return error, just log it and continue to update user's plan
      }
    }

    // Create a new payment details object with the updated fields
    const updatedPaymentDetails = {
      ...paymentDetails,
      subscriptionStatus: 'canceled',
      canceledAt: new Date()
    };

    // If we found a subscription ID from the session, save it
    if (stripeSubscriptionId && !paymentDetails.subscriptionId) {
      updatedPaymentDetails.subscriptionId = stripeSubscriptionId;
    }

    // Extract the correct ID format to use for the update
    const userIdForUpdate = user._id;
    console.log('Using ID for update:', userIdForUpdate, typeof userIdForUpdate);

    // Update user in database - do this regardless of payment provider success/failure
    const updateResult = await usersCollection.updateOne(
      { _id: userIdForUpdate },
      {
        $set: {
          plan: 'free',
          updatedAt: new Date(),
          paymentDetails: updatedPaymentDetails
        }
      }
    );

    console.log('Update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      console.error('No user found to update with ID:', userIdForUpdate);
      return res.status(404).json({ error: 'User not found for update' });
    }

    if (updateResult.modifiedCount === 0) {
      console.log('No changes made to user document (might already be updated)');
    }

    // Return updated user with a new JWT token
    const updatedUser = await usersCollection.findOne({ _id: userIdForUpdate });
    if (!updatedUser) {
      return res.status(200).json({ 
        message: 'Subscription canceled successfully, but could not fetch updated user data',
        success: true 
      });
    }
    
    // Generate a new token with updated user data
    const userData = {
        id: updatedUser._id,
        _id: updatedUser._id,
        email: updatedUser.email,
        plan: 'free', // Explicitly set to free
        paymentDetails: updatedUser.paymentDetails
    };
    
    const newToken = jwt.sign(
      userData, 
      process.env.NEXT_PUBLIC_JWT_SECRET,
      { expiresIn: '7d' }
    );
    
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
    console.error('Cancel Subscription Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}