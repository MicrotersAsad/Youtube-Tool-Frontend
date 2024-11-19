import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const cachePath = path.join(process.cwd(), '.next', 'cache'); // Path to .next/cache directory

    // Check if the cache directory exists
    if (fs.existsSync(cachePath)) {
      // Remove the directory recursively
      fs.rm(cachePath, { recursive: true, force: true }, (err) => {
        if (err) {
          console.error('Error clearing cache:', err);
          return res.status(500).json({ message: 'Failed to clear cache' });
        }
        return res.status(200).json({ message: 'Cache cleared successfully!' });
      });
    } else {
      return res.status(200).json({ message: 'No cache to clear!' });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
