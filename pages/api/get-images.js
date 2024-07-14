import { connectToDatabase } from "../../utils/mongodb";


export default async (req, res) => {
  const { db } = await connectToDatabase();

  try {
    const images = await db.collection('images').find().toArray();
    res.status(200).json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
};
