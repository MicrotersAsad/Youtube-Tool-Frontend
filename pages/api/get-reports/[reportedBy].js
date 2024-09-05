import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req, res) {
  const { method } = req;
  const { reportedBy } = req.query; // Use reportedBy as identifier

  if (!reportedBy) {
    return res.status(400).json({ message: 'ReportedBy is required' });
  }

  switch (method) {
    case 'PATCH':
      try {
        const { db } = await connectToDatabase();
        const { fixed } = req.body;

        // Update the report based on the reportedBy field inside the content's reactions.reports
        const result = await db.collection('content').updateOne(
          { 'reactions.reports.reportedBy': reportedBy },
          { $set: { 'reactions.reports.$.fixed': fixed } }
        );

        if (!result.matchedCount) {
          return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json({ message: 'Report marked as fixed' });
      } catch (error) {
        res.status(500).json({ message: 'Error updating report', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['PATCH']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
