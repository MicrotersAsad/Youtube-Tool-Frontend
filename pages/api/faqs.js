import { connectToDatabase } from '../../utils/mongodb';

export const config = {
  api: {
    bodyParser: true, // Enable body parsing
  },
};

const handler = async (req, res) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      await handleGet(req, res);
      break;
    case 'POST':
      await handlePost(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

const handleGet = async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ message: 'Category is required' });
  }

  const { db } = await connectToDatabase();
  const result = await db.collection('faqs').findOne({ category });

  res.status(200).json(result ? result.faqs : []);
};

const handlePost = async (req, res) => {
  const { category } = req.query;
  const newFaqs = req.body;

  if (!category || !Array.isArray(newFaqs)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const { db } = await connectToDatabase();
  
  // Fetch existing FAQs
  const existingFaqsDoc = await db.collection('faqs').findOne({ category });
  let existingFaqs = existingFaqsDoc ? existingFaqsDoc.faqs : [];

  // Update existing FAQs or add new ones
  newFaqs.forEach(newFaq => {
    const index = existingFaqs.findIndex(faq => faq.id === newFaq.id);
    if (index > -1) {
      // Update existing FAQ
      existingFaqs[index] = newFaq;
    } else {
      // Add new FAQ
      existingFaqs.push(newFaq);
    }
  });

  const result = await db.collection('faqs').updateOne(
    { category },
    { $set: { faqs: existingFaqs } },
    { upsert: true }
  );

  if (!result.matchedCount && !result.upsertedCount) {
    return res.status(500).json({ message: 'Failed to update FAQs' });
  }

  res.status(200).json({ message: 'FAQs updated successfully' });
};

export default handler;
