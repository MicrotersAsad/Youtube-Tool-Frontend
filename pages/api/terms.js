// pages/api/terms.js
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const doc = req.body;
      if (!doc) {
        return res.status(400).json({ message: 'Invalid request body' });
      }

      const { db } = await connectToDatabase();
      const result = await db.collection('terms').insertOne(doc);

      // console.log('Insertion result:', result);

      if (!result || !result.ops || result.ops.length === 0) {
        return res.status(500).json({ message: 'Failed to insert document' });
      }

      res.status(201).json(result.ops[0]); // Return the inserted document
    } catch (error) {
      // console.error('Error inserting document:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const result = await db.collection('terms').find({}).toArray();

      res.status(200).json(result);
    } catch (error) {
      // console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
