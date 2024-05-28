import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    const { db } = await connectToDatabase();
    const searchResults = await db
      .collection('yourCollectionName')
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          // Add more fields to search if needed
        ],
      })
      .toArray();

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error fetching search results:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
