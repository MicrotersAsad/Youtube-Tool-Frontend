import { connectToDatabase } from '../../utils/mongodb';
import AWS from 'aws-sdk';
import multiparty from 'multiparty';

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

// CORS Middleware
function corsMiddleware(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Authentication Middleware
function authMiddleware(req, res) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header is missing' });
    return false;
  }

  const token = authHeader.split(' ')[1]; // Assumes 'Bearer TOKEN'
  if (!token || token !== process.env.AUTH_TOKEN) {
    res.status(403).json({ message: 'Invalid or missing token' });
    return false;
  }

  // Token is valid
  return true;
}

const handler = async (req, res) => {
  if (corsMiddleware(req, res)) return;

  // Check authentication
  const isAuthenticated = authMiddleware(req, res);
  if (!isAuthenticated) return;

  const { method } = req;

  switch (method) {
    case 'GET':
      await handleGet(req, res);
      break;
    case 'POST':
      await handlePost(req, res);
      break;
    case 'PUT':
      await handlePut(req, res);
      break;
    case 'PATCH':
      await handlePatch(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

// S3 File Upload Function
const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  return s3.upload(params).promise();
};

// Handle GET Request
const handleGet = async (req, res) => {
  const { category, language } = req.query;
  const { db } = await connectToDatabase();

  if (!category && !language) {
    try {
      const count = await db.collection('content').countDocuments();
      return res.status(200).json({ totalCount: count });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to count documents', error: error.message });
    }
  }

  if (!category || !language) {
    return res.status(400).json({ message: 'Category and language are required' });
  }

  try {
    const result = await db.collection('content').findOne({ category, [`translations.${language}`]: { $exists: true } });
    if (!result) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch content', error: error.message });
  }
};

// Handle POST Request
const handlePost = async (req, res) => {
  try {
    const form = new multiparty.Form();

    // Parse the form data
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ message: 'Failed to parse form data', error: err.message });
      }

      const { category, language } = req.query;
      const content = fields.content ? fields.content[0] : null;
      const title = fields.title ? fields.title[0] : null;
      const description = fields.description ? fields.description[0] : null;
      const faqs = fields.faqs ? JSON.parse(fields.faqs[0]) : [];
      const relatedTools = fields.relatedTools ? JSON.parse(fields.relatedTools[0]) : [];

      if (!category || !content || !title || !description || !language) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Upload the file if provided
      let imageUrl = null;
      if (files.file && files.file[0]) {
        const file = files.file[0];
        const uploadResult = await uploadFileToS3({
          originalname: file.originalFilename,
          buffer: file.path,
          mimetype: file.headers['content-type'],
        });
        imageUrl = uploadResult.Location;
      }

      const translation = {
        content,
        title,
        description,
        image: imageUrl,
        faqs,
        relatedTools,
        reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
      };

      const { db } = await connectToDatabase();
      const filter = { category };
      const updateDoc = { $set: { [`translations.${language}`]: translation } };
      const options = { upsert: true };

      const result = await db.collection('content').updateOne(filter, updateDoc, options);
      if (!result.matchedCount && !result.upsertedCount) {
        return res.status(500).json({ message: 'Failed to insert or update document' });
      }

      res.status(201).json({ message: 'Document inserted/updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle POST request', error: error.message });
  }
};

// Handle PUT Request
const handlePut = async (req, res) => {
  try {
    const form = new multiparty.Form();

    // Parse the form data
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ message: 'Failed to parse form data', error: err.message });
      }

      // Extract query parameters
      const { category, language } = req.query;

      // Extract fields
      const content = fields.content ? fields.content[0] : null;
      const title = fields.title ? fields.title[0] : null;
      const description = fields.description ? fields.description[0] : null;
      const faqs = fields.faqs ? JSON.parse(fields.faqs[0]) : [];
      const relatedTools = fields.relatedTools ? JSON.parse(fields.relatedTools[0]) : [];

      if (!category || !content || !title || !description || !language) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Upload the file if provided
      let imageUrl = null;
      if (files.file && files.file[0]) {
        const file = files.file[0];
        const uploadResult = await uploadFileToS3({
          originalname: file.originalFilename,
          buffer: file.path,
          mimetype: file.headers['content-type'],
        });
        imageUrl = uploadResult.Location;
      }

      const translation = {
        content,
        title,
        description,
        ...(imageUrl && { image: imageUrl }),
        faqs,
        relatedTools,
      };

      const { db } = await connectToDatabase();
      const filter = { category };
      const updateDoc = { $set: { [`translations.${language}`]: translation } };
      const options = { upsert: true };

      const result = await db.collection('content').updateOne(filter, updateDoc, options);
      if (!result.matchedCount && !result.upsertedCount) {
        return res.status(500).json({ message: 'Failed to update document' });
      }

      res.status(200).json({ message: 'Document updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle PUT request', error: error.message });
  }
};

export default handler;
