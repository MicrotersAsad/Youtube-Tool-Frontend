
import { connectToDatabase } from '../../utils/mongodb';

// Authorization middleware
function checkAuthorization(req) {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting 'Bearer <token>'
  const validToken = process.env.AUTH_TOKEN; // Token stored in .env file

  if (!token || token !== validToken) {
    return false; // Unauthorized
  }
  return true; // Authorized
}

export default async function handler(req, res) {
  // Check Authorization
  if (!checkAuthorization(req)) {
    return res.status(200).json({ message: 'You Are Hacker! I am Your Father' });
  }

  if (req.method === 'POST') {
    try {
      const { content, language, metaTitle, metaDescription } = req.body;
      if (!content || !language) {
        return res.status(400).json({ message: 'Content and language are required' });
      }

      const { db } = await connectToDatabase();
      const result = await db.collection('about').updateOne(
        { page: 'about', language },
        { $set: { content, metaTitle, metaDescription } },
        { upsert: true }
      );

      if (result.upsertedId) {
        const insertedDocument = await db.collection('about').findOne({ _id: result.upsertedId });
        res.status(201).json(insertedDocument);
      } else {
        const updatedDocument = await db.collection('about').findOne({ page: 'about', language });
        res.status(200).json(updatedDocument);
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { lang } = req.query;
      const { db } = await connectToDatabase();
      const result = await db.collection('about').findOne({ page: 'about', language: lang });

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
