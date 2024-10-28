import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'sitemap_index.xml');
  const publicPath = path.join(process.cwd(), 'public', 'sitemap_index.xml');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).json({ success: true, content }); // Send JSON with content
      } else {
        res.status(404).json({ success: false, message: 'File not found' });
      }
    } catch (error) {
      console.error('Error reading sitemap_index.xml:', error);
      res.status(500).json({ success: false, message: 'Failed to read sitemap_index.xml' });
    }
  } else if (req.method === 'POST') {
    const { content } = req.body;

    try {
      // Write content to sitemap_index.xml file in the root directory
      fs.writeFileSync(filePath, content, 'utf8');

      // Copy the file to the public directory to serve statically
      fs.copyFileSync(filePath, publicPath);

      res.status(200).json({ success: true, message: 'sitemap_index.xml updated successfully' });
    } catch (error) {
      console.error('Error updating sitemap_index.xml:', error);
      res.status(500).json({ success: false, message: 'Failed to update sitemap_index.xml' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
