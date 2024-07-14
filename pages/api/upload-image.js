import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../../utils/mongodb';

const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
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
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  await runMiddleware(req, res, upload.single('file'));

  const { db } = await connectToDatabase();
  const { title } = req.body;

  try {
    const filePath = path.join(process.cwd(), 'public/uploads', req.file.filename);
    const url = `/uploads/${req.file.filename}`;

    const imageMetadata = {
      title: title || req.file.originalname,
      url: url,
      uploadDate: new Date(),
    };

    const result = await db.collection('images').insertOne(imageMetadata);
    res.status(200).json({ message: 'Image uploaded successfully.', data: result.ops[0] });
  } catch (error) {
    console.error('Error inserting content:', error);
    res.status(500).json({ message: 'Error inserting content', error: error.message });
  }
};

export default handler;
