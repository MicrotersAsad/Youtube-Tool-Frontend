import { connectToDatabase } from '../../utils/mongodb';
const paypal = require('@paypal/checkout-server-sdk');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, userId, selectedPlan } = req.body;
  console.log('Capture PayPal Order Request:', { orderID, userId, selectedPlan });

  if (!orderID || !userId || !selectedPlan) {
    const missingFields = [];
    if (!orderID) missingFields.push('orderID');
    if (!userId) missingFields.push('userId');
    if (!selectedPlan) missingFields.push('selectedPlan');
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
  } catch (error) {
    console.error('Token Verification Error:', error.message);
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
      const usersCollection = db.collection('user');

      // Verify user exists
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ error: 'User not found in database' });
      }

      // Get payment details from capture
      const purchaseUnit = capture.result.purchase_units[0];
      const amount = purchaseUnit.payments.captures[0].amount;
      const plan = selectedPlan === 'yearly' ? 'yearly_premium' : 'monthly_premium';

      // Update user's plan and payment details
      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            plan,
            updatedAt: new Date(),
            paymentDetails: {
              provider: 'paypal',
              orderId: orderID,
              captureId: capture.result.id,
              amount: parseFloat(amount.value),
              currency: amount.currency_code,
              paymentStatus: capture.result.status.toLowerCase(),
              createdAt: new Date(),
            },
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        console.error('Failed to update user data:', { userId, selectedPlan });
        return res.status(400).json({ error: 'Failed to update user data' });
      }

      // Return order details for redirect
      return res.status(200).json({
        message: 'Payment captured and user updated',
        order: {
          orderId: capture.result.id,
          plan,
          amount: parseFloat(amount.value),
          currency: amount.currency_code,
          provider: 'paypal',
          sessionId: orderID,
        },
      });
    } else {
      return res.status(400).json({ error: `Payment not completed: ${capture.result.status}` });
    }
  } catch (error) {
    console.error('PayPal Capture Error:', error.message, error.stack);
    return res.status(500).json({ error: `PayPal capture failed: ${error.message}` });
  }
}