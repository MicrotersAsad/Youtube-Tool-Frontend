// pages/api/delete-image.js

import { connectToDatabase } from '../../utils/mongodb';
import fs from 'fs';
import path from 'path';

const handler = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  const { db } = await connectToDatabase();

  try {
    const image = await db.collection('images').findOne({ _id: new ObjectId(id) });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the image file from the server
    const filePath = path.join(process.cwd(), 'public/uploads', image.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.collection('images').deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
};

export default handler;
