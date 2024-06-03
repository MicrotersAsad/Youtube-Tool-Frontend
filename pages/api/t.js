import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

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

export default async function handler(req, res) {
  const { method, query } = req; // Extract query from req
  let db, client;

  try {
    ({ db, client } = await connectToDatabase());
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error' });
  }

  const blogs = db.collection('blogs');

  switch (method) {
    case 'POST':
      try {
        await runMiddleware(req, res, upload.single('image'));

        // Debugging: Print the request body and file details
       

        // Destructure and validate the request body fields
        const { content, title, metaTitle, description, metaDescription,  categories, author, authorProfile, slug } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        // Check for required fields
        if (!content || !title || !metaTitle || !description || !metaDescription  || !categories || !author || !slug) {
          console.log('Invalid request body');
          return res.status(400).json({ message: 'Invalid request body' });
        }

        // Convert categories to an array if it's a JSON string
        let parsedCategories;
        try {
          parsedCategories = JSON.parse(categories);
        } catch (error) {
          parsedCategories = categories.split(',').map(cat => cat.trim());
        }

        const doc = {
          content,
          title,
          metaTitle,
          description,
          metaDescription,
          categories: parsedCategories,
          image,
          author,
          authorProfile,
          slug,
          createdAt: new Date(),
        };

        const result = await blogs.insertOne(doc);

        if (!result.insertedId) {
          console.log('Failed to insert document');
          return res.status(500).json({ message: 'Failed to insert document' });
        }

        res.status(201).json(doc);
      } catch (error) {
        console.error('POST error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
     

      case 'GET':
        try {
          if (query.slug) { // Use query.slug instead of req.query.id
            const slug = query.slug;
            const result = await blogs.findOne({ slug: slug });
  
            if (!result) {
              return res.status(404).send('Resource not found');
            }
  
            res.send(result);
          } else if (req.query.category) {
            // Handle category query
          } else {
            // Handle other cases
          }
        } catch (error) {
          console.error('GET by Slug error:', error);
          res.status(500).send('Internal server error');
        }
        break;

      

    case 'PUT':
      try {
        await runMiddleware(req, res, upload.single('image'));

        const id = req.query.id;
        if (!id) {
          return res.status(400).json({ message: 'ID is required' });
        }

        const updatedData = req.body;

        if (req.file) {
          updatedData.image = `/uploads/${req.file.filename}`;
        }

        delete updatedData._id;

        const result = await blogs.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: 'Data updated successfully' });
        } else {
          res.status(404).json({ message: 'Data not found' });
        }
      } catch (error) {
        console.error('PUT error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    case 'DELETE':
      try {
        const id = req.query.id;
        const result = await blogs.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Data deleted successfully' });
        } else {
          res.status(404).json({ message: 'Data not found' });
        }
      } catch (error) {
        console.error('DELETE error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
