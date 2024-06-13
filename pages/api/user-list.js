import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      // Log token size
      console.log('Token size:', token ? token.length : 'No token');

      // Reassemble token if it is too large
      let fullToken = token;
      if (token && token.length > 5000) {
        const chunk1 = req.headers['x-token-chunk'];
        const chunk2 = req.headers['x-token-rest'];
        fullToken = `${chunk1}${chunk2}`;
      }

      // Verify the reassembled token
      let decodedToken;
      try {
        decodedToken = jwt.verify(fullToken, process.env.NEXT_PUBLIC_JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      // Connect to the database
      const { db } = await connectToDatabase();

      // Fetch all users
      const users = await db.collection('user').find({}).toArray();

      // Return the users
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      // Return an error response
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    // Return a method not allowed response
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Method ${method} not allowed` });
  }
}
