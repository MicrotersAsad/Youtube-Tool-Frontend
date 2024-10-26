import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { sitemapXML } = req.body;

    if (!sitemapXML) {
      return res.status(400).json({ message: 'Sitemap XML is required.' });
    }

    try {
      const directoryPath = path.join(process.cwd(), 'public', 'sitemaps');
      const filePath = path.join(directoryPath, 'sitemap.xml');

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      fs.writeFileSync(filePath, sitemapXML, 'utf8');

      return res.status(200).json({ message: 'Sitemap saved successfully!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error saving the sitemap.' });
    }
  } else if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'public', 'sitemaps', 'sitemap.xml');

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Sitemap not found.' });
      }

      const sitemapXML = fs.readFileSync(filePath, 'utf8');

      return res.status(200).json({ sitemapXML });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error reading the sitemap.' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
