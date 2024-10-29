import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { componentName, shortcode } = req.body;
      if (!componentName || !shortcode) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const { db } = await connectToDatabase();
      
      // চেক করা যদি টুলের জন্য একটি শর্টকোড ইতিমধ্যে এড করা থাকে
      const existingShortcode = await db.collection('shortcodes-tools').findOne({ componentName });
      if (existingShortcode) {
        return res.status(400).json({ message: 'Shortcode already added for this tool' });
      }

      const result = await db.collection('shortcodes-tools').insertOne({
        componentName,
        shortcode,
      });

      res.status(201).json(result.ops[0]);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const shortcodes = await db.collection('shortcodes-tools').find({}).toArray();

      res.status(200).json(shortcodes);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}
