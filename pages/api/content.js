import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create the 'uploads' folder if it doesn't exist
const uploadFolder = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Set up multer storage to save files to the 'uploads' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, let multer handle it
  },
};

// CORS Middleware
function corsMiddleware(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Update '*' to a specific origin if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

const handler = async (req, res) => {
  if (corsMiddleware(req, res)) return; // Apply CORS middleware and handle OPTIONS preflight

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
      await handlePatch(req, res); // Use PATCH for reaction updates
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

// Multer middleware to handle file upload
const uploadMiddleware = upload.single('image');

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

const handlePost = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }

    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

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
};

const handlePut = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }

    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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
};

export default handler;
