import { connectToDatabase } from '../../utils/mongodb';
import AWS from 'aws-sdk';

// AWS S3 কনফিগারেশন
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

const handler = async (req, res) => {
  if (corsMiddleware(req, res)) return;

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

// S3 এ ফাইল আপলোডের জন্য ফাংশন
const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  return s3.upload(params).promise();
};

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
  try {
    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Assuming req.file contains the file to upload
    const imageUrl = req.file ? (await uploadFileToS3(req.file)).Location : null;

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
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle POST request', error: error.message });
  }
};

const handlePut = async (req, res) => {
  try {
    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = req.file ? (await uploadFileToS3(req.file)).Location : undefined;

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
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle PUT request', error: error.message });
  }
};

export default handler;
