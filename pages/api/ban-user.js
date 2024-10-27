import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { sendBanEmail } from '../../utils/sendBanEmail'; // Import your email sending utility

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Verify JWT token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const decodedToken = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);

      if (!decodedToken || decodedToken.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Unauthorized - Admin access required' });
      }

      // Extract the userId and ban reason from the request body
      const { userId, reason } = req.body;
      if (!userId || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'User ID and reason are required' });
      }

      // Connect to the database
      const { db } = await connectToDatabase();

      // Fetch the user's information from the user collection
      const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Insert user information into the ban_user collection
      const banResult = await db.collection('ban_user').insertOne({
        userId: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        reason,
        banDate: new Date(),
        bannedBy: decodedToken.email, // The admin who performed the ban
      });

      if (!banResult.insertedId) {
        return res.status(500).json({ success: false, message: 'Failed to add user to banned list' });
      }

      // Send an email notification to the banned user
      await sendBanEmail(user.email, user.username, reason);

      // Remove the banned user from the user collection
      await db.collection('user').deleteOne({ _id: new ObjectId(userId) });

      res.status(200).json({ success: true, message: 'User banned, added to ban_user collection, and notified successfully' });
    } catch (error) {
      console.error('Error banning user:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      // Verify JWT token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const decodedToken = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);

      if (!decodedToken || decodedToken.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Unauthorized - Admin access required' });
      }

      // Connect to the database
      const { db } = await connectToDatabase();

      // Fetch all banned users from the ban_user collection
      const bannedUsers = await db.collection('ban_user').find({}).toArray();

      res.status(200).json({ success: true, data: bannedUsers });
    } catch (error) {
      console.error('Error fetching banned users:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }
}
