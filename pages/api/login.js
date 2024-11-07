import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import geoip from 'geoip-lite';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const { db } = await connectToDatabase();
      const user = await db.collection('user').findOne({ email });

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, username: user.username, role: user.role },
        process.env.NEXT_PUBLIC_JWT_SECRET,
        { expiresIn: '1y' }
      );

      // Get user's IP address
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      // Get browser and OS from User-Agent
      const userAgent = req.headers['user-agent'];
      const browser = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Other";
      const os = userAgent.includes("Windows") ? "Windows" : userAgent.includes("Mac") ? "MacOS" : "Other";

      // Use geoip-lite to get the country
      let country = 'Unknown';
      if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
        const geo = geoip.lookup(ipAddress);
        country = geo && geo.country ? geo.country : 'Unknown';
      } else {
        country = 'Localhost';
      }

      // Store login info in the database
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
