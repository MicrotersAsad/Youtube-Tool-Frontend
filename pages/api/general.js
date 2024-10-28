import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { connectToDatabase } from '../../utils/mongodb'; // Import MongoDB connection utility

// Setup upload directory
const uploadDirectory = path.join(process.cwd(), 'public/uploads');

// Ensure the directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure multer storage
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
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logoDark', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

// Create the Next.js API route
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }

  // Connect to the database
  const client = await connectToDatabase();
  const db = client.db();
  const collection = db.collection('general'); // Name of the collection in MongoDB

  // Use a promise-based wrapper for Multer
  await new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

  const files = req.files;
  const { siteTitle } = req.body;

  if (!files && !siteTitle) {
    return res.status(400).json({ error: 'No files or site title provided' });
  }

  // Prepare data for insertion into MongoDB
  const newUpload = {
    siteTitle: siteTitle || 'Default Title',
    files: {
      logo: files.logo ? `/uploads/${files.logo[0].filename}` : null,
      logoDark: files.logoDark ? `/uploads/${files.logoDark[0].filename}` : null,
      favicon: files.favicon ? `/uploads/${files.favicon[0].filename}` : null,
    },
    uploadedAt: new Date(),
  };

  // Insert data into MongoDB
  try {
    await collection.insertOne(newUpload);

    res.status(200).json({
      success: true,
      message: 'Files and title uploaded successfully',
      data: newUpload,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save data to database' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle form-data
  },
};
