import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    // Connect to the database
    const { db } = await connectToDatabase();

    // Find the user with the given verification token
    const user = await db.collection('user').findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update the user's verification status
    await db.collection('user').updateOne(
      { _id: user._id },
      { $set: { verified: true }, $unset: { verificationToken: '' } }
    );

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    // console.error('Email verification failed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
