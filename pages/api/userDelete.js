import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { userId } = JSON.parse(body);
      // console.log('Received userId:', userId);

      if (!ObjectId.isValid(userId)) {
        // console.log('Invalid user ID:', userId);
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const { db } = await connectToDatabase();
      const result = await db.collection('user').deleteOne({ _id: new ObjectId(userId) });
      // console.log(result);

      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      // console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
};

export default handler;
 