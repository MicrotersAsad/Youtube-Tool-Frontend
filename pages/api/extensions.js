// import { connectToDatabase } from "../../utils/mongodb";
// import { ObjectId } from "mongodb";

// export default async function handler(req, res) {
//   const { method } = req;
//   const { db } = await connectToDatabase();
//   const extensionsCollection = db.collection("extensions");

//   if (method === "GET") {
//     try {
//       const extensions = await extensionsCollection.find({}).toArray();
//       res.status(200).json({ success: true, data: extensions });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Error fetching extensions" });
//     }
//   } else if (method === "POST") {
//     const { name, key, status, config } = req.body;

//     if (!name || !key || !status) {
//       return res.status(400).json({ success: false, message: "Name, key, and status are required" });
//     }

//     try {
//       // Check if the extension already exists
//       const existingExtension = await extensionsCollection.findOne({ key });
//       if (existingExtension) {
//         return res.status(409).json({ success: false, message: "Extension already exists" });
//       }

//       // Add new extension
//       const newExtension = {
//         name,
//         key,
//         status,
//         config: config || {},
//       };

//       const result = await extensionsCollection.insertOne(newExtension);
//       res.status(201).json({ success: true, data: { _id: result.insertedId, ...newExtension } });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Error adding extension" });
//     }
//   } else if (method === "PUT") {
//     const { id, status, config } = req.body;

//     if (!id) {
//       return res.status(400).json({ success: false, message: "Extension ID is required" });
//     }

//     try {
//       const updateFields = {};
//       if (status) updateFields.status = status;
//       if (config) updateFields.config = config;

//       const updatedExtension = await extensionsCollection.findOneAndUpdate(
//         { _id: new ObjectId(id) },
//         { $set: updateFields },
//         { returnDocument: "after" }
//       );

//       if (!updatedExtension.value) {
//         return res.status(404).json({ success: false, message: "Extension not found" });
//       }

//       res.status(200).json({ success: true, data: updatedExtension.value });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Error updating extension" });
//     }
//   } else {
//     res.setHeader("Allow", ["GET", "POST", "PUT"]);
//     res.status(405).end(`Method ${method} Not Allowed`);
//   }
// }



import { connectToDatabase } from "../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { method } = req;
  const { db } = await connectToDatabase();
  const extensionsCollection = db.collection("extensions");

  if (method === "GET") {
    try {
      const extensions = await extensionsCollection.find({}).toArray();
      res.status(200).json({ success: true, data: extensions });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching extensions" });
    }
  } else if (method === "POST") {
    const { name, key, status, config } = req.body;

    if (!name || !key || !status) {
      return res.status(400).json({ success: false, message: "Name, key, and status are required" });
    }

    try {
      const existingExtension = await extensionsCollection.findOne({ key });
      if (existingExtension) {
        return res.status(409).json({ success: false, message: "Extension already exists" });
      }

      const newExtension = { name, key, status, config: config || {} };
      const result = await extensionsCollection.insertOne(newExtension);
      res.status(201).json({ success: true, data: { _id: result.insertedId, ...newExtension } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error adding extension" });
    }
  } else if (method === "PUT") {
    const { id, status, config } = req.body;
  
    if (!id) {
      return res.status(400).json({ success: false, message: "Extension ID is required" });
    }
  
    try {
      const updateFields = {};
      if (status) updateFields.status = status;
      if (config) updateFields.config = config;
  
      const result = await extensionsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Extension not found" });
      }
  
      const updatedExtension = await extensionsCollection.findOne({ _id: new ObjectId(id) });
  
      res.status(200).json({ success: true, data: updatedExtension });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error updating extension" });
    }
  }
   else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
