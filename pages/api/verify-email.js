// pages/api/verify-email.js
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.body;

  try {
    const { db } = await connectToDatabase();

    const user = await db.collection('user').findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await db.collection('user').updateOne(
      { _id: user._id },
      { $set: { verified: true }, $unset: { verificationToken: "" } }
    );

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
