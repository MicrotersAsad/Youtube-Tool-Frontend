import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

if (!process.env.AWS_S3_BUCKET_NAME) {
  throw new Error("AWS_S3_BUCKET environment variable is not set");
}

// Configure multer to use S3 for image storage
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Validate file type (e.g., allow only images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    // Validate file size (e.g., limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return cb(new Error('File is too large. Max size is 5MB'), false);
    }
    cb(null, true);
  }
});

// Run middleware for file upload
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// CORS Middleware
function corsMiddleware(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store'); // Prevent caching

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Utility function to verify the JWT token
function checkAuthorization(req) {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting 'Bearer <token>'
  const validToken = process.env.AUTH_TOKEN; // Token stored in .env file

  if (!token || token !== validToken) {
    return false; // Unauthorized
  }
  return true; // Authorized
}

// Main API handler
const handler = async (req, res) => {
  if (corsMiddleware(req, res)) return;

  // Check if the request is authorized
  if (!checkAuthorization(req)) {
    return res.status(200).json({ message: 'Authentication failed: Invalid or missing token' });
  }

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

// Handle GET request
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

// Handle POST request
const handlePost = async (req, res) => {
  try {
    await runMiddleware(req, res, upload.single('image'));
    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const image = req.file ? req.file.location : null;

    const translation = {
      content,
      title,
      description,
      image,
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle POST request', error: error.message });
  }
};

// Handle PUT request
const handlePut = async (req, res) => {
  try {
    await runMiddleware(req, res, upload.single('image'));
    
    const { category, language } = req.query;
    const { content, title, description, faqs, relatedTools } = req.body;

    // Parse faqs and relatedTools if they exist in body
    const parsedFaqs = faqs ? JSON.parse(faqs) : [];
    const parsedRelatedTools = relatedTools ? JSON.parse(relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = req.file ? req.file.location : null;

    const translation = {
      content,
      title,
      description,
      ...(imageUrl && { image: imageUrl }), // Add image URL if available
      faqs: parsedFaqs,
      relatedTools: parsedRelatedTools,
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle PUT request', error: error.message });
  }
};

export default handler;
