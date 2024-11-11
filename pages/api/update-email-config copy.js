import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { method } = req;

  try {
    const { db } = await connectToDatabase();

    if (method === 'GET') {
      // Handle GET request to fetch current email configuration
      const config = await db.collection('emailConfig').findOne({});
      if (config) {
        res.status(200).json(config);
      } else {
        res.status(404).json({ error: 'Configuration not found' });
      }
    } else if (method === 'POST') {
      // Handle POST request to update email configuration
      const { smtpHost, smtpPort, user, pass, fromName } = req.body;
      await db.collection('emailConfig').updateOne(
        {},
        { $set: { smtpHost, smtpPort, user, pass, fromName } },
        { upsert: true }
      );
      res.status(200).json({ message: 'Email configuration updated successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
