// pages/api/paymentConfig.js

import { connectToDatabase } from '../../utils/mongodb';

// Authorization Checker (Bearer token)
function checkAuthorization(req) {
  const token = req.headers.authorization?.split(" ")[1];
  const validToken = process.env.AUTH_TOKEN;
  return token && token === validToken;
}

export default async function handler(req, res) {
  const { method } = req;

  if (!checkAuthorization(req)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  const { db } = await connectToDatabase();
  const paymentCollection = db.collection("paymentConfig");

  if (method === "GET") {
    try {
      const results = await paymentCollection.find({
        key: { $in: ["stripe_config", "paypal_config"] },
      }).toArray();

      const data = {};
      results.forEach((item) => {
        if (item.key === "stripe_config") data.stripe = item.config;
        if (item.key === "paypal_config") data.paypal = item.config;
      });

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("GET error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch configs" });
    }
  }

  if (method === "POST") {
    const { stripe, paypal } = req.body;

    try {
      const ops = [];

      if (stripe) {
        ops.push(paymentCollection.updateOne(
          { key: "stripe_config" },
          {
            $set: {
              name: "Stripe Config",
              key: "stripe_config",
              status: "Enabled",
              config: stripe,
            },
          },
          { upsert: true }
        ));
      }

      if (paypal) {
        ops.push(paymentCollection.updateOne(
          { key: "paypal_config" },
          {
            $set: {
              name: "PayPal Config",
              key: "paypal_config",
              status: "Enabled",
              config: paypal,
            },
          },
          { upsert: true }
        ));
      }

      await Promise.all(ops);
      return res.status(200).json({ success: true, message: "Configuration saved" });
    } catch (err) {
      console.error("POST error:", err);
      return res.status(500).json({ success: false, message: "Failed to save configs" });
    }
  }

  if (method === "PUT") {
    const { key, config } = req.body;

    if (!key || !config) {
      return res.status(400).json({ success: false, message: "Key and config are required" });
    }

    try {
      const result = await paymentCollection.updateOne(
        { key },
        {
          $set: {
            config,
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Configuration not found" });
      }

      return res.status(200).json({ success: true, message: "Configuration updated" });
    } catch (err) {
      console.error("PUT error:", err);
      return res.status(500).json({ success: false, message: "Failed to update config" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).end(`Method ${method} Not Allowed`);
}
