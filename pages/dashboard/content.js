import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';

// Dynamically import the QuillWrapper component with SSR disabled
const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function Content() {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('tagGenerator'); // Default category
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [selectedCategory]); // Fetch content when category changes

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/content?category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      console.log("Fetched Data:", data);
      const contentData = data.length > 0 ? data[0].content : ''; // Get content if available
      setQuillContent(contentData);
      setExistingContent(contentData);
      setIsEditing(data.length > 0); // Set editing mode based on whether content exists
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setError(error.message);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      console.log("Submitting Data:", quillContent);
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(`/api/content?category=${selectedCategory}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: quillContent }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }

      // Handle success
      console.log('Content posted successfully');
      setError(null);
      setExistingContent(quillContent);
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  }, [quillContent, selectedCategory, isEditing]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
  }, []);

  const renderHeader = () => {
    switch(selectedCategory) {
      case 'tagGenerator':
        return 'Tag Generator';
      case 'tagExtractor':
        return 'Tag Extractor';
      case 'Titlegenerator':
        return 'Title Generator';
      case 'DescriptionGenerator':
        return 'Description Generator';
      case 'YouTube-Channel-Banner-Downloader':
        return 'YouTube Channel Banner Downloader';
      case 'YouTube-Channel-Logo-Downloader':
        return 'YouTube Channel Logo Downloader';
      case 'YouTube-Embed-Code-Generator':
        return 'YouTube Embed Code Generator';
      case 'youtube-title-and-description-extractor':
        return 'YouTube Title and Description Extractor';
      default:
        return 'Unknown Category';
    }
  };

  return (
    <Layout>
      <div className='container p-5'>
        <h2>Content Add For {renderHeader()}</h2>
        <div className="mb-3 flex items-center">
          <label htmlFor="category" className="mr-2 text-sm font-medium">Select Category:</label>
          <div className="relative">
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="tagGenerator">Tag Generator</option>
              <option value="tagExtractor">Tag Extractor</option>
              <option value="Titlegenerator">Title Generator</option>
              <option value="DescriptionGenerator">Description Generator</option>
              <option value="YouTube-Channel-Banner-Downloader">YouTube Channel Banner Downloader</option>
              <option value="YouTube-Channel-Logo-Downloader">YouTube Channel Logo Downloader</option>
              <option value="YouTube-Embed-Code-Generator">YouTube Embed Code Generator</option>
              <option value="youtube-title-and-description-extractor">YouTube Title and Description Extractor</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.293 7.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L7 9.414V17a1 1 0 11-2 0V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        {error && <div className="text-red-500">Error: {error}</div>}
        <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
        <button className='btn btn-primary p-2 mt-3' onClick={handleSubmit}>Submit Content</button>
        
        <div className='mt-10'>
        <h2>{renderHeader()} Content</h2>
          <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default Content;