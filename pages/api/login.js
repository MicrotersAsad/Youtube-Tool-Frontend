// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import { connectToDatabase } from '../../utils/mongodb';

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: 'Email and password are required' });
//   }

//   if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
//     return res.status(500).json({ message: 'Server configuration error' });
//   }

//   try {
//     const { db } = await connectToDatabase();
//     const user = await db.collection('user').findOne({ email });

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     const token = jwt.sign(
//       { id: user._id, email: user.email, username: user.username, profileImage: user.profileImage, role: user.role },
//       process.env.NEXT_PUBLIC_JWT_SECRET,
//       { expiresIn: '1y' }
//     );

//     return res.status(200).json({ message: 'Login successful', token });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    // Get country using IP address
    let country = "Unknown"; // Default value
    if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
      try {
        const countryResponse = await fetch(`https://ipapi.co/${ipAddress}/country/`);
        if (!countryResponse.ok) {
          throw new Error("Failed to fetch country information");
        }
        country = await countryResponse.text();
      } catch (error) {
        console.error("Error fetching country:", error);
      }
    } else {
      country = "Localhost"; // Or set a default value for local testing
    }

    // Store login info in the database
    await db.collection('login_logs').insertOne({
      userId: user._id,
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
}
