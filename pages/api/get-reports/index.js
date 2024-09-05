import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { db } = await connectToDatabase();

        // Fetch all reports from the content collection
        const content = await db.collection('content').find().toArray();

        // Extract reports from all content documents
        const reports = content.flatMap(item =>
          item.reactions?.reports?.map(report => ({
            toolName: item.category,
            reportText: report.reportText,
            fixed: report.fixed,
            reportedBy: report.reportedBy,
            reportedAt: report.reportedAt,
          })) || []
        );

        res.status(200).json({ reports });
      } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
