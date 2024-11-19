import { connectToDatabase } from "../../utils/mongodb";

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase(); // Connect to MongoDB
    const collection = db.collection("firebaseConfig");

    if (req.method === "GET") {
      // Fetch configuration from MongoDB
      const config = await collection.findOne({ id: "firebaseConfig" });
      if (config) {
        return res.status(200).json(config.data);
      } else {
        return res.status(404).json({ message: "No Firebase configuration found." });
      }
    } else if (req.method === "POST") {
      const firebaseConfig = req.body;

      // Validate required fields
      const requiredFields = [
        "apiKey",
        "authDomain",
        "projectId",
        "storageBucket",
        "messagingSenderId",
        "appId",
        "measurementId",
      ];

      for (const field of requiredFields) {
        if (!firebaseConfig[field]) {
          return res.status(400).json({ message: `Missing field: ${field}` });
        }
      }

      // Save or update Firebase config
      const result = await collection.updateOne(
        { id: "firebaseConfig" }, // Look for the document with id "firebaseConfig"
        { $set: { data: firebaseConfig } }, // Update or set the data field
        { upsert: true } // Insert if it doesn't exist
      );

      return res.status(200).json({
        message: result.upsertedCount
          ? "Firebase configuration saved successfully."
          : "Firebase configuration updated successfully.",
      });
    } else {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error handling Firebase configuration:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
