import { connectToDatabase, ObjectId } from '../../utils/mongodb';
import dotenv from 'dotenv';
import Cors from 'cors';

// Load environment variables
dotenv.config();

const API_KEY = process.env.API_KEY; // Read API key from .env file

// Initialize the CORS middleware
const cors = Cors({
  origin: '*', // Allow requests from all origins
  methods: ['GET', 'POST', 'DELETE', 'PUT'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'x-api-key'], // Allowed headers
});

// Helper function to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors); // Apply CORS middleware

  const { db } = await connectToDatabase();

  const checkApiKey = (req, res) => {
    const providedKey = req.headers['x-api-key'];
    if (providedKey !== API_KEY) {
      res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
      return false;
    }
    return true;
  };

  const updateUsage = async (token) => {
    const apiKey = await db.collection('openaiKey').findOne({ token });
    if (!apiKey) {
      throw new Error('API key not found');
    }

    if (apiKey.usageCount >= apiKey.usageLimit) {
      await db.collection('openaiKey').updateOne(
        { _id: apiKey._id },
        { $set: { active: false } }
      );
      return { message: 'API key usage limit reached and has been deactivated', active: false };
    }

    await db.collection('openaiKey').updateOne(
      { _id: apiKey._id },
      { $inc: { usageCount: 1 } }
    );

    return { message: 'API key usage updated', active: true };
  };

  if (req.method === 'GET') {
    if (!checkApiKey(req, res)) return;

    try {
      const tokens = await db.collection('openaiKey').find().toArray();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tokens' });
    }
  } else if (req.method === 'POST') {
    const { tokens, usageLimit = 1000, serviceType = 'openai' } = req.body;
    const tokenArray = tokens.split(',').map((token) => token.trim());

    try {
      await db.collection('openaiKey').insertMany(
        tokenArray.map((token) => ({
          token,
          serviceType,
          active: true,
          usageCount: 0,
          usageLimit,
        }))
      );
      res.status(201).json({ message: 'Tokens added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error adding tokens' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      await db.collection('openaiKey').deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ message: 'Token deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting token' });
    }
  } else if (req.method === 'PUT') {
    const { id, active } = req.body;

    try {
      await db.collection('openaiKey').updateOne(
        { _id: new ObjectId(id) },
        { $set: { active } }
      );
      res.status(200).json({ message: 'Token updated' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating token' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
