import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import uploadMiddleware from '../../middleware/uploadMiddleware';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to handle the middleware
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
  const { method } = req;
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
        await runMiddleware(req, res, uploadMiddleware);

        const { content, title, description, Blogtitle, categories } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        if (!content || !title || !description || !Blogtitle || !categories) {
          return res.status(400).json({ message: 'Invalid request body' });
        }

        const doc = {
          content,
          title,
          description,
          Blogtitle,
          categories: JSON.parse(categories),
          image,
        };

        const result = await blogs.insertOne(doc);

        if (!result.insertedId) {
          return res.status(500).json({ message: 'Failed to insert document' });
        }

        res.status(201).json(doc);
      } catch (error) {
        console.error('POST error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    case 'GET':
      if (req.query.id) {
        try {
          const id = req.query.id;
          console.log(`Fetching blog post with id: ${id}`); // Debug log
          const query = { _id: new ObjectId(id) };
          const result = await blogs.findOne(query);
          console.log(`Fetched blog post: ${JSON.stringify(result)}`); // Debug log

          if (!result) {
            return res.status(404).send('Resource not found');
          }

          // Ensure categories is an array
          const categoriesArray = Array.isArray(result.categories) ? result.categories : [result.categories];
          console.log(`Categories Array: ${JSON.stringify(categoriesArray)}`); // Debug log

          // Fetch related articles by category excluding the current article
          const relatedArticles = await blogs
            .find({
              categories: { $in: categoriesArray },
              _id: { $ne: new ObjectId(id) }
            })
            .limit(3)
            .toArray();
          console.log(`Fetched related articles: ${JSON.stringify(relatedArticles)}`); // Debug log

          res.send({ ...result, relatedArticles });
        } catch (error) {
          console.error('GET by ID error:', error);
          res.status(500).send('Internal server error');
        }
      } else if (req.query.type === 'categories') {
        try {
          console.log('Fetching categories'); // Debug log
          const categories = await blogs.distinct('categories');
          console.log(`Fetched categories: ${JSON.stringify(categories)}`); // Debug log
          res.status(200).json(categories);
        } catch (error) {
          console.error('GET categories error:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      } else if (req.query.category) {
        try {
          console.log(`Fetching blogs with category: ${req.query.category}`); // Debug log
          const result = await blogs.find({ categories: req.query.category }).toArray();
          console.log(`Fetched blogs by category: ${JSON.stringify(result)}`); // Debug log
          res.status(200).json(result);
        } catch (error) {
          console.error('GET by category error:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      } else {
        try {
          console.log('Fetching all blogs'); // Debug log
          const result = await blogs.find({}).toArray();
          console.log(`Fetched all blogs: ${JSON.stringify(result)}`); // Debug log
          res.status(200).json(result);
        } catch (error) {
          console.error('GET all error:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      }
      break;

    case 'PUT':
      try {
        await runMiddleware(req, res, uploadMiddleware);

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