// pages/api/upload-image.js

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../../utils/mongodb';


const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
  }),
});

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
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  await runMiddleware(req, res, upload.single('file'));

  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const { db } = await connectToDatabase();

  try {
    const filePath = path.join(process.cwd(), 'public/uploads', req.file.filename);
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const newImage = {
      title,
      url: fileUrl,
      fileName: req.file.filename,
    };

    const result = await db.collection('images').insertOne(newImage);
    res.status(200).json({ message: 'Image uploaded successfully', data: newImage });
  } catch (error) {
    console.error('Error inserting content:', error);
    res.status(500).json({ message: 'Error inserting content', error: error.message });
  }
};

export default handler;
