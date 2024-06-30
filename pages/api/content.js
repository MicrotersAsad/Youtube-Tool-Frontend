import { connectToDatabase } from '../../utils/mongodb';
import uploadMiddleware from '../../middleware/uploadMiddleware';

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, let multer handle it
  },
};

const handler = async (req, res) => {
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
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

const handleGet = async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ message: 'Category is required' });
  }

  const { db } = await connectToDatabase();
  const result = await db.collection('content').find({ category }).toArray();

  res.status(200).json(result);
};

const handlePost = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }

    const { category } = req.query;
    const { content, title, description } = req.body;
    const image = req.file;

    if (!category || !content || !title || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = image ? `/uploads/${image.filename}` : null;

    const doc = {
      content,
      title,
      description,
      image: imageUrl,
      category,
    };

    const { db } = await connectToDatabase();
    const result = await db.collection('content').insertOne(doc);

    if (!result.insertedId) {
      return res.status(500).json({ message: 'Failed to insert document' });
    }

    res.status(201).json({ _id: result.insertedId, ...doc });
  });
};

const handlePut = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }

    const { category } = req.query;
    const { content, title, description } = req.body;
    const image = req.file;

    if (!category || !content || !title || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = image ? `/uploads/${image.filename}` : undefined;

    const doc = {
      content,
      title,
      description,
      ...(imageUrl && { image: imageUrl }),
    };

    const { db } = await connectToDatabase();
    const filter = { category };
    const updateDoc = { $set: doc };
    const result = await db.collection('content').updateOne(filter, updateDoc, { upsert: true });

    if (!result.matchedCount && !result.upsertedCount) {
      return res.status(500).json({ message: 'Failed to update document' });
    }

    res.status(200).json({ message: 'Document updated successfully' });
  });
};

export default handler;
