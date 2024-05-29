import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { db } = await connectToDatabase();
        const users = await db.collection('user').find({}).toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          console.log('User ID not provided');
          return res.status(400).json({ message: 'User ID is required' });
        }

        console.log(`Deleting user with ID: ${id}`);
        const { db } = await connectToDatabase();
        const result = await db.collection('user').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          console.log('User not found');
          return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    case 'PATCH':
      try {
        const { id } = req.query;
        const { role } = req.body;

        if (!id) {
          console.log('User ID not provided');
          return res.status(400).json({ message: 'User ID is required' });
        }

        if (!role) {
          console.log('Role not provided');
          return res.status(400).json({ message: 'Role is required' });
        }

        console.log(`Updating user with ID: ${id} to role: ${role}`);
        const { db } = await connectToDatabase();
        const result = await db.collection('user').updateOne({ _id: new ObjectId(id) }, { $set: { role: role } });

        if (result.matchedCount === 0) {
          console.log('User not found');
          return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User role updated successfully' });
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'DELETE', 'PATCH']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
