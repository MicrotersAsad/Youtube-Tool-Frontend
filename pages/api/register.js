import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../utils/mongodb';
import { sendVerificationEmail } from '../../utils/sendVerificationEmail';
import { v4 as uuidv4 } from 'uuid';

// AWS S3 configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up Multer with S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME, // Environment variable for bucket name
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now()}_${file.originalname}`); // Save in 'uploads/' folder
    },
  }),
  limits: { fileSize: 100 * 1024 }, // Limit file size to 100 KB
});

export const config = {
  api: {
    bodyParser: false, // Disable default body parser
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Use Multer middleware
    upload.single('profileImage')(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json({ message: 'File upload error' });
      } else if (err) {
        return res.status(500).json({ message: 'Unknown error' });
      }

      const { username, email, password, role, adminAnswer } = req.body;
      const profileImageUrl = req.file ? req.file.location : null; // Get S3 file URL

      // Validate role and admin answer
      let finalRole = 'user';
      if (role === 'admin') {
        if (adminAnswer !== 'nazmul hasan') {
          return res.status(400).json({ message: 'Incorrect answer to the admin question' });
        }
        finalRole = 'admin';
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a verification token
      const verificationToken = uuidv4();

      // Connect to the database
      const { db } = await connectToDatabase();

      // Insert user data into the database
      const result = await db.collection('user').insertOne({
        username,
        email,
        password: hashedPassword,
        profileImage: profileImageUrl, // Save S3 URL in the database
        verificationToken,
        verified: false,
        role: finalRole, // Set role based on the verification
        createdAt: new Date(),
      });

      // Send verification email
      await sendVerificationEmail(email, username, verificationToken);

      res.status(201).json({ message: 'Registration successful! Please check your email to verify.' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
