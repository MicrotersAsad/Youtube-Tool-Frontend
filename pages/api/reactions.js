import { connectToDatabase } from '../../utils/mongodb';

export const config = {
  api: {
    bodyParser: true, // Allow body parsing for reactions
  },
};

const handler = async (req, res) => {
  const { method } = req;

  switch (method) {
    case 'PATCH':
      await handlePatch(req, res); // Use PATCH for reaction updates
      break;
    default:
      res.setHeader('Allow', ['PATCH']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

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
