import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';
import { slugify } from '../../utils/slugify';
import FormData from 'form-data';
import fetch from 'node-fetch'; 

// 🛑 IMPORTANT: This is the URL of your running Express server
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

// Multer Configuration for Temporary Storage
// The file is first saved here before being forwarded to Express
const upload = multer({
    storage: multer.diskStorage({
        destination: './tmp/uploads', // Temporary folder
        filename: (req, file, cb) => {
            // Using original name for temp file, Express will handle unique naming
            cb(null, file.originalname); 
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

export const config = {
    api: {
        bodyParser: false, // Required for Multer to work
    },
};

const handler = async (req, res) => {
    const { db } = await connectToDatabase();

    if (req.method === 'POST') {
        // Step 1: Save file temporarily using Multer
        await runMiddleware(req, res, upload.single('file'));

        const { title } = req.body;
        
        if (!req.file) {
             return res.status(400).json({ message: 'File upload failed locally.' });
        }

        const filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
        
        try {
            const sanitizedTitle = slugify(title || req.file.originalname);
            
            // Step 2: Forward file to the Express server
            const fileData = fs.readFileSync(filePath);
            
            const form = new FormData();
            // Field name must match the one in Express's Multer setup ('file')
            form.append('file', fileData, req.file.filename); 
            form.append('title', title || req.file.originalname);

            const uploadResponse = await fetch(`${EXPRESS_BASE_URL}/upload-image`, {
                method: 'POST',
                body: form,
                headers: form.getHeaders(), 
            });

            const uploadResult = await uploadResponse.json();

            // Check if Express upload was successful
            if (uploadResponse.status !== 200) {
                throw new Error(uploadResult.message || 'Express server upload failed.');
            }
            
            // Step 3: Delete the local temporary file
            fs.unlinkSync(filePath);

            // Step 4: Save metadata to MongoDB
            const imageMetadata = {
                title: title || req.file.originalname,
                // Full accessible URL using the Express base and the path returned by Express
                url: `${EXPRESS_BASE_URL}${uploadResult.data.url}`, 
                uploadDate: new Date(),
            };

            const result = await db.collection('images').insertOne(imageMetadata);
            if (!result.acknowledged) {
                throw new Error('Error inserting content');
            }
            res.status(200).json({ message: 'Image uploaded successfully.', data: { _id: result.insertedId, ...imageMetadata } });
        } catch (error) {
            console.error('Error inserting content:', error);
            
            // Clean up temporary file in case of failure
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
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