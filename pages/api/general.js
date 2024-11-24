import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser to handle form-data
  },
};

// Configure AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Ensure bucket name is defined
if (!process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
}

// Configure multer to use S3 for storage
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
    },
  }),
});

const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

export default async function handler(req, res) {
  const { method, query } = req;
  let db, client;

  try {
    ({ db, client } = await connectToDatabase());
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error', error: error.message });
  }

  const collection = db.collection('general');

  switch (method) {
    case 'POST':
      await handlePostRequest(req, res, collection);
      break;

    case 'GET':
      await handleGetRequest(req, res, collection, query);
      break;

    case 'PUT':
      await handlePutRequest(req, res, collection, query);
      break;

    case 'DELETE':
      await handleDeleteRequest(req, res, collection, query);
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

const handlePostRequest = async (req, res, collection) => {
  try {
    await runMiddleware(req, res, upload.single('image')); // Use multer middleware for file upload

    const { siteTitle } = req.body;
    const image = req.file ? req.file.location : null;

    if (!siteTitle || !image) {
      return res.status(400).json({ message: 'Site title and image are required' });
    }

    const newDocument = {
      siteTitle,
      image,
      uploadedAt: new Date(),
    };

    const result = await collection.insertOne(newDocument);

    if (result.insertedId) {
      return res.status(201).json({ message: 'File uploaded successfully', data: newDocument });
    } else {
      return res.status(500).json({ message: 'Failed to save document in the database' });
    }
  } catch (error) {
    console.error('POST error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const handleGetRequest = async (req, res, collection, query) => {
  try {
    if (query.id) {
      const id = query.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      const document = await collection.findOne({ _id: new ObjectId(id) });

      if (!document) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      res.status(200).json(document);
    } else {
      const documents = await collection.find().toArray();
      res.status(200).json(documents);
    }
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const handlePutRequest = async (req, res, collection, query) => {
  try {
    const { id } = query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    await runMiddleware(req, res, upload.single('image')); // Parse incoming file

    const updatedData = {
      ...req.body,
    };

    if (req.file) {
      updatedData.image = req.file.location;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Document updated successfully', data: updatedData });
    } else {
      res.status(404).json({ message: 'Document not found or no changes made' });
    }
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const handleDeleteRequest = async (req, res, collection, query) => {
  try {
    const { id } = query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Document deleted successfully' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
