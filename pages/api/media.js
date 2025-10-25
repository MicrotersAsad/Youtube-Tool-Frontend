import multer from 'multer';
// 🛑 fs import removed as local file system operations are no longer needed
import path from 'path';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import { slugify } from '../../utils/slugify';
import FormData from 'form-data';
import fetch from 'node-fetch'; 

// 🛑 IMPORTANT: This is the URL of your running Express server
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

// ✅ Multer Configuration for MEMORY STORAGE (EROFS Solution)
const upload = multer({
    storage: multer.memoryStorage(), // ✅ Memory Storage ব্যবহার করা হচ্ছে
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

export const config = {
    api: {
        bodyParser: false, // Required for Multer to work
    },
};

// ✅ Upload file to Express server (Uses Buffer directly)
const uploadFileToExpress = async (fileBuffer, originalname, title) => {
    // 🛑 No local file system usage
    
    const form = new FormData();
    
    // ✅ Buffer ব্যবহার করে ডেটা যোগ করা হচ্ছে
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

const handler = async (req, res) => {
    const { db } = await connectToDatabase();

    if (req.method === 'POST') {
        // Step 1: Get file from memory using Multer
        await runMiddleware(req, res, upload.single('file'));

        const { title } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'File upload is required.' });
        }

        // Get file buffer and original name from memory
        const fileBuffer = req.file.buffer;
        const originalname = req.file.originalname;
        
        let newImageUrl; // URL received from Express

        try {
            const sanitizedTitle = slugify(title || originalname); // Used for metadata, not file name

            // Step 2: Forward file buffer to the Express server
            newImageUrl = await uploadFileToExpress(fileBuffer, originalname, title); 

            // 🛑 Local file deletion code removed

            // Step 3: Save metadata to MongoDB
            const imageMetadata = {
                title: title || originalname,
                url: newImageUrl, 
                uploadDate: new Date(),
            };

            const result = await db.collection('images').insertOne(imageMetadata);
            if (!result.acknowledged) {
                throw new Error('Error inserting content');
            }
            res.status(200).json({ message: 'Image uploaded successfully.', data: { _id: result.insertedId, ...imageMetadata } });
        } catch (error) {
            console.error('Error inserting content:', error);
            
            // Clean up Express file in case of MongoDB insertion failure
            if (newImageUrl) {
                const fileToDelete = path.basename(newImageUrl);
                const deleteUrl = `${EXPRESS_BASE_URL}/delete-image/${fileToDelete}`;
                await fetch(deleteUrl, { method: 'DELETE' }).catch(err => console.warn('Express cleanup failed:', err));
            }
            
            res.status(500).json({ message: 'Error inserting content', error: error.message });
        }
    } else if (req.method === 'DELETE') {
        const { id } = req.query;

        try {
            const image = await db.collection('images').findOne({ _id: new ObjectId(id) });
            if (!image) {
                return res.status(404).json({ message: 'Image not found' });
            }

            // Step 1: Send Delete request to Express server
            const fileToDelete = path.basename(image.url); // Extract filename from full URL
            const deleteUrl = `${EXPRESS_BASE_URL}/delete-image/${fileToDelete}`;

            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE',
            });
            
            // Warning: Log deletion failure but proceed to delete metadata
            if (deleteResponse.status !== 200) {
                 console.warn(`Express server file deletion failed for ${fileToDelete}: Status ${deleteResponse.status}. Deleting metadata only.`);
            }

            // Step 2: Delete metadata from MongoDB
            await db.collection('images').deleteOne({ _id: new ObjectId(id) });

            res.status(200).json({ message: 'Image deleted successfully' });
        } catch (error) {
            console.error('Error deleting content:', error);
            res.status(500).json({ message: 'Error deleting content', error: error.message });
        }
    } else if (req.method === 'GET') {
        try {
            const images = await db.collection('images').find().toArray();
            res.status(200).json({ images });
        } catch (error) {
            console.error('Error fetching images:', error);
            res.status(500).json({ message: 'Error fetching images', error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Only POST, DELETE, and GET requests allowed' });
    }
};

export default handler;