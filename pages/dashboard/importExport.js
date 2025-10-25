import { useState } from 'react';
import Layout from './layout';

export default function Home() {
  const [collectionName, setCollectionName] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  // Removed: const [language, setLanguage] = useState('');
  const [exportFormat, setExportFormat] = useState('json');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage('Error: Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('collectionName', collectionName);
    formData.append('file', file);
    // Removed: formData.append('language', language); 

    try {
      const response = await fetch('/api/upload-content', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.message}`);
      } else {
        const data = await response.json();
        setMessage(data.message);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleExport = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/export-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          collectionName,
          format: exportFormat 
        }),
      });
      console.log(response);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const fileExtension = exportFormat === 'mysql' ? 'sql' : 'json';
        a.download = `${collectionName}.${fileExtension}`;
        
        a.click();
        window.URL.revokeObjectURL(url);
        setMessage(`Successfully exported ${collectionName} in ${exportFormat.toUpperCase()} format`);
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Upload and Export Content</h1>
          <form onSubmit={handleImport} className="mb-4">
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">Import Content</h2>
            <div className="mb-4">
              <label htmlFor="collectionName" className="block text-gray-700 font-bold mb-2">Collection Name</label>
              <select
                id="collectionName"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a collection</option>
                <option value="about">About</option>
                <option value="blogs">Blogs</option>
                <option value="notice">Notice</option>
                <option value="test">Test</option>
                <option value="images">Images</option>
                <option value="content">Content</option>
                <option value="terms">Terms</option>
                <option value="privacy">Privacy</option>
                <option value="reviews">Reviews</option>
                <option value="comments">Comments</option>
                <option value="users">User</option>
                <option value="ytApi">Youtube Api</option>
                <option value="openaiKey">Openai Key</option>
                <option value="youtube">Youtube</option>
              </select>
            </div>
            {/* Removed Language Selection Block:
            <div className="mb-4">...</div>
            */}
            <div className="mb-4">
              <label htmlFor="file" className="block text-gray-700 font-bold mb-2">Upload JSON File</label>
              <input
                type="file"
                id="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Upload Content</button>
          </form>
          
          <form onSubmit={handleExport}>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">Export Content</h2>
            <div className="mb-4">
              <label htmlFor="collectionNameExport" className="block text-gray-700 font-bold mb-2">Collection Name</label>
              <select
                id="collectionNameExport"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select a collection</option>
                <option value="about">About</option>
                <option value="blogs">Blogs</option>
                <option value="notice">Notice</option>
                <option value="content">Content</option>
                <option value="images">Images</option>
                <option value="terms">Terms</option>
                <option value="privacy">Privacy</option>
                <option value="reviews">Reviews</option>
                <option value="comments">Comments</option>
                <option value="users">User</option>
                <option value="ytApi">Youtube Api</option>
                <option value="openaiKey">Openai Key</option>
                <option value="test">Test</option>
                <option value="youtube">Youtube</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="exportFormat" className="block text-gray-700 font-bold mb-2">Export Format</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="form-radio text-green-500 h-5 w-5"
                  />
                  <span className="ml-2">JSON</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="mysql"
                    checked={exportFormat === 'mysql'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="form-radio text-green-500 h-5 w-5"
                  />
                  <span className="ml-2">MySQL</span>
                </label>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">Export Content</button>
          </form>
          {message && <p className={`mt-4 ${message.startsWith('Error:') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </div>
      </div>
    </Layout>
  );
}