import { connectToDatabase } from '../../utils/mongodb';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import FormData from 'form-data'; // ✅ Express এ ডেটা পাঠানোর জন্য
import fetch from 'node-fetch'; // ✅ Express এ HTTP রিকোয়েস্ট পাঠানোর জন্য
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

// ❌ AWS S3/multer-s3 সম্পর্কিত ইম্পোর্ট এবং কনফিগারেশন বাদ দেওয়া হয়েছে

// 🛑 Express সার্ভারের বেস URL (আপলোড/ডিলিট এর জন্য)
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

export const config = {
    api: {
        bodyParser: false, // Disable default body parser to handle file uploads
    },
};

// Multer Configuration for Temporary Storage (Express-এ পাঠানোর আগে লোকালি সেভ করার জন্য)
const upload = multer({
    storage: multer.diskStorage({
        destination: './tmp/uploads', // টেম্প ফোল্ডার
        filename: (req, file, cb) => {
            cb(null, file.originalname); // Express সার্ভার ইউনিক নাম তৈরি করবে
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5MB
    // Note: File filter validation should be done here if needed.
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

// Express সার্ভারে ফাইল আপলোড করে URL নিয়ে আসে
const uploadFileToExpress = async (filePath, originalname) => {
    const fileData = fs.readFileSync(filePath);
    const form = new FormData();
    
    // Express সার্ভারের Multer ফিল্ডের নাম 'file' হতে হবে (আগের কনফিগারেশন অনুযায়ী)
    form.append('file', fileData, originalname); 
    form.append('title', originalname); // ফাইল নেম টাইটেল হিসেবে পাঠানো হলো

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
// ## Main Handler
// -----------------------------------------------------------------

export default async function handler(req, res) {
    let filePath, newImageUrl, existingUser;

    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
    }

    try {
        // 1. Multer দিয়ে ফাইলটি টেম্পোরারিলি সেভ করুন
        await runMiddleware(req, res, upload.single('profileImage'));

        // 2. JWT token ভেরিফিকেশন (অপরিবর্তিত)
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET);
        if (!decodedToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { db } = await connectToDatabase();
        const { userId, username, role, email } = req.body;
        
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
        
        // Find existing user to get old image URL
        existingUser = await db.collection('user').findOne({ _id: new ObjectId(userId) });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const updateData = {
            username, role, email,
            updatedAt: new Date(),
        };

        // 3. ফাইল আপলোড লজিক (S3 থেকে Express এ পরিবর্তিত)
        if (req.file) {
            // A. Express এ নতুন ফাইল আপলোড
            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname);
            
            // B. টেম্পোরারি ফাইল ডিলিট
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            
            // C. পুরানো ইমেজ ডিলিট
            const oldImageUrl = existingUser.profileImage;
            if (oldImageUrl) {
                await deleteFileFromExpress(oldImageUrl);
            }

            updateData.profileImage = newImageUrl; // Store the new image URL
        }

        // 4. MongoDB আপডেট
        const updatedUser = await db.collection('user').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        if (!updatedUser.matchedCount) {
            // যদি MongoDB তে আপডেট ব্যর্থ হয় কিন্তু Express এ আপলোড সফল হয়, তাহলে ফাইল ডিলিট করুন
            if (newImageUrl) {
                 await deleteFileFromExpress(newImageUrl);
            }
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 5. সাফল্য রেসপন্স
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            imageUrl: updateData.profileImage || existingUser.profileImage, // Return the final image URL
        });
    } catch (error) {
        console.error('Error updating user:', error.message);
        
        // General cleanup if any error occurred mid-process
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (newImageUrl) {
            await deleteFileFromExpress(newImageUrl);
        }
        
        res.status(500).json({ success: false, message: error.message });
    }
}