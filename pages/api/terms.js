import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { content, language, metaTitle, metaDescription } = req.body;
      if (!content || !language) {
        return res.status(400).json({ message: 'Content and language are required' });
      }

      const { db } = await connectToDatabase();
      const result = await db.collection('terms').updateOne(
        { page: 'terms', language },
        { $set: { content, metaTitle, metaDescription } },
        { upsert: true }
      );

      if (result.upsertedId) {
        const insertedDocument = await db.collection('terms').findOne({ _id: result.upsertedId });
        res.status(201).json(insertedDocument);
      } else {
        const updatedDocument = await db.collection('terms').findOne({ page: 'terms', language });
        res.status(200).json(updatedDocument);
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { lang } = req.query;
      const { db } = await connectToDatabase();
      const result = await db.collection('terms').findOne({ page: 'terms', language: lang });

      if (!result) {
        return res.status(200).json({ content: '', metaTitle: '', metaDescription: '' });
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
