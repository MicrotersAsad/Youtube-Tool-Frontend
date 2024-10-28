import { connectToDatabase } from '../../utils/mongodb';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const data = await db.collection('maintenance').findOne({}) || {};
      
      // Ensure the status field is a string like 'enabled' or 'disabled'
      const status = Array.isArray(data.status) ? data.status[0] : data.status;
      res.status(200).json({ success: true, status, description: data.description, imageUrl: data.imageUrl });
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const form = new IncomingForm();
      form.uploadDir = path.join(process.cwd(), '/public/uploads');
      form.keepExtensions = true;

      // Ensure the uploads directory exists
      if (!fs.existsSync(form.uploadDir)) {
        fs.mkdirSync(form.uploadDir, { recursive: true });
      }

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form data:', err);
          return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        const { status, description } = fields;

        // Fetch existing data
        const { db } = await connectToDatabase();
        const existingData = await db.collection('maintenance').findOne({}) || {};

        let imageUrl = existingData.imageUrl || null;

        // Handle image upload
        if (files.image) {
          const oldPath = files.image.path;
          const fileExt = path.extname(files.image.name);
          const fileName = `maintenance_${Date.now()}${fileExt}`;
          const newPath = path.join(form.uploadDir, fileName);

          // Move the uploaded file to the uploads directory
          fs.renameSync(oldPath, newPath);

          imageUrl = `/uploads/${fileName}`;

          // Optionally delete the old image file
          if (existingData.imageUrl) {
            const oldImagePath = path.join(process.cwd(), 'public', existingData.imageUrl);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }

        // Build the update object
        const updateFields = {
          status: status || existingData.status,
          description: description || existingData.description,
          imageUrl, // Always set imageUrl (either new, existing, or null)
        };

        // Upsert the maintenance document
        await db.collection('maintenance').updateOne(
          {},
          { $set: updateFields },
          { upsert: true }
        );

        // Fetch the updated document
        const updatedData = await db.collection('maintenance').findOne({});

        res.status(200).json({ success: true, data: updatedData });
      });
    } catch (error) {
      console.error('Error saving maintenance data:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
