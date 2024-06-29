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
      { id: user._id, email: user.email,  username: user.username, role: user.role },
      process.env.NEXT_PUBLIC_JWT_SECRET,
      { expiresIn: '1d' } // Reasonable expiration time
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
