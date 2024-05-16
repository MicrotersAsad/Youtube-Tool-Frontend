import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';

const EditorWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function About() {
  const [content, setContent] = useState({});
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/about');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(data?.content || {}); // Ensure content is not undefined
        setExistingContent(data?.content || ''); // Ensure existing content is not undefined
      } catch (error) {
        console.error('Error fetching content:', error.message);
        setError(error.message);
      }
    };

    fetchContent();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }

      // Handle success
      console.log('Content posted successfully');
      setError(null);
      setExistingContent(content); // Update the displayed existing content
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  };

  return (
    <Layout>
      <div className='container p-5'>
        <h2>Content Add For About Us Page</h2>
        {error && <div className="text-red-500">Error: {error}</div>}
        <EditorWrapper data={content} onChange={setContent} />
        <button className='btn btn-primary p-2 mt-3' onClick={handleSubmit}>Submit Content</button>
        
        <div className='mt-10'>
          <h2>About Us Content</h2>
          <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default About;
