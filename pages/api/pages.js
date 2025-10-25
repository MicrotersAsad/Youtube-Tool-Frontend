import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from "mongodb";
import multer from 'multer';
import FormData from 'form-data'; // ✅ For sending files to Express
import fetch from 'node-fetch'; // ✅ For making HTTP requests to Express
// 🛑 fs import removed as local file system operations are no longer needed
import path from 'path';

// 🛑 Express Server URL
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

// Disable built-in body parser for file upload handling by multer
export const config = {
    api: {
        bodyParser: false, // Disable Next.js body parsing to let multer handle it
    },
};

// ✅ Multer Configuration for MEMORY STORAGE (EROFS Solution)
const upload = multer({
    storage: multer.memoryStorage(), // ✅ Memory Storage ব্যবহার করা হচ্ছে
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
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

// -----------------------------------------------------------------
// ## Express Service Functions
// -----------------------------------------------------------------

// ✅ Upload file to Express server (Updated to use Buffer)
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
    const { db } = await connectToDatabase();
    const pagesCollection = db.collection("pages");

    // Handle POST request - Create new page with image upload
    if (req.method === "POST") {
        // 🛑 filePath variable removed
        let metaImage; 
        
        try {
            await runMiddleware(req, res, upload.single('metaImage')); // 'metaImage' is the file field name
        } catch (error) {
            return res.status(400).json({ message: error.message }); // Catch Multer errors (size/type)
        }

        const { name, slug, content, metaTitle, metaDescription } = req.body;
        
        const isFileUploaded = !!req.file;
        const fileBuffer = req.file?.buffer; // ✅ Get Buffer
        const originalname = req.file?.originalname;


        try {
            // 1. Upload the file to Express (if present)
            if (isFileUploaded) {
                metaImage = await uploadFileToExpress(fileBuffer, originalname, name);
            }

            // 🛑 Local temporary file cleanup code removed

            // Check for required fields
            if (!name || !slug || !content || !metaTitle || !metaDescription) {
                if (metaImage) await deleteFileFromExpress(metaImage); // Clean up Express file
                return res.status(400).json({ message: "All fields are required" });
            }

            // Ensure the slug is unique
            const existingPage = await pagesCollection.findOne({ slug });
            if (existingPage) {
                if (metaImage) await deleteFileFromExpress(metaImage); // Clean up Express file
                return res.status(400).json({ message: "Slug already exists" });
            }

            // Insert the new page into the database
            const result = await pagesCollection.insertOne({
                name, slug, content, metaTitle, metaDescription, metaImage, // Store Express URL
                createdAt: new Date(),
            });

            return res.status(201).json({ message: "Page created", data: result });

        } catch (error) {
            console.error('POST error:', error);
            if (metaImage) await deleteFileFromExpress(metaImage); // Clean up Express file
            // 🛑 Local file cleanup code removed

            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }

    // Handle GET request - Fetch all pages or a single page
    if (req.method === "GET") {
        const { slug } = req.query;

        if (slug) {
            const page = await pagesCollection.findOne({ slug });
            if (!page) {
                return res.status(404).json({ message: "Page not found" });
            }
            return res.status(200).json(page);
        }

        const pages = await pagesCollection.find().toArray();
        return res.status(200).json(pages);
    }

    // Handle PUT request - Update an existing page
    if (req.method === "PUT") {
        // 🛑 filePath variable removed
        let newMetaImage;

        try {
            await runMiddleware(req, res, upload.single('metaImage')); // Parse incoming file
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        const { id, name, slug, content, metaTitle, metaDescription } = req.body;
        let metaImage = req.body.existingMetaImage; // Existing image URL passed from client

        try {
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid page ID" });
            }
            
            const existingPage = await pagesCollection.findOne({ _id: new ObjectId(id) });
            if (!existingPage) {
                return res.status(404).json({ message: "Page not found" });
            }

            // 1. Upload new file to Express (if present)
            if (req.file) {
                const fileBuffer = req.file?.buffer; // ✅ Get Buffer
                const originalname = req.file?.originalname;

                newMetaImage = await uploadFileToExpress(fileBuffer, originalname, name);
                
                // 🛑 Local temporary file cleanup code removed
                
                // 2. Delete OLD image from Express server
                const oldImageUrl = existingPage.metaImage;
                if (oldImageUrl) {
                    await deleteFileFromExpress(oldImageUrl);
                }

                metaImage = newMetaImage; // Update URL with the new one
            }

            const updatedPage = await pagesCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        name, slug, content, metaTitle, metaDescription, metaImage,
                        updatedAt: new Date(),
                    },
                }
            );

            if (updatedPage.matchedCount === 0) {
                // If matchedCount is 0 but we uploaded a file, clean it up
                if (newMetaImage) await deleteFileFromExpress(newMetaImage); 
                return res.status(404).json({ message: "Page not found" });
            }

            return res.status(200).json({ message: "Page updated", data: { id, metaImage } });

        } catch (error) {
            console.error('Error during PUT request:', error);
            if (newMetaImage) await deleteFileFromExpress(newMetaImage); // Clean up Express file
            // 🛑 Local file cleanup code removed

            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }


    // Handle DELETE request - Delete a page by slug
    if (req.method === 'DELETE') {
        try {
            const { slug } = req.query;

            if (!slug) {
                return res.status(400).json({ message: 'Slug is required' });
            }
            
            // 1. Find the document to get the image URL
            const pageToDelete = await pagesCollection.findOne({ slug });
            if (!pageToDelete) {
                return res.status(404).json({ message: 'Page not found' });
            }

            // 2. Delete the image from the Express server
            const imageUrl = pageToDelete.metaImage;
            if (imageUrl) {
                await deleteFileFromExpress(imageUrl);
            }

            // 3. Delete the document from MongoDB
            const result = await pagesCollection.deleteOne({ slug });

            if (result.deletedCount === 0) {
                // Should not happen if pageToDelete was found, but as a fallback
                return res.status(404).json({ message: 'Page not found after deletion attempt' });
            }

            return res.status(200).json({ message: 'Page deleted successfully' });
        } catch (error) {
            console.error('Error deleting page:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }

    // If the method is not allowed
    res.status(405).json({ message: "Method not allowed" });
}