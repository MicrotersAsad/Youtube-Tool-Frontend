import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from "mongodb";
import multer from 'multer';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promisify } from 'util';

// Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Disable built-in body parser for file upload handling by multer
export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing to let multer handle it
  },
};

// Multer storage setup for memory storage (for S3)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Helper function to run multer middleware
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

// Helper function to upload file to AWS S3
const uploadFileToS3 = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME, // Your S3 bucket name
    Key: `uploads/${fileName}`, // Path in S3 bucket
    Body: file.buffer, // File buffer
    ContentType: file.mimetype, // Content type (MIME)
  };

  const command = new PutObjectCommand(uploadParams);
  await s3.send(command);

  // Return the S3 file URL
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/uploads/${fileName}`;
};

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  // Handle POST request - Create new page with image upload to S3
  if (req.method === "POST") {
    // Run multer middleware to handle file upload
    try {
      await runMiddleware(req, res, upload.single('metaImage')); // 'metaImage' is the file field name
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }

    const { name, slug, content, metaTitle, metaDescription } = req.body;
    let metaImage = null;

    if (req.file) {
      try {
        // Upload the file to S3
        metaImage = await uploadFileToS3(req.file);
      } catch (error) {
        return res.status(500).json({ message: 'Error uploading file to S3', error: error.message });
      }
    }

    // Check for required fields
    if (!name || !slug || !content || !metaTitle || !metaDescription) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure the slug is unique
    const existingPage = await db.collection("pages").findOne({ slug });
    if (existingPage) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    // Insert the new page into the database
    const result = await db.collection("pages").insertOne({
      name,
      slug,
      content,
      metaTitle,
      metaDescription,
      metaImage, // Store S3 URL
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Page created", data: result });
  }

  // Handle GET request - Fetch all pages or a single page
  if (req.method === "GET") {
    const { slug } = req.query;

    if (slug) {
      // Fetch a single page based on slug
      const page = await db.collection("pages").findOne({ slug });
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      return res.status(200).json(page);
    }

    // Fetch all pages
    const pages = await db.collection("pages").find().toArray();
    return res.status(200).json(pages);
  }

  // Handle PUT request - Update an existing page
  if (req.method === "PUT") {
    try {
      await runMiddleware(req, res, upload.single('metaImage'));
  
      const { id, name, slug, content, metaTitle, metaDescription } = req.body;
      let metaImage = req.body.existingMetaImage;
  
      if (req.file) {
        try {
          metaImage = await uploadFileToS3(req.file);
        } catch (error) {
          return res.status(500).json({ message: 'Error uploading file to S3', error: error.message });
        }
      }
  
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid page ID" });
      }
  
      const updatedPage = await db.collection("pages").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            slug,
            content,
            metaTitle,
            metaDescription,
            metaImage,
            updatedAt: new Date(),
          },
        }
      );
  
      if (updatedPage.matchedCount === 0) {
        return res.status(404).json({ message: "Page not found" });
      }
  
      return res.status(200).json({ message: "Page updated" });
  
    } catch (error) {
      console.error('Error during PUT request:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
  

  // Handle DELETE request - Delete a page by slug
  if (req.method === 'DELETE') {
    try {
      const { slug } = req.query;  // Fetch slug from query string

      if (!slug) {
        return res.status(400).json({ message: 'Slug is required' });
      }

      const result = await db.collection('pages').deleteOne({ slug });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Page not found' });
      }

      return res.status(200).json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting page:', error);
      return res.status(500).json({ message: 'Internal Server Error', error });
    }
  }

  // If the method is not allowed
  res.status(405).json({ message: "Method not allowed" });
}
