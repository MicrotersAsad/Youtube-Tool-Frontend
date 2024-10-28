// /pages/api/robots-txt.js (API Route)

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'robots.txt'); // Path to the root directory

  if (req.method === 'GET') {
    try {
      // Read the robots.txt file content
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
      res.status(200).json({ success: true, content });
    } catch (error) {
      console.error('Error reading robots.txt:', error);
      res.status(500).json({ success: false, message: 'Failed to read robots.txt' });
    }
  } else if (req.method === 'POST') {
    const { content } = req.body;

    try {
      // Write content to robots.txt file
      fs.writeFileSync(filePath, content, 'utf8');
      res.status(200).json({ success: true, message: 'robots.txt updated successfully' });
    } catch (error) {
      console.error('Error updating robots.txt:', error);
      res.status(500).json({ success: false, message: 'Failed to update robots.txt' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
