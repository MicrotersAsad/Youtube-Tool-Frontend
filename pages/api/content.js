import { connectToDatabase } from '../../utils/mongodb';
import uploadMiddleware from '../../middleware/uploadMiddleware';

export const config = {
  api: {
    bodyParser: true, // Disallow body parsing, let multer handle it
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
    case 'PUT':
      await handlePut(req, res);
      break;
    case 'PATCH':
      await handlePatch(req, res); // Use PATCH for reaction updates
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

const handleGet = async (req, res) => {
  const { category, language } = req.query;

  if (!category || !language) {
    return res.status(400).json({ message: 'Category and language are required' });
  }

  const { db } = await connectToDatabase();
  const result = await db.collection('content').findOne({ category, [`translations.${language}`]: { $exists: true } });

  if (!result) {
    return res.status(404).json({ message: 'Content not found' });
  }

  res.status(200).json(result);
};

const handlePost = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }

    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const image = req.file;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = image ? `/uploads/${image.filename}` : null;

    const translation = {
      content,
      title,
      description,
      image: imageUrl,
      faqs,
      relatedTools,
      reactions: { likes: 0, unlikes: 0, reports: [], users: {} }, // Initialize reactions and users
    };

    const { db } = await connectToDatabase();
    const filter = { category };
    const updateDoc = {
      $set: {
        [`translations.${language}`]: translation,
      },
    };
    const options = { upsert: true };
    const result = await db.collection('content').updateOne(filter, updateDoc, options);

    if (!result.matchedCount && !result.upsertedCount) {
      return res.status(500).json({ message: 'Failed to insert or update document' });
    }

    res.status(201).json({ message: 'Document inserted/updated successfully' });
  });
};

const handlePut = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }

    const { category, language } = req.query;
    const { content, title, description } = req.body;
    const image = req.file;
    const faqs = req.body.faqs ? JSON.parse(req.body.faqs) : [];
    const relatedTools = req.body.relatedTools ? JSON.parse(req.body.relatedTools) : [];

    if (!category || !content || !title || !description || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrl = image ? `/uploads/${image.filename}` : undefined;

    const translation = {
      content,
      title,
      description,
      ...(imageUrl && { image: imageUrl }),
      faqs,
      relatedTools,
    };

    const { db } = await connectToDatabase();
    const filter = { category };
    const updateDoc = {
      $set: {
        [`translations.${language}`]: translation,
      },
    };
    const options = { upsert: true };
    const result = await db.collection('content').updateOne(filter, updateDoc, options);

    if (!result.matchedCount && !result.upsertedCount) {
      return res.status(500).json({ message: 'Failed to update document' });
    }

    res.status(200).json({ message: 'Document updated successfully' });
  });
};

// Handle PATCH requests for reactions (like, unlike, report)
// Handle PATCH requests for reactions (like, unlike, report)

const handlePatch = async (req, res) => {
  try {
    const { category, userId, action, reportText } = req.body;

    if (!category || !userId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const { db } = await connectToDatabase();
    const filter = { category };

    const content = await db.collection('content').findOne(filter);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const userAction = content.reactions?.users?.[userId];
    let updateDoc = {};

    switch (action) {
      case 'like':
        if (userAction === 'like') {
          return res.status(400).json({ message: 'User has already liked' });
        } else if (userAction === 'unlike') {
          // User had disliked before, now liking and removing dislike
          updateDoc = {
            $inc: { 'reactions.likes': 1, 'reactions.unlikes': -1 },
            $set: { [`reactions.users.${userId}`]: 'like' },
          };
        } else {
          // User is liking for the first time
          updateDoc = {
            $inc: { 'reactions.likes': 1 },
            $set: { [`reactions.users.${userId}`]: 'like' },
          };
        }
        break;
      case 'unlike':
        if (userAction === 'unlike') {
          // If the user had disliked before, remove dislike
          updateDoc = {
            $inc: { 'reactions.unlikes': -1 },
            $unset: { [`reactions.users.${userId}`]: "" },
          };
        } else if (userAction === 'like') {
          // User had liked before, now disliking and removing like
          updateDoc = {
            $inc: { 'reactions.unlikes': 1, 'reactions.likes': -1 },
            $set: { [`reactions.users.${userId}`]: 'unlike' },
          };
        } else {
          // User is disliking for the first time
          updateDoc = {
            $inc: { 'reactions.unlikes': 1 },
            $set: { [`reactions.users.${userId}`]: 'unlike' },
          };
        }
        break;
      case 'report':
        // Check if the user has already reported this content
        const existingReport = content.reactions?.reports?.find(report => report.reportedBy === userId);
        if (existingReport) {
          return res.status(400).json({ message: 'User has already reported this content.' });
        }

        if (!reportText) {
          return res.status(400).json({ message: 'Report text is required.' });
        }

        // Add a new report to the reports array
        updateDoc = {
          $push: {
            'reactions.reports': {
              reportText,
              reportedBy: userId,
              reportedAt: new Date(),
              fixed: false, // Initially, the issue is not fixed
            },
          },
        };

        // Mark that this user has reported in the users field
        updateDoc.$set = { ...updateDoc.$set, [`reactions.users.${userId}`]: 'report' };
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await db.collection('content').updateOne(filter, updateDoc);

    if (!result.matchedCount && !result.modifiedCount) {
      return res.status(500).json({ message: 'Failed to update reaction' });
    }

    const updatedContent = await db.collection('content').findOne(filter);
    const { reactions } = updatedContent;

    res.status(200).json({ reactions });
  } catch (error) {
    console.error("Error in handlePatch:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



export default handler;