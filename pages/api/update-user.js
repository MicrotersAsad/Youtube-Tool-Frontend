import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle file uploads
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

// Check for bucket name environment variable
if (!process.env.AWS_S3_BUCKET_NAME) {
  throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5MB
});

// Middleware to handle Multer file upload
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

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  try {
    // Handle file upload
    await runMiddleware(req, res, upload.single('profileImage'));

    // Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decodedToken = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    const { userId, username, role, email } = req.body;

    // Ensure that `userId` is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const updateData = {
      username,
      role,
      email,
      updatedAt: new Date(),
    };

    // Only add profileImage if the file exists
    if (req.file) {
      updateData.profileImage = req.file.location; // Store the image URL from S3
    }

    // Update the user document in MongoDB
    const updatedUser = await db.collection('user').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (!updatedUser.matchedCount) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send a success response
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      imageUrl: req.file ? req.file.location : null, // Return the image URL if available
    });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}