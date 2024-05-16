/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';

const About = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/about');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        console.log("Content data:", data); // Check the fetched data

        // Check if data contains content
        if (data && data.content) {
          // Sanitize the content allowing certain tags
          const sanitizedContent = sanitizeHtml(data.content, {
            allowedTags: ['h1', 'h2', 'h3', 'p', 'li', 'ul', 'ol', 'a', 'div', 'span', 'strong', 'em', 'br', 'blockquote', 'pre', 'code', 'img'],
            allowedAttributes: {
              'a': ['href', 'target'],
              'img': ['src', 'alt'],
              '*': ['style', 'class', 'id']
            }
          });

          setContent(sanitizedContent);
        } else {
          // Handle the case when data or data.content is not available
          console.error("Content data is invalid:", data);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        setError(error.message);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="content pt-6 pb-5">
        {error && <div className="text-red-500">Error: {error}</div>}
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

export default About;
