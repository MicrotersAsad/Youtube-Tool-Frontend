import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method, query: { id, lang }, body } = req;

  // Connect to the database
  const { db } = await connectToDatabase();
  const categoriesCollection = db.collection('categories');

  switch (method) {
    case 'GET':
      try {
        if (id) {
          // Fetch a specific category by ID
          const category = await categoriesCollection.findOne({ _id: new ObjectId(id) });
          if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
          }
          res.status(200).json(category);
        } else {
          // Fetch all categories
          const categories = await categoriesCollection.find({}).toArray();
          res.status(200).json(categories);
        }
      } catch (error) {
        console.error("GET Error:", error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        const { defaultLanguage, translations } = body;

        // Check if defaultLanguage and translations exist and are correctly structured
        if (!defaultLanguage || !translations || typeof translations !== 'object' || !translations[defaultLanguage]) {
          throw new Error('Default language and a valid translations object are required');
        }

        // Create the new category object
        const newCategory = {
          defaultLanguage,
          translations
        };

        // Insert the new category into the database
        const result = await categoriesCollection.insertOne(newCategory);

        // Confirm result contains the inserted category's ID
        if (!result.insertedId) {
          throw new Error('Failed to insert the category');
        }

        // Fetch and return the newly created category by its ID
        const createdCategory = await categoriesCollection.findOne({ _id: result.insertedId });
        res.status(201).json(createdCategory);
      } catch (error) {
        console.error("POST Error:", error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const { defaultLanguage, translations } = body;

        if (!defaultLanguage || !translations || typeof translations !== 'object' || !translations[defaultLanguage]) {
          throw new Error('Default language and translations are required');
        }

        // Update the category in the database
        const updateCategory = {
          $set: {
            defaultLanguage,
            translations
          }
        };

        const result = await categoriesCollection.updateOne(
          { _id: new ObjectId(id) },
          updateCategory
        );

        if (result.matchedCount === 0) {
          throw new Error('Category not found');
        }

        // Return the updated category
        const updatedCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
        res.status(200).json(updatedCategory);
      } catch (error) {
        console.error("PUT Error:", error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const category = await categoriesCollection.findOne({ _id: new ObjectId(id) });
        if (!category) {
          return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Check if the category has translations for the given language
        if (category.translations && category.translations[lang]) {
          // Remove the specific language translation
          delete category.translations[lang];

          // If no translations remain, delete the entire category
          if (Object.keys(category.translations).length === 0) {
            await categoriesCollection.deleteOne({ _id: new ObjectId(id) });
            res.status(200).json({ success: true, message: 'Category deleted as no translations remain.' });
          } else {
            // Otherwise, update the category without the deleted translation
            await categoriesCollection.updateOne(
              { _id: new ObjectId(id) },
              { $set: { translations: category.translations } }
            );
            res.status(200).json({ success: true, message: `Translation for language ${lang} deleted.` });
          }
        } else {
          throw new Error(`Translation for language ${lang} not found or undefined.`);
        }
      } catch (error) {
        console.error("DELETE Error:", error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(405).json({ success: false, error: 'Method not allowed' });
      break;
  }
}
