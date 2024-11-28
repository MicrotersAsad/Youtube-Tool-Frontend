import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import multiparty from 'multiparty';

export const config = {
  api: {
    bodyParser: false,
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
  throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
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
});

// Utility function to upload files to S3
const uploadFileToS3 = async (filePath, filename) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${filename}`,
    Body: fileContent,
    ContentType: 'image/jpeg', // or any other content type
  };
  return s3.upload(params).promise();
};

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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Main API handler
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
  await runMiddleware(req, res, upload.single('image'));

  try {
    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let imageUrl;
    if (req.file) {
      imageUrl = req.file.location; // Get the image URL from S3
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to handle POST request', error: error.message });
  }
};

// Handle PUT request
const handlePut = async (req, res) => {
  try {
    const form = new multiparty.Form();

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

      let imageUrl;
      if (files.file && files.file[0]) {
        const file = files.file[0];
        const uploadResult = await uploadFileToS3({
          originalname: file.originalFilename,
          buffer: file.path,
          mimetype: file.headers['content-type'],
        });
        imageUrl = uploadResult.Location; // Get the image URL from S3
      }

      const translation = {
        content,
        title,
        description,
        ...(imageUrl && { image: imageUrl }), // Add image URL if available
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
