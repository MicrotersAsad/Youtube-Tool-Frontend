import React, { useState, useEffect } from 'react';
import Layout from './layout';
import CodeMirror from '@uiw/react-codemirror'; // Correct import
import { css } from '@codemirror/lang-css';

const CustomCssEditor = () => {
  const [cssContent, setCssContent] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing CSS content when the component loads
  useEffect(() => {
    const fetchCssContent = async () => {
      try {
        const response = await fetch('/api/custom-css');
        if (response.ok) {
          const data = await response.json();
          setCssContent(data.content);
        } else {
          setStatus('Failed to load CSS file.');
        }
      } catch (error) {
        console.error('Error fetching CSS content:', error);
        setStatus('An error occurred while loading CSS file.');
      }
    };

    fetchCssContent();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/custom-css', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cssContent }),
      });

      if (response.ok) {
        setStatus('globals.css updated successfully!');
      } else {
        setStatus('Failed to update globals.css.');
      }
    } catch (error) {
      console.error('Error updating CSS:', error);
      setStatus('An error occurred while updating globals.css.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
   <div className="">
  <div className="w-full max-w-7xl h-auto bg-white shadow-lg rounded-lg p-4">
    <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Write Custom CSS</h1>
    <p className="text-sm text-gray-500 text-center mb-6">
      Edit the global CSS below. Changes will directly affect the site’s styling.
    </p>
    {status && (
      <div
        className={`text-center text-sm font-medium mb-4 ${
          status.includes('successfully') ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {status}
      </div>
    )}
    <CodeMirror
      value={cssContent}
      extensions={[css()]}
      height="600px" // Increased editor height
      theme="dark"
      onChange={(value) => setCssContent(value)}
      className="border border-gray-300 rounded-lg shadow-sm focus:outline-none"
    />
    <button
      onClick={handleSave}
      disabled={loading}
      className={`w-full mt-4 py-3 rounded-lg text-white font-semibold ${
        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {loading ? 'Saving...' : 'Save Changes'}
    </button>
  </div>
</div>

    </Layout>
  );
};

export default CustomCssEditor;
