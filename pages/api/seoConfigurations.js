import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { connectToDatabase } from '../../utils/mongodb';

const uploadDirectory = path.join(process.cwd(), 'public/uploads');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, and .jpeg format allowed!'));
    }
  },
}).single('seoImage');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }

  const client = await connectToDatabase();
  const db = client.db();
  const collection = db.collection('seoConfigurations');

  await new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

  const file = req.file;
  const { metaKeywords, metaDescription, socialTitle, socialDescription } = req.body;

  if (!file || !metaKeywords || !metaDescription || !socialTitle || !socialDescription) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newConfig = {
    seoImage: file ? `/uploads/${file.filename}` : null,
    metaKeywords: metaKeywords.split(','),
    metaDescription,
    socialTitle,
    socialDescription,
    updatedAt: new Date(),
  };

  try {
    await collection.insertOne(newConfig);
    res.status(200).json({ success: true, message: 'SEO Configuration saved successfully', data: newConfig });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save data to database' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
