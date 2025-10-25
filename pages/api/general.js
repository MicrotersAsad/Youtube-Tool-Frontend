import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
// 🛑 fs import removed as local file system operations are no longer needed

// 🛑 Express Server URL
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

export const config = {
    api: {
        bodyParser: false, // Disable default bodyParser to handle form-data
    },
};

// ✅ Configure multer for MEMORY STORAGE (Ensures EROFS/Read-Only File System compatibility)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
    }
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

// ✅ Upload file to Express server (Uses Buffer directly from multer.memoryStorage)
const uploadFileToExpress = async (fileBuffer, originalname, title) => {
    // 🛑 No local file system usage (fs.readFileSync)

    const form = new FormData();

    // ✅ Appends file buffer to the form
    form.append('file', fileBuffer, { filename: originalname });
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
    // 🛑 filePath variable removed
    let newImageUrl;

    try {
        await runMiddleware(req, res, upload.single('image')); // File saved to memory

        const { siteTitle } = req.body;

        const isImageUploaded = !!req.file;
        const fileBuffer = req.file?.buffer; // ✅ Get Buffer from memory
        const originalname = req.file?.originalname;

        // 1. Upload to Express
        if (isImageUploaded) {
            newImageUrl = await uploadFileToExpress(fileBuffer, originalname, siteTitle);
        }

        // 🛑 Local temporary file cleanup code removed

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
        // 🛑 Local temporary file cleanup code removed

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
    // 🛑 filePath variable removed
    let newImageUrl;

    try {
        const { id } = query;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });

        const existingDocument = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingDocument) return res.status(404).json({ message: 'Document not found' });

        await runMiddleware(req, res, upload.single('image')); // File saved to memory

        const updatedData = { ...req.body };
        let oldImageUrl = existingDocument.image;

        if (req.file) {
            const fileBuffer = req.file?.buffer; // ✅ Get Buffer from memory
            const originalname = req.file?.originalname;

            // 1. Upload new file to Express
            newImageUrl = await uploadFileToExpress(fileBuffer, originalname, updatedData.siteTitle || existingDocument.siteTitle);

            // 🛑 Local temporary file cleanup code removed

            // 2. Delete OLD image from Express server
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
        // 🛑 Local temporary file cleanup code removed

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