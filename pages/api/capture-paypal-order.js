import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
const paypal = require('@paypal/checkout-server-sdk');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, userId, selectedPlan } = req.body;

  if (!orderID || !userId || !selectedPlan) {
    const missing = [];
    if (!orderID) missing.push("orderID");
    if (!userId) missing.push("userId");
    if (!selectedPlan) missing.push("selectedPlan");
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (decoded.id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // ✅ 1. Load PayPal credentials from database
    const { db } = await connectToDatabase();
    const configDoc = await db.collection('paymentConfig').findOne({ key: 'paypal_config' });

    if (!configDoc || !configDoc.config) {
      return res.status(500).json({ error: 'PayPal configuration not found' });
    }

    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = configDoc.config;
    console.log('PayPal Client ID:', PAYPAL_CLIENT_ID);
    console.log('PayPal Client Secret:', PAYPAL_CLIENT_SECRET);
    

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Missing PayPal credentials in config' });
    }

    // ✅ 2. Setup PayPal Client with DB config
    const environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
    const client = new paypal.core.PayPalHttpClient(environment);

    // ✅ 3. Execute capture
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client.execute(request);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({ error: `Payment not completed: ${capture.result.status}` });
    }

    const usersCollection = db.collection('user');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const amount = capture.result.purchase_units[0].payments.captures[0].amount;
    const plan = selectedPlan === 'yearly' ? 'yearly_premium' : 'monthly_premium';

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
      return res.status(400).json({ error: 'Failed to update user data' });
    }

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

  } catch (error) {
    console.error('Capture Error:', error.message);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
}
