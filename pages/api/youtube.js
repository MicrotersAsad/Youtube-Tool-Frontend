import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from "mongodb";
import multer from 'multer';
import FormData from 'form-data'; // ✅ For sending files to Express
import fetch from 'node-fetch'; // ✅ For making HTTP requests to Express
import fs from 'fs';
import path from 'path';

// ❌ AWS S3/multer-s3 সম্পর্কিত ইম্পোর্ট এবং কনফিগারেশন বাদ দেওয়া হয়েছে

// 🛑 Express সার্ভারের বেস URL (আপলোড/ডিলিট এর জন্য)
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

// Disable built-in body parser for file upload handling by multer
export const config = {
    api: {
        bodyParser: false, // Disable Next.js body parsing to let multer handle it
    },
};

// Multer Configuration for TEMPORARY storage
const upload = multer({
    storage: multer.diskStorage({
        destination: './tmp/uploads', // Temporary folder
        filename: (req, file, cb) => {
            cb(null, file.originalname); 
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
    }
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

// Authorization Middleware
const checkAuthorization = (req) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    const validToken = process.env.AUTH_TOKEN; // Stored in .env

    if (!token || token !== validToken) {
        return false;
    }

    return true;
};

// Error Handling
const errorHandler = (res, error) => {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
};

// -----------------------------------------------------------------
// ## Express Service Functions
// -----------------------------------------------------------------

// Upload file to Express server and return the full URL
const uploadFileToExpress = async (filePath, originalname, title) => {
    const fileData = fs.readFileSync(filePath);
    const form = new FormData();

    form.append('file', fileData, originalname);
    form.append('title', title || originalname); 

    const uploadResponse = await fetch(`${EXPRESS_BASE_URL}/upload-image`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const uploadResult = await uploadResponse.json();

    if (uploadResponse.status !== 200) {
        throw new Error(uploadResult.message || 'Express server upload failed.');
    }

    return `${EXPRESS_BASE_URL}${uploadResult.data.url}`;
};

// Delete file from Express server
const deleteFileFromExpress = async (imageUrl) => {
    const fileToDelete = path.basename(imageUrl);
    const deleteUrl = `${EXPRESS_BASE_URL}/delete-image/${fileToDelete}`;

    const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
    });

    if (deleteResponse.status !== 200) {
        console.warn(`Express server file deletion failed for ${fileToDelete}. Status: ${deleteResponse.status}`);
    }
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

// -----------------------------------------------------------------
// ## Request Handlers
// -----------------------------------------------------------------

export default async function handler(req, res) {
    const { method, query } = req;

    // Authorization Check
    if (!checkAuthorization(req)) {
        return res.status(401).json({ message: 'Unauthorized access. Invalid token.' }); // Changed to 401
    }

    let db;
    try {
        ({ db } = await connectToDatabase());
    } catch (error) {
        return errorHandler(res, error);
    }

    const youtube = db.collection('youtube');

    try {
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
    } catch (error) {
        errorHandler(res, error);
    }
}

const handlePostRequest = async (req, res, youtube) => {
    let filePath, newImageUrl;

    try {
        await runMiddleware(req, res, upload.single('image'));

        const formData = req.body;
        const {
            content, title, metaTitle, description, slug, metaDescription, category, language,
            author, editor, developer,
        } = formData;

        // 1. Upload the file to Express (if present)
        if (req.file) {
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, title);
        }

        // 2. Clean up local temporary file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Field validation
        if (!category || !content || !title || !slug || !metaTitle || !description || !metaDescription || !language || !author || !editor || !developer) {
            if (newImageUrl) await deleteFileFromExpress(newImageUrl); // Clean up Express file
            return res.status(400).json({ message: 'Invalid request body or missing required fields' });
        }

        // Generate a unique slug
        const uniqueSlug = await generateUniqueSlug(slug, language, youtube);
        const existingyoutube = await youtube.findOne({ 'translations.slug': slug });
        
        const translationFields = {
            title, content, metaTitle, description, metaDescription, category,
            image: newImageUrl, // Use Express URL
            slug: uniqueSlug,
        };
        const coreFields = { author, editor, developer };


        if (existingyoutube) {
            // Handle image replacement logic
            let oldImageUrl = existingyoutube.translations[language]?.image;
            if (newImageUrl && oldImageUrl && newImageUrl !== oldImageUrl) {
                await deleteFileFromExpress(oldImageUrl); // Delete old image
            }

            const updateDoc = {
                $set: {
                    ...Object.fromEntries(Object.entries(translationFields).map(([key, value]) => [`translations.${language}.${key}`, value])),
                    ...coreFields,
                },
            };

            const result = await youtube.updateOne({ _id: existingyoutube._id }, updateDoc);

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

            const result = await youtube.insertOne(doc);

            if (!result.insertedId) {
                return res.status(500).json({ message: 'Failed to insert document' });
            }

            res.status(201).json(doc);
        }
    } catch (error) {
        // General cleanup on error
        if (newImageUrl) await deleteFileFromExpress(newImageUrl);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        errorHandler(res, error);
    }
};

const handleGetRequest = async (req, res, youtube, query) => {
    try {
        const { id, slug, page = 1, limit = 10 } = query;

        // Case 1: Fetch by ID
        if (id) {
            try {
                const result = await youtube.findOne({ _id: new ObjectId(id) });
                if (!result) return res.status(404).json({ message: 'Resource not found by ID.' });
                return res.status(200).json(result);
            } catch (error) {
                return res.status(400).json({ message: 'Invalid ID format.', error: error.message });
            }
        }

        // Case 2: Fetch by Slug
        if (slug) {
            const result = await youtube.findOne({ [`translations.en.slug`]: slug });
            if (!result) return res.status(404).json({ message: `Resource not found for the slug: ${slug}` });
            return res.status(200).json(result);
        }

        // Case 3: Pagination
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
        errorHandler(res, error);
    }
};

const handlePutRequest = async (req, res, youtube, query) => {
    let filePath, newImageUrl;

    try {
        await runMiddleware(req, res, upload.single('image'));

        const id = query.id;
        const { language, category, ...updatedData } = req.body;
        
        // Find existing document to get old image URL
        const existingyoutube = await youtube.findOne({ _id: new ObjectId(id) });
        if (!existingyoutube) {
             if (req.file) { filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename); if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } // Clean local temp file
             return res.status(404).json({ message: 'Resource not found' });
        }
        
        // 1. Upload new file to Express (if present)
        if (req.file) {
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, updatedData.title);

            // Clean up local temporary file
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

            // 2. Delete OLD image from Express server
            const oldImageUrl = existingyoutube.translations[language]?.image;
            if (oldImageUrl) {
                await deleteFileFromExpress(oldImageUrl);
            }
        }

        // Update logic:
        const finalImageUrl = newImageUrl || existingyoutube.translations[language]?.image;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid youtube ID format' });
        }

        if (category && category !== 'Uncategorized') {
            updatedData.category = category;
        } else {
            delete updatedData.category;
        }
        
        // Final Document Structure
        const translationFields = {
            title: updatedData.title, content: updatedData.content, metaTitle: updatedData.metaTitle,
            description: updatedData.description, metaDescription: updatedData.metaDescription,
            category: updatedData.category, image: finalImageUrl, slug: updatedData.slug,
        };
        const coreFields = {
            author: updatedData.author, editor: updatedData.editor, developer: updatedData.developer,
        };

        const updateDoc = {
            $set: {
                ...Object.fromEntries(Object.entries(translationFields).map(([key, value]) => [`translations.${language}.${key}`, value])),
                ...coreFields,
            },
        };

        const result = await youtube.updateOne({ _id: new ObjectId(id) }, updateDoc);

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Data updated successfully' });
        } else {
            res.status(404).json({ message: 'Data not found or no changes made' });
        }
    } catch (error) {
        // General cleanup on error
        if (newImageUrl) await deleteFileFromExpress(newImageUrl);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        errorHandler(res, error);
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

        const deleteTranslationImage = async (doc, lang) => {
            const imageUrl = doc.translations[lang]?.image;
            if (imageUrl) await deleteFileFromExpress(imageUrl);
        };


        if (language && youtubeDoc.translations && youtubeDoc.translations[language]) {
            await deleteTranslationImage(youtubeDoc, language); // Delete image first
            
            delete youtubeDoc.translations[language];

            if (Object.keys(youtubeDoc.translations).length === 0) {
                const deleteResult = await youtube.deleteOne({ _id: new ObjectId(id) });

                if (deleteResult.deletedCount === 1) {
                    return res.status(200).json({ message: 'Document deleted successfully as no translations remain.' });
                } else {
                    return res.status(500).json({ message: 'Failed to delete document.' });
                }
            } else {
                const updateResult = await youtube.updateOne({ _id: new ObjectId(id) }, { $set: { translations: youtubeDoc.translations } });

                if (updateResult.modifiedCount === 1) {
                    return res.status(200).json({ message: `Translation for language ${language} deleted.` });
                } else {
                    return res.status(500).json({ message: 'Failed to delete the translation.' });
                }
            }
        } else {
            // Delete entire document (should clean up default language image)
            const defaultLanguage = youtubeDoc.defaultLanguage;
            if (defaultLanguage) await deleteTranslationImage(youtubeDoc, defaultLanguage);

            const deleteResult = await youtube.deleteOne({ _id: new ObjectId(id) });

            if (deleteResult.deletedCount === 1) {
                return res.status(200).json({ message: 'Document deleted successfully.' });
            } else {
                return res.status(500).json({ message: 'Failed to delete document.' });
            }
        }
    } catch (error) {
        errorHandler(res, error);
    }
};