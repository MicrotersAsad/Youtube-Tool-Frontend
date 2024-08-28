import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { smtpHost, smtpPort, user, pass, fromName } = req.body;

    try {
      const { db } = await connectToDatabase();
      await db.collection('emailConfig').updateOne(
        {}, 
        { $set: { smtpHost, smtpPort, user, pass, fromName } }, 
        { upsert: true }
      );
      res.status(200).json({ message: 'Email configuration updated successfully' });
    } catch (error) {
      console.error('Error updating email configuration:', error);
      res.status(500).json({ error: 'Error updating email configuration' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
