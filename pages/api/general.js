import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import path from 'path';
import { connectToDatabase } from '../../utils/mongodb';

// Configure AWS SDK (using AWS SDK v2 here)
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

// Configure multer to use S3 for storage
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME, // Ensure this is set in .env
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, and .jpeg formats allowed!'));
    }
  },
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logoDark', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

// API handler function
export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('general');

  if (req.method === 'POST') {
    // Handle file upload
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const files = req.files;
    const { siteTitle } = req.body;

    if (!files && !siteTitle) {
      return res.status(400).json({ error: 'No files or site title provided' });
    }

    // Prepare data for MongoDB insertion
    const newUpload = {
      siteTitle: siteTitle || 'Default Title',
      files: {
        logo: files.logo ? files.logo[0].location : null,
        logoDark: files.logoDark ? files.logoDark[0].location : null,
        favicon: files.favicon ? files.favicon[0].location : null,
      },
      uploadedAt: new Date(),
    };

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

  } else if (req.method === 'GET') {
    // Handle fetching data
    try {
      const uploads = await collection.find().toArray();
      res.status(200).json({
        success: true,
        data: uploads,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data from database' });
    }

  } else if (req.method === 'PUT') {
    // Handle updating data
    const { id, siteTitle } = req.body; // Expecting `id` and optional `siteTitle` in request body
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const files = req.files;

    // Prepare data for updating in MongoDB
    const updateData = {};
    if (siteTitle) updateData.siteTitle = siteTitle;
    if (files.logo) updateData['files.logo'] = files.logo[0].location;
    if (files.logoDark) updateData['files.logoDark'] = files.logoDark[0].location;
    if (files.favicon) updateData['files.favicon'] = files.favicon[0].location;

    try {
      await collection.updateOne(
        { _id: id },
        { $set: updateData }
      );

      res.status(200).json({
        success: true,
        message: 'Data updated successfully',
        data: updateData,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update data in database' });
    }

  } else {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle form-data
  },
};
