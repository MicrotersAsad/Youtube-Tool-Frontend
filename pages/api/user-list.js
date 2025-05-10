// import { connectToDatabase } from '../../utils/mongodb';
// import jwt from 'jsonwebtoken';

// export default async function handler(req, res) {
//   const { method } = req;

//   if (method === 'GET') {
//     try {
//       const token = req.headers.authorization?.split(' ')[1];

//       // Log token size
//       console.log('Token size:', token ? token.length : 'No token');

//       // Reassemble token if it is too large
//       let fullToken = token;
//       if (token && token.length > 5000) {
//         const chunk1 = req.headers['x-token-chunk'];
//         const chunk2 = req.headers['x-token-rest'];
//         fullToken = `${chunk1}${chunk2}`;
//       }

//       // Verify the reassembled token
//       let decodedToken;
//       try {
//         decodedToken = jwt.verify(fullToken, process.env.NEXT_PUBLIC_JWT_SECRET);
//       } catch (error) {
//         return res.status(401).json({ success: false, message: 'Invalid token' });
//       }

//       // Connect to the database
//       const { db } = await connectToDatabase();

//       // Fetch all users
//       const users = await db.collection('user').find({}).toArray();

//       // Return the users
//       res.status(200).json({ success: true, data: users });
//     } catch (error) {
//       // Return an error response
//       res.status(500).json({ success: false, message: error.message });
//     }
//   } else {
//     // Return a method not allowed response
//     res.setHeader('Allow', ['GET']);
//     res.status(405).json({ success: false, message: `Method ${method} not allowed` });
//   }
// }
import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
  }

  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Log token for debugging (avoid logging full token in production)
    console.log('Token received:', token.substring(0, 10) + '...');

    // Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
      console.log('Decoded Token:', { id: decodedToken.id }); // Debug: Log token ID
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Connect to the database
    const { db } = await connectToDatabase();

    // Fetch single user by _id
    const user = await db.collection('user').findOne({
      _id: new ObjectId(decodedToken.id),
    });

    if (!user) {
      console.warn('User not found for ID:', decodedToken.id);
      return res.status(404).json({
        success: false,
        message: `User not found for ID: ${decodedToken.id}`,
      });
    }

    // Return the single user
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}