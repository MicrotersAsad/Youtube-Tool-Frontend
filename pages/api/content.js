import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import FormData from 'form-data'; // ✅ For sending files to Express
import fetch from 'node-fetch'; // ✅ For making HTTP requests to Express
import fs from 'fs';
import path from 'path';

// 🛑 Express Server URL (Update if port changes)
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

export const config = {
    api: {
        bodyParser: false, // Disable default body parser for file uploads
    },
};

// Configure multer for TEMPORARY file storage before forwarding to Express
const upload = multer({
    storage: multer.diskStorage({
        destination: './tmp/uploads', // Temporary folder
        filename: (req, file, cb) => {
            cb(null, file.originalname); 
        },
    }),
    fileFilter: (req, file, cb) => {
        // Validation logic remains (important for security)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type'), false);
        }
        if (file.size > 5 * 1024 * 1024) {
            return cb(new Error('File is too large. Max size is 5MB'), false);
        }
        cb(null, true);
    }
});

// Run middleware for file upload
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

// -----------------------------------------------------------------
// ## Express Service Functions (NEW)
// -----------------------------------------------------------------

// Express সার্ভারে ফাইল আপলোড করে URL নিয়ে আসে
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
        console.warn(`Express server file deletion failed for ${fileToDelete}. Status: ${deleteResponse.status}`);
    }
};

// -----------------------------------------------------------------
// ## Core Middleware & Handlers
// -----------------------------------------------------------------

// CORS Middleware
function corsMiddleware(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

// Utility function to verify the JWT token
function checkAuthorization(req) {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting 'Bearer <token>'
    const validToken = process.env.AUTH_TOKEN; // Token stored in .env file

    return token && token === validToken;
}

// Main API handler
const handler = async (req, res) => {
    if (corsMiddleware(req, res)) return;

    if (!checkAuthorization(req)) {
        return res.status(401).json({ message: 'Authentication failed: Invalid or missing token' }); // Changed to 401
    }

    const { method } = req;

    switch (method) {
        case 'GET':
            await handleGet(req, res);
            break;
        case 'POST':
            await handlePost(req, res);
            break;
        case 'PUT':
            await handlePut(req, res);
            break;
        case 'PATCH':
            // PATCH handler missing, but we'll include it for completeness
            await handlePatch(req, res);
            break;
        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
};

// -----------------------------------------------------------------
// ## GET, POST, PUT/PATCH Handlers
// -----------------------------------------------------------------

// Handle GET request (No change needed)
const handleGet = async (req, res) => {
    const { category, language } = req.query;
    const { db } = await connectToDatabase();

    if (!category && !language) {
        try {
            const count = await db.collection('content').countDocuments();
            return res.status(200).json({ totalCount: count });
        } catch (error) {
            return res.status(500).json({ message: 'Failed to count documents', error: error.message });
        }
    }

    if (!category || !language) {
        return res.status(400).json({ message: 'Category and language are required' });
    }

    try {
        const result = await db.collection('content').findOne({ category, [`translations.${language}`]: { $exists: true } });
        if (!result) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch content', error: error.message });
    }
};

// Handle POST request (Updated for Express connection)
const handlePost = async (req, res) => {
    let filePath, newImageUrl;
    try {
        await runMiddleware(req, res, upload.single('image'));
        
        const { category, language } = req.query;
        const { content, title, description } = req.body;
        
        const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
        const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

        if (!category || !content || !title || !description || !language) {
            // No need to delete file from Express yet, as it hasn't been uploaded
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Upload file to Express (if present)
        if (req.file) {
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, title);
        }

        // 2. Clean up local temporary file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        const translation = {
            content,
            title,
            description,
            image: newImageUrl, // Use Express URL
            faqs,
            relatedTools,
            reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
        };

        const { db } = await connectToDatabase();
        const filter = { category };
        const updateDoc = { $set: { [`translations.${language}`]: translation } };
        const options = { upsert: true };

        const result = await db.collection('content').updateOne(filter, updateDoc, options);
        if (!result.matchedCount && !result.upsertedCount) {
            throw new Error('Failed to insert or update document');
        }

        res.status(201).json({ message: 'Document inserted/updated successfully' });
    } catch (error) {
        // Clean up Express file if DB operation fails
        if (newImageUrl) {
            await deleteFileFromExpress(newImageUrl);
        }
        // Clean up local temp file
        if (filePath && fs.existsSync(filePath)) {
             fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Failed to handle POST request', error: error.message });
    }
};

// Handle PUT request (Updated for Express connection and image replacement logic)
const handlePut = async (req, res) => {
    let filePath, newImageUrl;

    try {
        await runMiddleware(req, res, upload.single('image'));
        
        const { category, language } = req.query;
        const { content, title, description, faqs, relatedTools } = req.body;

        const parsedFaqs = faqs ? JSON.parse(faqs) : [];
        const parsedRelatedTools = relatedTools ? JSON.parse(relatedTools) : [];

        if (!category || !content || !title || !description || !language) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const { db } = await connectToDatabase();
        const filter = { category };
        const existingContent = await db.collection('content').findOne(filter);
        
        if (!existingContent) {
             return res.status(404).json({ message: 'Content to update not found.' });
        }

        // 1. Upload new file to Express (if present)
        if (req.file) {
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, title);
            
            // 2. Clean up local temporary file
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // 3. Delete OLD image from Express server
            const oldImageUrl = existingContent.translations[language]?.image;
            if (oldImageUrl) {
                await deleteFileFromExpress(oldImageUrl);
            }
        }

        const finalImageUrl = newImageUrl || existingContent.translations[language]?.image;

        const translation = {
            content,
            title,
            description,
            image: finalImageUrl, // Use the new image URL or the existing one
            faqs: parsedFaqs,
            relatedTools: parsedRelatedTools,
        };

        const updateDoc = { $set: { [`translations.${language}`]: translation } };
        const options = { upsert: true }; // Use upsert=true for robustness

        const result = await db.collection('content').updateOne(filter, updateDoc, options);
        if (!result.matchedCount && !result.upsertedCount) {
            throw new Error('Failed to update document');
        }

        res.status(200).json({ message: 'Document updated successfully' });
    } catch (error) {
        // Clean up Express file if DB update fails
        if (newImageUrl) {
            await deleteFileFromExpress(newImageUrl);
        }
        // Clean up local temp file
        if (filePath && fs.existsSync(filePath)) {
             fs.unlinkSync(filePath);
        }
        res.status(500).json({ message: 'Failed to handle PUT request', error: error.message });
    }
};

// Handle PATCH request (Using PUT logic as an example)
const handlePatch = async (req, res) => {
    // For simplicity, we'll use the PUT logic here, but in a real app, PATCH should only update specific fields.
    await handlePut(req, res);
};

export default handler;