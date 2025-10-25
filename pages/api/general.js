import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// ❌ AWS S3/multer-s3 related imports and configurations are removed

// 🛑 Express Server URL (Update if port changes)
const EXPRESS_BASE_URL = 'http://localhost:4000';

export const config = {
    api: {
        bodyParser: false, // Disable default bodyParser to handle form-data
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
});

const runMiddleware = (req, res, fn) =>
    new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });

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

// -----------------------------------------------------------------
// ## Main Handler
// -----------------------------------------------------------------

export default async function handler(req, res) {
    const { method, query } = req;
    let db;

    try {
        ({ db } = await connectToDatabase());
    } catch (error) {
        console.error('Database connection error:', error);
        return res.status(500).json({ message: 'Database connection error', error: error.message });
    }

    const collection = db.collection('general');

    switch (method) {
        case 'POST':
            await handlePostRequest(req, res, collection);
            break;
        case 'GET':
            await handleGetRequest(req, res, collection, query);
            break;
        case 'PUT':
            await handlePutRequest(req, res, collection, query);
            break;
        case 'DELETE':
            await handleDeleteRequest(req, res, collection, query);
            break;
        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

// -----------------------------------------------------------------
// ## Request Handlers
// -----------------------------------------------------------------

const handlePostRequest = async (req, res, collection) => {
    let filePath, newImageUrl;

    try {
        await runMiddleware(req, res, upload.single('image')); // Save file to temp folder

        const { siteTitle } = req.body;

        // 1. Upload to Express
        if (req.file) {
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, siteTitle);
        }

        // 2. Clean up temporary file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        if (!siteTitle || !newImageUrl) {
            // If validation fails after Express upload, delete the new image
            if (newImageUrl) await deleteFileFromExpress(newImageUrl);
            return res.status(400).json({ message: 'Site title and image are required' });
        }

        const newDocument = {
            siteTitle,
            image: newImageUrl, // ✅ Express URL
            uploadedAt: new Date(),
        };

        const result = await collection.insertOne(newDocument);

        if (result.insertedId) {
            return res.status(201).json({ message: 'File uploaded successfully', data: { _id: result.insertedId, ...newDocument } });
        } else {
            throw new Error('Failed to save document in the database');
        }
    } catch (error) {
        console.error('POST error:', error);
        // Clean up Express file if DB insertion fails
        if (newImageUrl) await deleteFileFromExpress(newImageUrl);
        // Clean up local temp file
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const handleGetRequest = async (req, res, collection, query) => {
    try {
        if (query.id) {
            const id = query.id;
            if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
            
            const document = await collection.findOne({ _id: new ObjectId(id) });
            if (!document) return res.status(404).json({ message: 'Resource not found' });

            res.status(200).json(document);
        } else {
            const documents = await collection.find().toArray();
            res.status(200).json(documents);
        }
    } catch (error) {
        console.error('GET error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const handlePutRequest = async (req, res, collection, query) => {
    let filePath, newImageUrl;

    try {
        const { id } = query;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });

        const existingDocument = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingDocument) return res.status(404).json({ message: 'Document not found' });

        await runMiddleware(req, res, upload.single('image')); // Parse incoming file

        const updatedData = { ...req.body };
        let oldImageUrl = existingDocument.image;

        if (req.file) {
            // 1. Upload new file to Express
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, updatedData.siteTitle || existingDocument.siteTitle);

            // 2. Clean up temporary file
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            
            // 3. Delete OLD image from Express server
            if (oldImageUrl) await deleteFileFromExpress(oldImageUrl);

            updatedData.image = newImageUrl; // Update URL
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Document updated successfully', data: updatedData });
        } else {
            res.status(200).json({ message: 'Document found, but no changes were made' });
        }
    } catch (error) {
        console.error('PUT error:', error);
        // Clean up Express file if DB update fails
        if (newImageUrl) await deleteFileFromExpress(newImageUrl);
        // Clean up local temp file
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const handleDeleteRequest = async (req, res, collection, query) => {
    try {
        const { id } = query;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });

        const existingDocument = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingDocument) return res.status(404).json({ message: 'Document not found' });
        
        const imageUrl = existingDocument.image;

        // 1. Delete the image from the Express server
        if (imageUrl) await deleteFileFromExpress(imageUrl);

        // 2. Delete the document from MongoDB
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Document deleted successfully' });
        } else {
            // This case should not happen if the document was found above
            res.status(500).json({ message: 'Failed to delete document' });
        }
    } catch (error) {
        console.error('DELETE error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};