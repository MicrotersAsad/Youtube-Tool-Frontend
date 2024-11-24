// pages/api/reports.js
import { connectToDatabase } from '../../utils/mongodb';

const handler = async (req, res) => {
  const { method, query, body } = req;

  if (method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const content = await db.collection('content').find({
        'reactions.reports': { $exists: true, $ne: [] },
      }).toArray();

      const reports = content.flatMap((item) =>
        item.reactions.reports.map((report) => ({
          toolName: item.category,
          reportText: report.reportText,
          fixed: report.fixed,
          reportId: report._id, // Assign an id to each report if needed for action
          reportedBy: report.reportedBy,
          reportedAt: report.reportedAt,
        }))
      );

      return res.status(200).json({ reports });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  if (method === 'PATCH') {
    try {
      const { db } = await connectToDatabase();
      const { id } = query;

      await db.collection('content').updateOne(
        { 'reactions.reports._id': id },
        { $set: { 'reactions.reports.$.fixed': body.fixed } }
      );

      return res.status(200).json({ message: 'Report marked as fixed' });
    } catch (error) {
      console.error('Error updating report:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};

export default handler;



