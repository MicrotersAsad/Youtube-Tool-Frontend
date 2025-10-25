import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../../utils/mongodb';

const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
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

  try {
    await runMiddleware(req, res, upload.single('file'));
  } catch (error) {
    console.error('Multer error:', error);
    return res.status(500).json({ message: 'File upload error', error: error.message });
  }

  // Removed 'language' from destructuring
  const { collectionName } = req.body; 

  if (!collectionName) {
    if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'Collection name is required' });
  }
  
  if (!req.file) {
      return res.status(400).json({ message: 'File is required for upload' });
  }

  const { db } = await connectToDatabase();

  try {
    const filePath = path.join(process.cwd(), 'public/uploads', req.file.originalname);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    fs.unlinkSync(filePath); 
    
    const content = JSON.parse(fileContent);

    if (!Array.isArray(content)) {
      throw new Error('Uploaded file must contain an array of content entries.');
    }

    // Removed language processing. Inserting content array directly.
    const contentToInsert = content; 

    const result = await db.collection(collectionName).insertMany(contentToInsert);
    res.status(200).json({ message: `${result.insertedCount} items inserted successfully.` });
  } catch (error) {
    console.error('Error inserting content:', error);
    res.status(500).json({ message: 'Error inserting content', error: error.message });
  }
};

export default handler;