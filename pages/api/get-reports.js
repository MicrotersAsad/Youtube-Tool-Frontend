// pages/api/reports.js
import { connectToDatabase } from '../../utils/mongodb';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests are allowed.' });
  }

  try {
    const { db } = await connectToDatabase();

    // Fetch all documents that have reports
    const content = await db.collection('content').find({
      'reactions.reports': { $exists: true, $ne: [] },
    }).toArray();

    // Extract reports from the content documents
    const reports = content.flatMap(item => 
      item.reactions.reports.map(report => ({
        toolName: item.category,
        reportText: report.reportText,
        fixed: report.fixed,
        reportId: report._id, // Assign an id to each report if needed for action
        reportedBy: report.reportedBy,
        reportedAt: report.reportedAt,
      }))
    );

    res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export default handler;
