// pages/api/capture-paypal-order.js
const paypal = require('@paypal/checkout-server-sdk');

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, userId } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (decoded.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: You can only capture your own payment' });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client.execute(request);

    if (capture.result.status === 'COMPLETED') {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');
      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { plan: userId === 'yearly' ? 'yearly_premium' : 'monthly_premium', updatedAt: new Date() } }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ error: 'Failed to update user data' });
      }

      return res.status(200).json({ message: 'Payment captured and user updated' });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('PayPal Capture Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}