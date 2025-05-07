// pages/api/create-paypal-order.js
const paypal = require('@paypal/checkout-server-sdk');
const jwt = require('jsonwebtoken'); // Add JWT for token verification

// Log environment variables for debugging
console.log('PayPal Client ID:', process.env.PAYPAL_CLIENT_ID);
console.log('PayPal Client Secret:', process.env.PAYPAL_CLIENT_SECRET);

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.error('PayPal credentials are missing or undefined');
  throw new Error('PayPal credentials are missing or undefined');
}

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { selectedPlan, userId } = req.body;
  console.log('Create PayPal Order Request:', { selectedPlan, userId });

  // Validate request body
  if (!selectedPlan || !userId) {
    const missingFields = [];
    if (!selectedPlan) missingFields.push('selectedPlan');
    if (!userId) missingFields.push('userId');
    return res.status(400).json({ 
      error: `Missing required fields: ${missingFields.join(' and ')} are required` 
    });
  }

  // Ensure the userId matches the token's user
  if (decoded.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: You can only create orders for your own account' });
  }

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: selectedPlan === 'yearly' ? '60.00' : '8.00',
          },
          description: `Ytubetools ${selectedPlan} plan`,
          custom_id: userId,
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
        brand_name: 'Ytubetools',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    });

    const order = await client.execute(request);
    console.log('PayPal Order Created:', order.result);
    return res.status(200).json({ id: order.result.id });
  } catch (error) {
    console.error('PayPal Order Creation Error:', error.message);
    if (error.response && error.response.details) {
      console.error('Error Details:', error.response.details);
    }
    return res.status(500).json({ error: error.message, details: error.response?.details || null });
  }
}