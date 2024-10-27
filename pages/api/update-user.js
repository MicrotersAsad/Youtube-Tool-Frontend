import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure the uploads directory exists
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Middleware function to handle Multer uploads
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

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to allow file handling
  },
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

    // Ensure that the `userId` is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const updateData = {
      username,
      role,
      email,
      updatedAt: new Date(),
    };

    if (req.file) {
      // Save file URL to the database (for example: /uploads/filename.jpg)
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // Update the user document in MongoDB
    const updatedUser = await db.collection('user').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (!updatedUser.matchedCount) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}
