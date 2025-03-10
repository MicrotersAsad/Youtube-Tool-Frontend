// import jwt from 'jsonwebtoken';
// import { connectToDatabase } from '../../utils/mongodb';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
//   apiVersion: '2020-08-27',
// });

// export default async (req, res) => {
//   if (req.method === 'POST') {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }

//     const token = authHeader.split(' ')[1];
//     let user;

//     try {
//       user = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
//     } catch (error) {
//       return res.status(401).json({ error: 'Invalid token' });
//     }

//     const { sessionId } = req.body;

//     try {
//       const { db } = await connectToDatabase();

//       const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
//         expand: ['subscription'],
//       });

//       const subscription = stripeSession.subscription;
//       const metadata = stripeSession.metadata;
// console.log(metadata);
//       const updateData = {
//         paymentStatus: 'success',
//         stripeSessionId: sessionId,
//         stripeCustomerId: stripeSession.customer,
//         subscriptionPlan: metadata.plan,
//         metadata:stripeSession.metadata,
//         subscriptionValidUntil: new Date(subscription.current_period_end * 1000), // Subscription end date
//         paymentDetails: {
//           amountPaid: stripeSession.amount_total / 100,
//           currency: stripeSession.currency,
//           paymentMethod: stripeSession.payment_method_types[0],
//         },
//       };
// console.log(updateData);
//       await db.collection('user').updateOne(
//         { email: user.email },
//         { $set: updateData }
//       );

//       res.status(200).json({ message: 'Payment status updated to success' });
//     } catch (error) {
//       console.error('Failed to update payment status:', error);
//       res.status(500).json({ error: 'Failed to update payment status' });
//     }
//   } else {
//     res.setHeader('Allow', 'POST');
//     res.status(405).end('Method Not Allowed');
//   }
// };
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../utils/mongodb';
import Stripe from 'stripe';
import { firestore } from '../../lib/firebase'; // Firestore setup
import { collection, addDoc } from 'firebase/firestore'; // Firestore methods

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export default async (req, res) => {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    let user;

    try {
      user = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { sessionId } = req.body;

    try {
      const { db } = await connectToDatabase();

      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      const subscription = stripeSession.subscription;
      const metadata = stripeSession.metadata;

      const updateData = {
        paymentStatus: 'success',
        stripeSessionId: sessionId,
        stripeCustomerId: stripeSession.customer,
        subscriptionPlan: metadata.plan,
        subscriptionValidUntil: new Date(subscription.current_period_end * 1000), // Subscription end date
        paymentDetails: {
          amountPaid: stripeSession.amount_total / 100,
          currency: stripeSession.currency,
          paymentMethod: stripeSession.payment_method_types[0],
        },
      };

      // Update user in the database
      await db.collection('user').updateOne(
        { email: user.email },
        { $set: updateData }
      );

      // Add notification for the admin
      await addDoc(collection(firestore, 'notifications'), {
        type: 'payment_success',
        message: `${user.email} has successfully completed a payment of $${stripeSession.amount_total / 100} for the plan ${metadata.plan}.`,
        createdAt: new Date(),
        recipientUserId: 'admin', // Replace 'admin' with your admin ID if applicable
        read: false,
      });

      res.status(200).json({ message: 'Payment status updated to success' });
    } catch (error) {
      console.error('Failed to update payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
