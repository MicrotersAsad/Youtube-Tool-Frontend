import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { method } = req;

  // Connect to the database
  const { db } = await connectToDatabase();

  if (req.method === 'POST') {
    try {
        console.log("Request Body: ", req.body);  // Check if the content is being received properly
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required.' });
        }

        // Insert into MongoDB collection
        const result = await db.collection('heading').insertOne({ content });
        console.log("MongoDB Insert Result: ", result); // Log MongoDB insert result
        
        return res.status(201).json({ message: 'Header saved successfully!' });
    } catch (error) {
        console.error('Error saving header:', error);
        return res.status(500).json({ message: 'Error saving header', error });
    }
}
 else if (method === 'GET') {
    try {
      // Fetch all heading data from the 'heading' collection
      const headings = await db.collection('heading').find().toArray();

      return res.status(200).json(headings);
    } catch (error) {
      console.error('Error fetching headings:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}
