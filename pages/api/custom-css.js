import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'styles', 'globals.css');

  if (req.method === 'GET') {
    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return res.status(200).json({ content: fileContent });
      } else {
        return res.status(404).json({ message: 'globals.css file not found.' });
      }
    } catch (error) {
      console.error('Error reading globals.css file:', error);
      return res.status(500).json({ message: 'Failed to read globals.css file.' });
    }
  } else if (req.method === 'POST') {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'No content provided.' });
    }

    try {
      // Write the updated content to globals.css
      fs.writeFileSync(filePath, content, 'utf8');
      return res.status(200).json({ message: 'globals.css updated successfully!' });
    } catch (error) {
      console.error('Error updating globals.css file:', error);
      return res.status(500).json({ message: 'Failed to update globals.css file.' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
