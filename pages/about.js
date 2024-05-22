import React, { useState, useEffect, useCallback } from 'react';
import ClipLoader from 'react-spinners/ClipLoader'; // Importing the spinner

function About() {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/about');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    ); // Display spinner while loading
  }

  return (
    <div className='container p-5'>
      <div className='mt-10'>
        <h2>About Us Content</h2>
        {/* Apply CSS styles to ensure proper display of list and anchor tags */}
        <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
      </div>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
}

export default About;