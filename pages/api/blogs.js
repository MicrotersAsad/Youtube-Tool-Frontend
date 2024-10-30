
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

const createSlug = (title) => {
  return title
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export default async function handler(req, res) {
  const { method, query } = req;
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
    const image = req.file ? `/uploads/${req.file.filename}` : null;

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

    const existingBlog = await blogs.findOne({ 'translations.slug': slug });

    if (existingBlog) {
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
        { _id: existingBlog._id },
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
    res.status(500).json({ message: 'Internal server error' });
  }
};
const handlePutRequest = async (req, res, blogs, query) => {
  try {
    const { db } = await connectToDatabase();
    const categoriesCollection = db.collection('categories');

    await runMiddleware(req, res, upload.single('image'));

    const id = query.id;
    const { language, category, ...updatedData } = req.body;

    // Validate that the blog ID is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }

    // Ensure the category ID is a valid ObjectId
    if (!ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    // Fetch the full category details based on the provided category ID
    const categoryData = await categoriesCollection.findOne({ _id: new ObjectId(category) });
    if (!categoryData) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Get the category name based on the selected language or default to English if not available
    const categoryName = categoryData.translations[language]?.name || categoryData.translations['en'].name;

    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    const updateDoc = {
      $set: {
        [`translations.${language}.title`]: updatedData.title,
        [`translations.${language}.content`]: updatedData.content,
        [`translations.${language}.metaTitle`]: updatedData.metaTitle,
        [`translations.${language}.description`]: updatedData.description,
        [`translations.${language}.metaDescription`]: updatedData.metaDescription,
        [`translations.${language}.category`]: categoryName,
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
    res.status(500).json({ message: 'Internal server error' });
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
      // Filtering based on author/editor/developer name
      const filter = { [query.role]: query.name };
      const filteredBlogs = await blogs.find(filter).toArray();

      if (filteredBlogs.length === 0) {
        return res.status(404).json({ message: 'No posts found for this person' });
      }

      res.status(200).json(filteredBlogs);
    } else {
      const blogsArray = await blogs.find({}).limit(15).toArray();
      const updatedBlogsArray = blogsArray.map((blog) => {
        if (!blog.translations) {
          blog.translations = {};
        }
        if (!blog.translations.en) {
          const title = blog.title || blog.Title || '';
          const content = blog.content || blog.Content || '';
          blog.translations.en = {
            title,
            content,
            metaTitle: blog.metaTitle || '',
            description: blog.description || '',
            metaDescription: blog.metaDescription || '',
            category: blog.category || '',
            image: blog.image || '',
            slug: blog.slug || createSlug(title),
          };
        }
        return blog;
      });
      res.status(200).json(updatedBlogsArray);
    }
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const handleDeleteRequest = async (req, res, blogs, query) => {
  try {
    const { id, language } = query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const blog = await blogs.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check if the blog has the language translation specified for deletion
    if (language && blog.translations && blog.translations[language]) {
      delete blog.translations[language]; // Remove the specific language translation

      // If no translations remain, delete the entire blog post
      if (Object.keys(blog.translations).length === 0) {
        const deleteResult = await blogs.deleteOne({ _id: new ObjectId(id) });

        if (deleteResult.deletedCount === 1) {
          return res.status(200).json({ message: 'Blog post deleted successfully as no translations remain.' });
        } else {
          return res.status(500).json({ message: 'Failed to delete blog post.' });
        }
      } else {
        // Otherwise, update the blog post with the remaining translations
        const updateResult = await blogs.updateOne(
          { _id: new ObjectId(id) },
          { $set: { translations: blog.translations } }
        );

        if (updateResult.modifiedCount === 1) {
          return res.status(200).json({ message: `Translation for language ${language} deleted.` });
        } else {
          return res.status(500).json({ message: 'Failed to delete the translation.' });
        }
      }
    } else {
      // If no language is provided or the translation doesn't exist, delete the entire blog post
      const deleteResult = await blogs.deleteOne({ _id: new ObjectId(id) });

      if (deleteResult.deletedCount === 1) {
        return res.status(200).json({ message: 'Blog post deleted successfully.' });
      } else {
        return res.status(500).json({ message: 'Failed to delete blog post.' });
      }
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

