import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../utils/mongodb";
import multer from "multer";
import FormData from "form-data"; // ✅ Express এ ডেটা পাঠানোর জন্য
import fetch from "node-fetch"; // ✅ Express এ HTTP রিকোয়েস্ট পাঠানোর জন্য
import path from "path";
import fs from "fs";

// ❌ AWS S3/multer-s3 সম্পর্কিত ইম্পোর্ট এবং কনফিগারেশন বাদ দেওয়া হয়েছে

// 🛑 Express সার্ভারের বেস URL
const EXPRESS_BASE_URL = 'https://img.ytubetools.com';

// Multer Configuration for Temporary Storage (Express-এ পাঠানোর আগে লোকালি সেভ করার জন্য)
const upload = multer({
    storage: multer.diskStorage({
        destination: './tmp/uploads', // টেম্প ফোল্ডার
        filename: (req, file, cb) => {
            cb(null, file.originalname); 
        },
    }),
});

// Middleware to handle file uploads
export const config = {
    api: {
        bodyParser: false, // Disable body parser for file uploads
    },
};

const uploadMiddleware = upload.single("image");

// -----------------------------------------------------------------
// ## Express Service Functions
// -----------------------------------------------------------------

// Express সার্ভারে ফাইল আপলোড করে URL নিয়ে আসে
const uploadFileToExpress = async (filePath, originalname, title) => {
    const fileData = fs.readFileSync(filePath);
    const form = new FormData();
    
    // Express সার্ভারের Multer ফিল্ডের নাম 'file' হতে হবে (আগের কনফিগারেশন অনুযায়ী)
    form.append('file', fileData, originalname); 
    form.append('title', title || originalname); // লেখকের নাম টাইটেল হিসেবে পাঠানো যেতে পারে

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
    // URL থেকে ফাইলের নাম বের করে
    const fileToDelete = path.basename(imageUrl);
    const deleteUrl = `${EXPRESS_BASE_URL}/delete-image/${fileToDelete}`;

    const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
    });

    if (deleteResponse.status !== 200) {
        console.warn(`Express server file deletion failed for ${fileToDelete}. Status: ${deleteResponse.status}`);
        // Express এ ডিলিট ব্যর্থ হলেও আমরা MongoDB ডিলিট চালিয়ে যাব
    }
};

// -----------------------------------------------------------------
// ## Handler
// -----------------------------------------------------------------

export default async function handler(req, res) {
    const { method, query } = req;

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("authors");

        switch (method) {
            case "GET":
                try {
                    const authors = await collection.find({}).toArray();
                    return res.status(200).json(authors);
                } catch (error) {
                    console.error("Failed to fetch authors:", error);
                    return res.status(500).json({ error: "Failed to fetch authors" });
                }

            case "POST":
                uploadMiddleware(req, res, async (err) => {
                    let filePath, newImageUrl;

                    if (err) {
                        console.error("Error uploading file:", err);
                        return res.status(500).json({ error: "Failed to upload image" });
                    }
                    
                    try {
                        const { name, bio, role, socialLinks } = req.body;
                        
                        // 1. Express-এ ইমেজ আপলোড
                        if (req.file) {
                            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
                            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, name);
                        }

                        // 2. টেম্পোরারি ফাইল ডিলিট
                        if (filePath && fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }

                        const newAuthor = {
                            name,
                            bio,
                            role,
                            socialLinks: JSON.parse(socialLinks || "{}"),
                            imageUrl: newImageUrl, // Express URL
                        };

                        const result = await collection.insertOne(newAuthor);
                        // Using result.insertedId to get the ID for the response object
                        return res.status(201).json({ _id: result.insertedId, ...newAuthor });
                        
                    } catch (dbError) {
                        console.error("Database error:", dbError);
                        // Clean up Express file if DB insertion fails
                        if (newImageUrl) {
                            await deleteFileFromExpress(newImageUrl);
                        }
                        // Clean up temporary file
                        if (filePath && fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        return res.status(500).json({ error: "Failed to save author to database" });
                    }
                });
                break;

            case "PUT":
                uploadMiddleware(req, res, async (err) => {
                    let filePath, newImageUrl;

                    if (err) {
                        console.error("Error uploading file:", err);
                        return res.status(500).json({ error: "Failed to upload image" });
                    }

                    const { id } = query;
                    if (!ObjectId.isValid(id)) {
                        return res.status(400).json({ error: "Invalid author ID" });
                    }

                    try {
                        const existingAuthor = await collection.findOne({ _id: new ObjectId(id) });
                        if (!existingAuthor) {
                            return res.status(404).json({ error: "Author not found" });
                        }

                        const { name, bio, role, socialLinks } = req.body;
                        const updateFields = {
                            name, bio, role, socialLinks: JSON.parse(socialLinks || "{}"),
                        };

                        if (req.file) {
                            // 1. Express-এ নতুন ইমেজ আপলোড
                            filePath = path.join(process.cwd(), 'tmp/uploads', req.file.filename);
                            newImageUrl = await uploadFileToExpress(filePath, req.file.originalname, name);
                            
                            // 2. টেম্পোরারি ফাইল ডিলিট
                            if (filePath && fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                            
                            // 3. পুরানো ইমেজ ডিলিট
                            if (existingAuthor.imageUrl) {
                                await deleteFileFromExpress(existingAuthor.imageUrl);
                            }

                            updateFields.imageUrl = newImageUrl; // Update URL
                        }

                        const result = await collection.updateOne(
                            { _id: new ObjectId(id) },
                            { $set: updateFields }
                        );

                        if (result.matchedCount === 0) {
                            return res.status(404).json({ error: "Author not found" });
                        }

                        return res.status(200).json({ success: true, newImageUrl: newImageUrl || existingAuthor.imageUrl });
                    } catch (dbError) {
                        console.error("Database error:", dbError);
                        // Clean up Express file if DB update fails
                        if (newImageUrl) {
                             await deleteFileFromExpress(newImageUrl);
                        }
                        return res.status(500).json({ error: "Failed to update author in database" });
                    }
                });
                break;

            case "DELETE":
                const { id } = query;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid author ID" });
                }

                try {
                    const existingAuthor = await collection.findOne({ _id: new ObjectId(id) });
                    if (!existingAuthor) {
                        return res.status(404).json({ error: "Author not found" });
                    }

                    // 1. Express থেকে ইমেজ ডিলিট
                    if (existingAuthor.imageUrl) {
                        await deleteFileFromExpress(existingAuthor.imageUrl);
                    }

                    // 2. MongoDB থেকে ডকুমেন্ট ডিলিট
                    const result = await collection.deleteOne({ _id: new ObjectId(id) });

                    if (result.deletedCount === 0) {
                        return res.status(404).json({ error: "Author not found" });
                    }

                    return res.status(204).end();
                } catch (dbError) {
                    console.error("Database error:", dbError);
                    return res.status(500).json({ error: "Failed to delete author from database" });
                }

            default:
                res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
                return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (error) {
        console.error("Error handling request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}