import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';
import uploadMiddleware from '../../middleware/uploadMiddleware';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to handle the middleware
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
  const { method } = req;

  try {
    const { db } = await connectToDatabase();
    const users = db.collection('user');

    // Verify the user token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    let decodedUser;

    try {
      decodedUser = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    switch (method) {
      case 'GET': {
        const user = await users.findOne({ email: decodedUser.email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
        break;
      }

      case 'DELETE': {
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ message: 'User ID is required' });
        }
        const deleteResult = await users.deleteOne({ _id: new ObjectId(deleteId) });
        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
        break;
      }

      case 'PATCH': {
        const { role } = req.body;
        if (!role) {
          return res.status(400).json({ message: 'Role is required' });
        }
        const patchResult = await users.updateOne({ email: decodedUser.email }, { $set: { role } });
        if (patchResult.matchedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User role updated successfully' });
        break;
      }

      case 'PUT': {
        await runMiddleware(req, res, uploadMiddleware);
        const updatedData = req.body;
        if (req.file) {
          updatedData.profileImage = req.file.buffer.toString('base64');
        }
        delete updatedData._id;
        const putResult = await users.updateOne({ email: decodedUser.email }, { $set: updatedData });
        if (putResult.modifiedCount === 1) {
          res.status(200).json({ message: 'User profile updated successfully' });
        } else {
          res.status(404).json({ message: 'User not found' });
        }
        break;
      }

      default: {
        res.setHeader('Allow', ['GET', 'DELETE', 'PATCH', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
        break;
      }
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
