
import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ message: 'Category is required' });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const doc = req.body;
      if (!doc) {
        return res.status(400).json({ message: 'Invalid request body' });
      }

      const { db } = await connectToDatabase();

      if (req.method === 'POST') {
        doc.category = category; // Add category to document
        const result = await db.collection('content').insertOne(doc);

        if (!result || !result.insertedId) {
          return res.status(500).json({ message: 'Failed to insert document' });
        }

        res.status(201).json({ _id: result.insertedId, ...doc });
      } else if (req.method === 'PUT') {
        const filter = { category };
        const updateDoc = {
          $set: doc,
        };
        const result = await db.collection('content').updateOne(filter, updateDoc, { upsert: true });

        if (!result.matchedCount && !result.upsertedCount) {
          return res.status(500).json({ message: 'Failed to update document' });
        }

        res.status(200).json({ message: 'Document updated successfully' });
      }
    } catch (error) {
      console.error('Error handling document:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const result = await db.collection('content').find({ category }).toArray();

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT', 'GET']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
