import { getSession } from 'next-auth/react';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../lib/session";

// Generate a random CAPTCHA
const generateCaptcha = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

const handler = async (req, res) => {
  const session = await getSession({ req });

  if (req.method === 'GET') {
    // Generate and store the CAPTCHA in the session
    const captcha = generateCaptcha();
    session.captcha = captcha;
    await session.save();
    res.status(200).json({ captcha });

  } else if (req.method === 'POST') {
    // Verify the CAPTCHA
    const { captcha } = req.body;
    if (captcha === session.captcha) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }

  } else {
    res.status(405).end(); // Method Not Allowed
  }
};

export default withIronSessionApiRoute(handler, sessionOptions);
