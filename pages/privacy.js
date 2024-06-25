/* eslint-disable react/no-unescaped-entities */
import React, { useCallback, useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';

const Privacy = () => {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // State to track loading
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/privacy');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        console.log("Fetched Data:", data); // Add debugging
        setQuillContent(data?.content || ''); // Ensure content is not undefined
        setExistingContent(data?.content || ''); // Ensure existing content is not undefined
        setLoading(false); // Set loading to false after fetching data
      } catch (error) {
        console.error('Error fetching content:', error.message);
        setError(error.message);
        setLoading(false); // Set loading to false in case of an error
      }
    };

    fetchContent();
  }, []);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="content pt-6 pb-5">
        {error && <div className="text-red-500">Error: {error}</div>}
        <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
      </div>
    </div>
  );
};

export default Privacy;
