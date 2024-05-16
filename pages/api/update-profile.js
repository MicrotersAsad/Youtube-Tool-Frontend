import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';
import multer from 'multer';

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
    // Use multer to handle the file upload
    upload.single('profileImage')(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ message: 'File upload error' });
      }

      const { userId, username, email } = req.body;
      const profileImageBuffer = req.file ? req.file.buffer : null;
      const profileImageBase64 = profileImageBuffer ? profileImageBuffer.toString('base64') : null;

      // Connect to the database
      const { db } = await connectToDatabase();

      // Create the update object
      const updateData = { username, email };
      if (profileImageBase64) {
        updateData.profileImage = profileImageBase64;
      }

      // Update the user data
      const result = await db.collection('user').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'Profile updated successfully', user: updateData });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
