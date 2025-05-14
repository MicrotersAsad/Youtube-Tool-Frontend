// // pages/api/create-paypal-order.js
// const paypal = require('@paypal/checkout-server-sdk');
// const jwt = require('jsonwebtoken'); // Add JWT for token verification

// // Log environment variables for debugging
// console.log('PayPal Client ID:', process.env.PAYPAL_CLIENT_ID);
// console.log('PayPal Client Secret:', process.env.PAYPAL_CLIENT_SECRET);

// if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
//   console.error('PayPal credentials are missing or undefined');
//   throw new Error('PayPal credentials are missing or undefined');
// }

// const environment = new paypal.core.SandboxEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_CLIENT_SECRET
// );
// const client = new paypal.core.PayPalHttpClient(environment);

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   // Verify the JWT token
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Authorization header missing or invalid' });
//   }

//   const token = authHeader.split(' ')[1];
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
//   } catch (error) {
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }

//   const { selectedPlan, userId } = req.body;
//   console.log('Create PayPal Order Request:', { selectedPlan, userId });

//   // Validate request body
//   if (!selectedPlan || !userId) {
//     const missingFields = [];
//     if (!selectedPlan) missingFields.push('selectedPlan');
//     if (!userId) missingFields.push('userId');
//     return res.status(400).json({ 
//       error: `Missing required fields: ${missingFields.join(' and ')} are required` 
//     });
//   }

//   // Ensure the userId matches the token's user
//   if (decoded.id !== userId) {
//     return res.status(403).json({ error: 'Forbidden: You can only create orders for your own account' });
//   }

//   try {
//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer('return=representation');
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [
//         {
//           amount: {
//             currency_code: 'USD',
//             value: selectedPlan === 'yearly' ? '60.00' : '8.00',
//           },
//           description: `Ytubetools ${selectedPlan} plan`,
//           custom_id: userId,
//         },
//       ],
//       application_context: {
//         return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
//         cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
//         brand_name: 'Ytubetools',
//         shipping_preference: 'NO_SHIPPING',
//         user_action: 'PAY_NOW',
//       },
//     });

//     const order = await client.execute(request);
//     console.log('PayPal Order Created:', order.result);
//     return res.status(200).json({ id: order.result.id });
//   } catch (error) {
//     console.error('PayPal Order Creation Error:', error.message);
//     if (error.response && error.response.details) {
//       console.error('Error Details:', error.response.details);
//     }
//     return res.status(500).json({ error: error.message, details: error.response?.details || null });
//   }
// }
import { connectToDatabase } from '../../utils/mongodb';
const paypal = require('@paypal/checkout-server-sdk');
const jwt = require('jsonwebtoken');

// Validate environment variables
const validateEnvironment = () => {
  const requiredEnvVars = ['NEXT_PUBLIC_JWT_SECRET', 'NEXT_PUBLIC_BASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Initialize PayPal client from paymentConfig
const initializePaypalClient = async (db) => {
  const configCollection = db.collection('paymentConfig');
  const paypalCfg = await configCollection.findOne({ key: 'paypal_config' });

  const PAYPAL_CLIENT_ID = paypalCfg?.config?.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = paypalCfg?.config?.PAYPAL_CLIENT_SECRET;

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error('PayPal credentials missing in paymentConfig');
    throw new Error('PayPal credentials missing in paymentConfig');
  }

  console.log('PayPal Client ID:', PAYPAL_CLIENT_ID);
  console.log('PayPal Client Secret:', PAYPAL_CLIENT_SECRET);

  const environment = new paypal.core.SandboxEnvironment(
    PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET
  );
  return new paypal.core.PayPalHttpClient(environment);
};

// Validate request
const validateRequest = (req) => {
  if (req.method !== 'POST') {
    throw { status: 405, message: 'Method not allowed' };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, message: 'Authorization header missing or invalid' };
  }

  const { selectedPlan, userId } = req.body;
  const missingFields = [];
  if (!selectedPlan) missingFields.push('selectedPlan');
  if (!userId) missingFields.push('userId');
  if (missingFields.length > 0) {
    throw {
      status: 400,
      message: `Missing required fields: ${missingFields.join(' and ')} are required`
    };
  }

  // Validate selectedPlan value
  if (!['monthly', 'yearly'].includes(selectedPlan)) {
    throw { status: 400, message: 'Invalid selectedPlan value' };
  }

  return { token: authHeader.split(' ')[1], selectedPlan, userId };
};

// Verify JWT token
const verifyToken = (token, userId) => {
  try {
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    if (String(decoded.id) !== String(userId)) {
      throw { status: 403, message: 'Forbidden: You can only create orders for your own account' };
    }
    return decoded;
  } catch (error) {
    throw {
      status: 401,
      message: 'Invalid or expired token',
      details: error.message
    };
  }
};

// Create PayPal order
const createPaypalOrder = async (client, selectedPlan, userId) => {
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
        custom_id: String(userId),
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
  return order.result;
};

export default async function handler(req, res) {
  try {
    validateEnvironment();
    const { token, selectedPlan, userId } = validateRequest(req);
    verifyToken(token, userId);

    const { db } = await connectToDatabase();
    const paypalClient = await initializePaypalClient(db);
    const order = await createPaypalOrder(paypalClient, selectedPlan, userId);

    console.log('PayPal Order Created:', {
      orderId: order.id,
      selectedPlan,
      userId
    });

    return res.status(200).json({ id: order.id });
  } catch (error) {
    console.error('PayPal Order Creation Error:', {
      message: error.message,
      status: error.status || 500,
      details: error.details || error.response?.details || 'No additional details'
    });

    return res.status(error.status || 500).json({
      error: error.message || 'Internal server error',
      details: error.details || error.response?.details || null
    });
  }
}