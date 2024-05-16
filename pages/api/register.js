import multer from 'multer';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../utils/mongodb';
import { sendVerificationEmail } from '../../utils/sendVerificationEmail';
import { v4 as uuidv4 } from 'uuid';

// Set up multer storage engine to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
    // Use multer middleware
    upload.single('profileImage')(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json({ message: 'File upload error' });
      } else if (err) {
        return res.status(500).json({ message: 'Unknown error' });
      }

      const { username, email, password, role, adminAnswer } = req.body;
      const profileImageBuffer = req.file ? req.file.buffer : null;
      const profileImageBase64 = profileImageBuffer ? profileImageBuffer.toString('base64') : null;

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
        profileImage: profileImageBase64,
        verificationToken,
        verified: false,
        role: finalRole, // Set role based on the verification
        createdAt: new Date(),
      });

      // Log to confirm insertion
      // console.log(`User ${username} with role ${finalRole} registered successfully`);

      // Send verification email
      await sendVerificationEmail(email, username, verificationToken);

      res.status(201).json({ message: 'Registration successful! Please check your email to verify.' });
    });
  } catch (error) {
    // console.error('Registration failed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
