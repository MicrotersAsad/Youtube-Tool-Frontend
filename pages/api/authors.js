import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../utils/mongodb";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure Multer-S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${file.originalname}`;
      cb(null, `authors/${uniqueSuffix}`);
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
          if (err) {
            console.error("Error uploading file:", err);
            return res.status(500).json({ error: "Failed to upload image" });
          }

          try {
            const { name, bio, role, socialLinks } = req.body;
            const newAuthor = {
              name,
              bio,
              role,
              socialLinks: JSON.parse(socialLinks || "{}"),
              imageUrl: req.file ? req.file.location : null, // S3 URL
            };

            const result = await collection.insertOne(newAuthor);
            return res.status(201).json(result.ops[0]);
          } catch (dbError) {
            console.error("Database error:", dbError);
            return res.status(500).json({ error: "Failed to save author to database" });
          }
        });
        break;

      case "PUT":
        uploadMiddleware(req, res, async (err) => {
          if (err) {
            console.error("Error uploading file:", err);
            return res.status(500).json({ error: "Failed to upload image" });
          }

          const { id } = query;
          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid author ID" });
          }

          try {
            const { name, bio, role, socialLinks } = req.body;
            const updateFields = {
              name,
              bio,
              role,
              socialLinks: JSON.parse(socialLinks || "{}"),
            };

            if (req.file) {
              updateFields.imageUrl = req.file.location; // Update S3 URL if a new file is uploaded
            }

            const result = await collection.updateOne(
              { _id: new ObjectId(id) },
              { $set: updateFields }
            );

            if (result.matchedCount === 0) {
              return res.status(404).json({ error: "Author not found" });
            }

            return res.status(200).json({ success: true });
          } catch (dbError) {
            console.error("Database error:", dbError);
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
