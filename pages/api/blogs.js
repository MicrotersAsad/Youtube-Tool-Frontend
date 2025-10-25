import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import FormData from 'form-data'; 
import fetch from 'node-fetch'; 
import path from 'path'; // ফাইল ডিলিট করার জন্য basename দরকার


// 🛑 Express সার্ভারের বেস URL
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

export const config = {
    api: {
        bodyParser: false, // Multer ব্যবহার করার জন্য এটি false রাখা আবশ্যক
    },
};

// ✅ Multer Configuration for Memory Storage
// ফাইলগুলি ডিস্কে সেভ না হয়ে সরাসরি মেমোরিতে (buffer হিসেবে) থাকবে।
const upload = multer({
    storage: multer.memoryStorage(),
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

    return token && token === validToken;
};

export default async function handler(req, res) {
    const { method, query } = req;

    // Authorization Check
    if (!checkAuthorization(req)) {
        return res.status(401).json({ message: 'Unauthorized Access' });
    }

    let db;

    try {
        ({ db } = await connectToDatabase());
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



// ✅ Express সার্ভারে ফাইল আপলোড করে URL নিয়ে আসে
// এই ফাংশনটি এখন সরাসরি ফাইল Buffer (fileBuffer) গ্রহণ করবে।
const uploadFileToExpress = async (fileBuffer, originalname, title) => {
    const form = new FormData();
    
    // Express সার্ভারের Multer ফিল্ডের নাম 'file' হতে হবে
    // Buffer ডেটা এবং ফাইলের নাম ব্যবহার করে FormData তে যোগ করা হচ্ছে
    form.append('file', fileBuffer, { filename: originalname }); 
    form.append('title', title);

    const uploadResponse = await fetch(`${EXPRESS_BASE_URL}/upload-image`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const uploadResult = await uploadResponse.json();

    if (uploadResponse.status !== 200) {
        throw new Error(uploadResult.message || 'Express server upload failed.');
    }
    
    // MongoDB-তে সেভ করার জন্য সম্পূর্ণ URL
    return `${EXPRESS_BASE_URL}${uploadResult.data.url}`; 
};

// Express সার্ভার থেকে ফাইল ডিলিট করে
const deleteFileFromExpress = async (imageUrl) => {
    const fileToDelete = path.basename(imageUrl);
    const deleteUrl = `${EXPRESS_BASE_URL}/delete-image/${fileToDelete}`;

    const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
    });

    if (deleteResponse.status !== 200) {
        console.warn(`Express server file deletion failed for ${fileToDelete}: Status ${deleteResponse.status}.`);
    }
};

// ---

const handlePostRequest = async (req, res, blogs) => {
    let newImageUrl; // 🛑 filePath variable has been removed

    try {
        await runMiddleware(req, res, upload.single('image'));

        const formData = req.body;
        const {
            content, title, metaTitle, description, slug, metaDescription, category,
            language, author, editor, developer,
        } = formData;

        const isImageUploaded = !!req.file;
        const fileBuffer = req.file?.buffer; // ✅ মেমোরি থেকে Buffer নিন
        
        // 1. Express-এ ইমেজ আপলোড
        if (isImageUploaded) {
            // ✅ uploadFileToExpress ফাংশনে Buffer পাঠানো হচ্ছে
            newImageUrl = await uploadFileToExpress(fileBuffer, req.file.originalname, title);
        }

        // Simplified validation check
        if (!content || !title || !slug || !language) {
            if (newImageUrl) await deleteFileFromExpress(newImageUrl); // Clean up Express file if validation fails
            return res.status(400).json({ message: 'Missing required fields (content, title, slug, or language)' });
        }
        
        // 🛑 লোকাল ফাইল ডিলিট করার যুক্তি মুছে দেওয়া হয়েছে (memory storage এর জন্য দরকার নেই)

        const existingBlog = await blogs.findOne({ [`translations.${language}.slug`]: slug });
        
        const translationFields = {
            title, content, metaTitle, description, metaDescription, category, slug,
            image: newImageUrl, 
        };
        
        const coreFields = { author, editor, developer };

        // 2. MongoDB অপারেশন (Update/Insert)
        if (existingBlog) {
            let oldImageUrl = existingBlog.translations[language]?.image;
            
            if (newImageUrl && oldImageUrl && newImageUrl !== oldImageUrl) {
                await deleteFileFromExpress(oldImageUrl); // Delete old image
            }

            const updateDoc = {
                $set: {
                    ...Object.fromEntries(
                        Object.entries(translationFields).map(([key, value]) => [`translations.${language}.${key}`, value])
                    ),
                    ...coreFields,
                },
            };

            const result = await blogs.updateOne({ _id: existingBlog._id }, updateDoc);

            if (result.modifiedCount === 1) {
                return res.status(200).json({ message: 'Data updated successfully' });
            } else {
                return res.status(500).json({ message: 'Failed to update document' });
            }
        } else {
            const doc = {
                defaultLanguage: language,
                translations: { [language]: translationFields },
                ...coreFields,
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
        
        // 🛑 লোকাল ফাইল ডিলিট করার যুক্তি মুছে দেওয়া হয়েছে
        if (newImageUrl) {
            await deleteFileFromExpress(newImageUrl); // Express ফাইল ক্লিনআপ
        }

        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// ---

const handlePutRequest = async (req, res, blogs, query) => {
    let newImageUrl; // 🛑 filePath variable has been removed

    try {
        await runMiddleware(req, res, upload.single('image'));

        const id = query.id;
        const { language, ...updatedData } = req.body;

        if (!ObjectId.isValid(id) || !language) {
            return res.status(400).json({ message: 'Invalid blogs ID or missing language' });
        }
        
        const existingBlog = await blogs.findOne({ _id: new ObjectId(id) });
        if (!existingBlog) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        // 1. Express-এ ইমেজ আপলোড
        if (req.file) {
            const fileBuffer = req.file?.buffer; // ✅ মেমোরি থেকে Buffer নিন
            newImageUrl = await uploadFileToExpress(fileBuffer, req.file.originalname, updatedData.title);
        }

        // 🛑 লোকাল ফাইল ডিলিট করার যুক্তি মুছে দেওয়া হয়েছে

        // Handle image replacement logic:
        let oldImageUrl = existingBlog.translations[language]?.image;
        let finalImageUrl = newImageUrl || oldImageUrl;

        if (newImageUrl && oldImageUrl && newImageUrl !== oldImageUrl) {
            await deleteFileFromExpress(oldImageUrl); // Delete old image
        }

        const translationFields = {
            title: updatedData.title, content: updatedData.content, metaTitle: updatedData.metaTitle,
            description: updatedData.description, metaDescription: updatedData.metaDescription,
            category: updatedData.category, slug: updatedData.slug,
            image: finalImageUrl, // Set the new or existing image URL
        };
        
        const coreFields = { 
            author: updatedData.author, editor: updatedData.editor, developer: updatedData.developer 
        };

        const updateDoc = {
            $set: {
                ...Object.fromEntries(
                    Object.entries(translationFields).map(([key, value]) => [`translations.${language}.${key}`, value])
                ),
                ...coreFields,
            },
        };

        const result = await blogs.updateOne({ _id: new ObjectId(id) }, updateDoc);

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Data updated successfully' });
        } else {
            res.status(404).json({ message: 'Data not found or no changes made' });
        }
    } catch (error) {
        console.error('PUT error:', error);
        
        // 🛑 লোকাল ফাইল ডিলিট করার যুক্তি মুছে দেওয়া হয়েছে
        if (newImageUrl) {
            await deleteFileFromExpress(newImageUrl); // Express ফাইল ক্লিনআপ
        }
        
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// ---

const handleGetRequest = async (req, res, blogs, query) => {
    try {
        if (query.id) {
            const id = query.id;
            const result = await blogs.findOne({ _id: new ObjectId(id) });

            if (!result) return res.status(404).json({ message: 'Resource not found' });
            res.status(200).json(result);
        } else if (query.slug) {
            const slug = query.slug;
            const result = await blogs.findOne({ 'translations.slug': slug });

            if (!result) return res.status(404).json({ message: 'Resource not found' });
            res.status(200).json(result);
        } else if (query.name && query.role) {
            const filter = { [query.role]: query.name };
            const filteredblogs = await blogs.find(filter).toArray();

            if (filteredblogs.length === 0) return res.status(404).json({ message: 'No posts found for this person' });
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

// ---

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
        
        // Function to handle Express file deletion logic
        const deleteTranslationImage = async (doc, lang) => {
            const imageUrl = doc.translations[lang]?.image;
            if (imageUrl) {
                await deleteFileFromExpress(imageUrl);
            }
        };


        if (language && blogsDoc.translations && blogsDoc.translations[language]) {
            // Deleting a specific translation
            await deleteTranslationImage(blogsDoc, language); // Delete image first
            
            delete blogsDoc.translations[language];

            if (Object.keys(blogsDoc.translations).length === 0) {
                // If no translations remain, delete the entire document
                const deleteResult = await blogs.deleteOne({ _id: new ObjectId(id) });
                if (deleteResult.deletedCount === 1) {
                    return res.status(200).json({ message: 'Document deleted successfully as no translations remain.' });
                } else {
                    return res.status(500).json({ message: 'Failed to delete document.' });
                }
            } else {
                // If other translations exist, just update the document
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
            // Deleting the entire document
            const defaultLanguage = blogsDoc.defaultLanguage;
            if (defaultLanguage) {
                await deleteTranslationImage(blogsDoc, defaultLanguage);
            }
            // Note: You might need to loop through ALL translations in a real app to delete all images.

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
