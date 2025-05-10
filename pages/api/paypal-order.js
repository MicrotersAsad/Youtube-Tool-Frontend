import { connectToDatabase } from '../../utils/mongodb';
const paypal = require('@paypal/checkout-server-sdk');

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: 'Missing order_id' });
  }

  try {
    const request = new paypal.orders.OrdersGetRequest(order_id);
    const order = await client.execute(request);

    const purchaseUnit = order.result.purchase_units[0];
    const capture = purchaseUnit.payments.captures[0];

    return res.status(200).json({
      customer_email: order.result.payer.email_address,
      amount: parseFloat(capture.amount.value),
      amount_total: parseFloat(capture.amount.value) * 100, // Convert to cents for consistency
      currency: capture.amount.currency_code,
      payment_status: order.result.status,
      metadata: { plan: purchaseUnit.description.includes('yearly') ? 'yearly' : 'monthly' },
    });
  } catch (error) {
    console.error('PayPal Order Retrieval Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}