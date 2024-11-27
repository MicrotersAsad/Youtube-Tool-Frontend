import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Check if bucket name is provided
if (!process.env.AWS_S3_BUCKET_NAME) {
  throw new Error("AWS_S3_BUCKET environment variable is not set");
}

// Configure multer to use S3 for image storage
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
    },
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

// Authorization Middleware
const checkAuthorization = (req) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  const validToken = process.env.AUTH_TOKEN; // Stored in .env

  if (!token || token !== validToken) {
    return false; // Unauthorized
  }
  return true; // Authorized
};

export default async function handler(req, res) {
  const { method, query } = req;

  // Authorization Check
  if (!checkAuthorization(req)) {
    return res.status(401).json({ message: 'You Are Hacker! I am Your Father' });
  }

  let db, client;

  try {
    ({ db, client } = await connectToDatabase());
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error', error: error.message });
  }

  const blogs = db.collection('blogs');

  switch (method) {
    case 'POST':
      await handlePostRequest(req, res, blogs);
      break;

    case 'GET':
      await handleGetRequest(req, res, blogs, query);
      break;

    case 'PUT':
      await handlePutRequest(req, res, blogs, query);
      break;

    case 'DELETE':
      await handleDeleteRequest(req, res, blogs, query);
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}

const handlePostRequest = async (req, res, blogs) => {
  try {
    await runMiddleware(req, res, upload.single('image'));

    const formData = req.body;
    const {
      content,
      title,
      metaTitle,
      description,
      slug,
      metaDescription,
      category,
      language,
      author,
      editor,
      developer,
    } = formData;
    const image = req.file ? req.file.location : null;

    if (
      !content ||
      !title ||
      !slug ||
      !metaTitle ||
      !description ||
      !metaDescription ||
      !category ||
      !language ||
      !author ||
      !editor ||
      !developer
    ) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const existingblogs = await blogs.findOne({ 'translations.slug': slug });

    if (existingblogs) {
      const updateDoc = {
        $set: {
          [`translations.${language}.title`]: title,
          [`translations.${language}.content`]: content,
          [`translations.${language}.metaTitle`]: metaTitle,
          [`translations.${language}.description`]: description,
          [`translations.${language}.metaDescription`]: metaDescription,
          [`translations.${language}.category`]: category,
          [`translations.${language}.image`]: image,
          [`translations.${language}.slug`]: slug,
          author,
          editor,
          developer,
        },
      };

      const result = await blogs.updateOne(
        { _id: existingblogs._id },
        updateDoc
      );

      if (result.modifiedCount === 1) {
        return res.status(200).json({ message: 'Data updated successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to update document' });
      }
    } else {
      const doc = {
        defaultLanguage: language,
        translations: {
          [language]: {
            title,
            content,
            metaTitle,
            description,
            metaDescription,
            category,
            image,
            slug,
          },
        },
        author,
        editor,
        developer,
        viewCount: 0,
        createdAt: new Date(),
      };

      const result = await blogs.insertOne(doc);

      if (!result.insertedId) {
        return res.status(500).json({ message: 'Failed to insert document' });
      }

      res.status(201).json(doc);
    }
  } catch (error) {
    console.error('POST error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const handlePutRequest = async (req, res, blogs, query) => {
  try {
    await runMiddleware(req, res, upload.single('image'));

    const id = query.id;
    const { language, category, ...updatedData } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blogs ID format' });
    }

    if (req.file) {
      updatedData.image = req.file.location;
    }

    const updateDoc = {
      $set: {
        [`translations.${language}.title`]: updatedData.title,
        [`translations.${language}.content`]: updatedData.content,
        [`translations.${language}.metaTitle`]: updatedData.metaTitle,
        [`translations.${language}.description`]: updatedData.description,
        [`translations.${language}.metaDescription`]: updatedData.metaDescription,
        [`translations.${language}.category`]: updatedData.category,
        [`translations.${language}.image`]: updatedData.image,
        [`translations.${language}.slug`]: updatedData.slug,
        author: updatedData.author,
        editor: updatedData.editor,
        developer: updatedData.developer,
      },
    };

    const result = await blogs.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Data updated successfully' });
    } else {
      res.status(404).json({ message: 'Data not found or no changes made' });
    }
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const handleGetRequest = async (req, res, blogs, query) => {
  try {
    if (query.id) {
      const id = query.id;
      const result = await blogs.findOne({ _id: new ObjectId(id) });

      if (!result) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      res.status(200).json(result);
    } else if (query.slug) {
      const slug = query.slug;
      const result = await blogs.findOne({ 'translations.slug': slug });

      if (!result) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      res.status(200).json(result);
    } else if (query.name && query.role) {
      const filter = { [query.role]: query.name };
      const filteredblogs = await blogs.find(filter).toArray();

      if (filteredblogs.length === 0) {
        return res.status(404).json({ message: 'No posts found for this person' });
      }

      res.status(200).json(filteredblogs);
    } else {
      const blogsArray = await blogs.find({}).limit(15).toArray();
      res.status(200).json(blogsArray);
    }
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const handleDeleteRequest = async (req, res, blogs, query) => {
  try {
    const { id, language } = query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const blogsDoc = await blogs.findOne({ _id: new ObjectId(id) });

    if (!blogsDoc) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (language && blogsDoc.translations && blogsDoc.translations[language]) {
      delete blogsDoc.translations[language];

      if (Object.keys(blogsDoc.translations).length === 0) {
        const deleteResult = await blogs.deleteOne({ _id: new ObjectId(id) });

        if (deleteResult.deletedCount === 1) {
          return res.status(200).json({ message: 'Document deleted successfully as no translations remain.' });
        } else {
          return res.status(500).json({ message: 'Failed to delete document.' });
        }
      } else {
        const updateResult = await blogs.updateOne(
          { _id: new ObjectId(id) },
          { $set: { translations: blogsDoc.translations } }
        );

        if (updateResult.modifiedCount === 1) {
          return res.status(200).json({ message: `Translation for language ${language} deleted.` });
        } else {
          return res.status(500).json({ message: 'Failed to delete the translation.' });
        }
      }
    } else {
      const deleteResult = await blogs.deleteOne({ _id: new ObjectId(id) });

      if (deleteResult.deletedCount === 1) {
        return res.status(200).json({ message: 'Document deleted successfully.' });
      } else {
        return res.status(500).json({ message: 'Failed to delete document.' });
      }
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
