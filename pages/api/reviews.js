import { connectToDatabase, ObjectId } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    // Fetch reviews
    const { tool } = req.query;
    try {
      const reviews = await db
        .collection('reviews')
        .find(tool ? { tool } : {})
        .sort({ _id: -1 })
        .toArray();
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  } else if (req.method === 'POST') {
    // Post a new review
    const { tool, rating, comment, userName, userProfile, title } = req.body;

    if (!tool || !rating || !comment || !userName || !userProfile || !title) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
      const newReview = {
        tool,
        rating,
        comment,
        userName,
        userProfile,
        title,
        createdAt: new Date(),
      };

      await db.collection('reviews').insertOne(newReview);
      res.status(201).json({ message: 'Review submitted successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to submit review' });
    }
  } else if (req.method === 'DELETE') {
    // Delete a review
    const { id } = req.query;

    try {
      await db.collection('reviews').deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ message: 'Review deleted successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete review' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
