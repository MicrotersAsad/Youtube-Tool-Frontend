import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'lib', 'firebase.js');

  if (req.method === 'GET') {
    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Read the file content
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Extract the firebaseConfig object from the file
        const firebaseConfigMatch = fileContent.match(/const firebaseConfig = ({[\s\S]*?});/);
        if (firebaseConfigMatch) {
          const firebaseConfig = eval('(' + firebaseConfigMatch[1] + ')');
          return res.status(200).json(firebaseConfig);
        }
      }

      // If the file doesn't exist
      return res.status(404).json({ message: 'Firebase configuration file not found.' });
    } catch (error) {
      console.error('Error reading firebase.js file:', error);
      return res.status(500).json({ message: 'Failed to read Firebase configuration file.' });
    }
  } else if (req.method === 'POST') {
    const firebaseConfig = req.body;

    // Validate required fields
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
      'measurementId',
    ];

    for (const field of requiredFields) {
      if (!firebaseConfig[field]) {
        return res.status(400).json({ message: `Missing field: ${field}` });
      }
    }

    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // File exists, update the content
        const existingContent = fs.readFileSync(filePath, 'utf8');

        // Extract the existing firebaseConfig object
        const firebaseConfigMatch = existingContent.match(/const firebaseConfig = ({[\s\S]*?});/);
        if (firebaseConfigMatch) {
          const existingConfig = eval('(' + firebaseConfigMatch[1] + ')');

          // Merge existing config with the new config
          const updatedConfig = { ...existingConfig, ...firebaseConfig };

          // Generate updated file content
          const updatedFileContent = `
// lib/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = ${JSON.stringify(updatedConfig, null, 2)};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };
          `;

          fs.writeFileSync(filePath, updatedFileContent, 'utf8');
          return res.status(200).json({ message: 'File updated' });
        }
      } else {
        // If file doesn't exist, return an error (no new file creation)
        return res.status(404).json({ message: 'File not found. Cannot update.' });
      }
    } catch (error) {
      console.error('Error updating firebase.js:', error);
      return res.status(500).json({ message: 'Failed to update firebase.js file.' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
