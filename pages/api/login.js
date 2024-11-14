import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import geoip from 'geoip-lite';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, recaptchaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!process.env.NEXT_PUBLIC_JWT_SECRET || !process.env.GOOGLE_RECAPTCHA_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const { db } = await connectToDatabase();
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      // Check failed login attempts
      const attemptRecord = await db.collection('failed_logins').findOne({ ipAddress });

      if (attemptRecord && attemptRecord.blockUntil && new Date() < new Date(attemptRecord.blockUntil)) {
        return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
      }

      // Verify reCAPTCHA
      const reCaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `secret=${process.env.GOOGLE_RECAPTCHA_SECRET}&response=${recaptchaToken}`
      });
      const reCaptchaData = await reCaptchaResponse.json();

      if (!reCaptchaData.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed' });
      }

      const user = await db.collection('user').findOne({ email });
      if (!user) {
        await handleFailedAttempt(db, ipAddress);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await handleFailedAttempt(db, ipAddress);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Successful login, reset failed attempts
      await db.collection('failed_logins').deleteOne({ ipAddress });

      const token = jwt.sign(
        { id: user._id, email: user.email, username: user.username, role: user.role },
        process.env.NEXT_PUBLIC_JWT_SECRET,
        { expiresIn: '1h' }
      );

      const userAgent = req.headers['user-agent'];
      const browser = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Other";
      const os = userAgent.includes("Windows") ? "Windows" : userAgent.includes("Mac") ? "MacOS" : "Other";

      let country = 'Unknown';
      if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
        const geo = geoip.lookup(ipAddress);
        country = geo && geo.country ? geo.country : 'Unknown';
      } else {
        country = 'Localhost';
      }

      await db.collection('login_logs').insertOne({
        userId: user._id,
        userName: user.username,
        ipAddress,
        browser,
        os,
        country,
        timestamp: new Date(),
      });

      return res.status(200).json({
        message: 'Login successful',
        token,
        loginInfo: {
          ipAddress,
          browser,
          os,
          country,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const logs = await db.collection('login_logs').find({}).toArray();
      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching login logs:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Helper function to handle failed attempts
async function handleFailedAttempt(db, ipAddress) {
  const record = await db.collection('failed_logins').findOne({ ipAddress });
  if (record) {
    if (record.attempts >= 2) {
      await db.collection('failed_logins').updateOne(
        { ipAddress },
        { $set: { attempts: record.attempts + 1, blockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
      );
    } else {
      await db.collection('failed_logins').updateOne(
        { ipAddress },
        { $inc: { attempts: 1 } }
      );
    }
  } else {
    await db.collection('failed_logins').insertOne({ ipAddress, attempts: 1 });
  }
}
