import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
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

// Generate a unique slug if a duplicate exists
const generateUniqueSlug = async (slug, language, youtube) => {
  let uniqueSlug = slug;
  let counter = 1;
  while (await youtube.findOne({ [`translations.${language}.slug`]: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter += 1;
  }
  return uniqueSlug;
};

export default async function handler(req, res) {
  const { method, query } = req;
  let db, client;

  try {
    ({ db, client } = await connectToDatabase());
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Database connection error', error: error.message });
  }

  const youtube = db.collection('youtube');

  switch (method) {
    case 'POST':
      await handlePostRequest(req, res, youtube);
      break;

    case 'GET':
      await handleGetRequest(req, res, youtube, query);
      break;

    case 'PUT':
      await handlePutRequest(req, res, youtube, query);
      break;

    case 'DELETE':
      await handleDeleteRequest(req, res, youtube, query);
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}

const handlePostRequest = async (req, res, youtube) => {
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
      category, // Ensure category is present
      language,
      author,
      editor,
      developer,
    } = formData;
    const image = req.file ? req.file.location : null;

    // Category field check
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    // Checking if all required fields are present
    if (
      !content ||
      !title ||
      !slug ||
      !metaTitle ||
      !description ||
      !metaDescription ||
      !language ||
      !author ||
      !editor ||
      !developer
    ) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    // Generate a unique slug if the slug already exists
    const uniqueSlug = await generateUniqueSlug(slug, language, youtube);

    const existingyoutube = await youtube.findOne({ 'translations.slug': slug });

    if (existingyoutube) {
      const updateDoc = {
        $set: {
          [`translations.${language}.title`]: title,
          [`translations.${language}.content`]: content,
          [`translations.${language}.metaTitle`]: metaTitle,
          [`translations.${language}.description`]: description,
          [`translations.${language}.metaDescription`]: metaDescription,
          [`translations.${language}.category`]: category, // Update category
          [`translations.${language}.image`]: image,
          [`translations.${language}.slug`]: uniqueSlug,
          author,
          editor,
          developer,
        },
      };

      const result = await youtube.updateOne(
        { _id: existingyoutube._id },
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
            category, // Set category in new document
            image,
            slug: uniqueSlug,
          },
        },
        author,
        editor,
        developer,
        viewCount: 0,
        createdAt: new Date(),
      };

      const result = await youtube.insertOne(doc);

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


const handleGetRequest = async (req, res, youtube, query) => {
  try {
    const { id, slug, page = 1, limit = 10 } = query;

    // Case 1: Fetch by ID
    if (id) {
      try {
        const result = await youtube.findOne({ _id: new ObjectId(id) });
        if (!result) {
          return res.status(404).json({ message: 'Resource not found by ID.' });
        }
        return res.status(200).json(result);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid ID format.', error: error.message });
      }
    }

    // Case 2: Fetch by Slug
    if (slug) {
      
      const result = await youtube.findOne({
        [`translations.en.slug`]: slug, // Match the slug within `translations`
      });


      if (!result) {
        return res.status(404).json({ message: `Resource not found for the slug: ${slug}` });
      }

      return res.status(200).json(result);
    }

    // Case 3: Pagination for General Retrieval
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber <= 0 || limitNumber <= 0) {
      return res.status(400).json({ message: 'Invalid pagination parameters.' });
    }

    const offset = (pageNumber - 1) * limitNumber;

    const [data, total] = await Promise.all([
      youtube.find({}).sort({ createdAt: -1 }).skip(offset).limit(limitNumber).toArray(),
      youtube.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(200).json({
      data,
      meta: {
        totalBlogs: total,
        totalPages,
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error('GET error:', error.message);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};







const handlePutRequest = async (req, res, youtube, query) => {
  try {
    await runMiddleware(req, res, upload.single('image'));

    const id = query.id;
    const { language, category, ...updatedData } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid youtube ID format' });
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

    const result = await youtube.updateOne(
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

const handleDeleteRequest = async (req, res, youtube, query) => {
  try {
    const { id, language } = query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const youtubeDoc = await youtube.findOne({ _id: new ObjectId(id) });

    if (!youtubeDoc) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (language && youtubeDoc.translations && youtubeDoc.translations[language]) {
      delete youtubeDoc.translations[language];

      if (Object.keys(youtubeDoc.translations).length === 0) {
        const deleteResult = await youtube.deleteOne({ _id: new ObjectId(id) });

        if (deleteResult.deletedCount === 1) {
          return res.status(200).json({ message: 'Document deleted successfully as no translations remain.' });
        } else {
          return res.status(500).json({ message: 'Failed to delete document.' });
        }
      } else {
        const updateResult = await youtube.updateOne(
          { _id: new ObjectId(id) },
          { $set: { translations: youtubeDoc.translations } }
        );

        if (updateResult.modifiedCount === 1) {
          return res.status(200).json({ message: `Translation for language ${language} deleted.` });
        } else {
          return res.status(500).json({ message: 'Failed to delete the translation.' });
        }
      }
    } else {
      const deleteResult = await youtube.deleteOne({ _id: new ObjectId(id) });

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
