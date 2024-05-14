/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
const Privacy = () => {
    const [content,setContent]=useState('')
    useEffect(() => {
      const fetchContent = async () => {
        try {
          const response = await fetch('/api/privacy');
          if (!response.ok) {
            throw new Error('Failed to fetch content');
          }
          const data = await response.json();
          console.log("Content data:", data); // Check the fetched data
          
          // Check if data is an array and contains content
          if (Array.isArray(data) && data.length > 0 && data[0].content) {
            // Sanitize the content while allowing certain tags
            const sanitizedContent = sanitizeHtml(data[0].content, {
              allowedTags: ['h2', 'h3', 'p', 'li', 'a'],
              allowedAttributes: {
                'a': ['href']
              }
            });
  
            setContent(sanitizedContent);
          } else {
            // Handle the case when data or data[0].content is not available
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
    <div dangerouslySetInnerHTML={{ __html: content }} />
  </div>
        </div>
    );
};

export default Privacy;