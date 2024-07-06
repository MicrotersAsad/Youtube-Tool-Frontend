import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { data } from 'autoprefixer';

// Dynamically import the QuillWrapper component with SSR disabled
const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function Content() {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('tagGenerator'); // Default category
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    fetchContent();
  }, [selectedCategory]); // Fetch content and FAQs when category changes

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/content?category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();

      const contentData = data[0].content || '';
      const faqsData = data[0].faqs || [];
      const metatitle = data[0].title || {};
      const metaDescription = data[0].description || {};

      setQuillContent(contentData);
      setExistingContent(contentData);
      setTitle(metatitle || '');
      setDescription(metaDescription || '');
      setFaqs(faqsData);
      setIsEditing(!!contentData); // Set editing mode based on whether content exists
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setError(error.message);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST';
      
      // Prepare form data
      const formData = new FormData();
      formData.append('content', quillContent);
      formData.append('title', title);
      formData.append('description', description);
      if (image) {
        formData.append('image', image);
      }
      formData.append('faqs', JSON.stringify(faqs));

      const response = await fetch(`/api/content?category=${selectedCategory}`, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }

      // Handle success
      setError(null);
      setExistingContent(quillContent);
      toast.success('Content uploaded successfully!');
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  }, [quillContent, selectedCategory, isEditing, title, description, image, faqs]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
  }, []);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleFaqChange = (index, key, value) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][key] = value;
    setFaqs(updatedFaqs);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
  };

  const renderHeader = () => {
    switch(selectedCategory) {
      case 'tagGenerator':
        return 'Tag Generator';
      case 'tagExtractor':
        return 'Tag Extractor';
      case 'youtube-title-and-description-generator?tab=title':
        return 'Title Generator';
      case 'youtube-title-and-description-generator?tab=description':
        return 'Description Generator';
      case 'YouTube-Channel-Banner-Downloader':
        return 'YouTube Channel Banner Downloader';
      case 'YouTube-Channel-Logo-Downloader':
        return 'YouTube Channel Logo Downloader';
      case 'YouTube-Embed-Code-Generator':
        return 'YouTube Embed Code Generator';
      case 'YouTube-Hashtag-Generator':
        return 'YouTube Hashtag Generator';
      case 'youtube-title-and-description-extractor':
        return 'YouTube Title and Description Extractor';
      case 'channel-id-finder':
        return 'YouTube Channel ID Finder';
      case 'Youtube-Thumbnails-Generator':
        return 'Youtube Thumbnails Downlaod';
      case 'video-data-viewer':
        return 'YouTube Video Data Viewer';
      case 'monetization-checker':
        return 'YouTube Monetization Checker';
      case 'YouTube-Channel-Search':
        return 'YouTube Channel Search';
      case 'YouTube-Video-Summary-Generator':
        return 'YouTube Video Summary Generator';
      case 'case-converter':
        return 'Case Converter';
      case 'trendingVideos':
        return 'YouTube Trending Videos';
      case 'YouTube-Money-Calculator':
        return 'YouTube Money Calculator';
      case 'youtube-comment-picker':
        return 'Youtube Comment Picker';
      case 'keyword-research':
        return 'YouTube Keyword Research';
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
              <option value="youtube-title-and-description-generator?tab=title">Title Generator</option>
              <option value="youtube-title-and-description-generator?tab=description">Description Generator</option>
              <option value="YouTube-Channel-Banner-Downloader">YouTube Channel Banner Downloader</option>
              <option value="YouTube-Channel-Logo-Downloader">YouTube Channel Logo Downloader</option>
              <option value="YouTube-Embed-Code-Generator">YouTube Embed Code Generator</option>
              <option value="YouTube-Hashtag-Generator">YouTube Hashtag Generator</option>
              <option value="youtube-title-and-description-extractor">YouTube Title and Description Extractor</option>
              <option value="channel-id-finder">YouTube Channel ID Finder</option>
              <option value="Youtube-Thumbnails-Generator">Youtube Thumbnails Generator</option>
              <option value="video-data-viewer">YouTube Video Data Viewer</option>
              <option value="monetization-checker">YouTube Monetization Checker</option>
              <option value="YouTube-Channel-Search">YouTube Channel Search</option>
              <option value="YouTube-Video-Summary-Generator">YouTube Video Summary Generator</option>
              <option value="case-converter">Case Converter</option>
              <option value="trendingVideos">YouTube Trending Videos</option>
              <option value="YouTube-Money-Calculator">YouTube Money Calculator</option>
              <option value="youtube-comment-picker">Youtube Comment Picker</option>
              <option value="keyword-research">Keyword Research</option>
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
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label htmlFor="title" className="block text-sm font-medium">Meta Title:</label>
            <input 
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-gray-600 text-xs italic">Recommended length: 60 characters</p>
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="block text-sm font-medium">Meta Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
          />
          <p className="text-gray-600 text-xs italic">Recommended length: 155-160 characters</p>
        </div>
        <div className="mb-5">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Upload Image:</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            className="mt-1 block w-full text-gray-700"
          />
          <p className="text-gray-600 text-xs italic">Recommended dimension: 1200 x 630</p>
        </div>
        {error && <div className="text-red-500">Error: {error}</div>}
        <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
        
        <div className='faq-section mt-10'>
          <h2>Manage FAQs</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="mb-3">
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                  className="flex-1 border rounded py-2 px-3 mr-2"
                />
                <button onClick={() => removeFaq(index)} className="text-red-500 hover:text-red-700">Remove</button>
              </div>
              <textarea
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                className="w-full border rounded py-2 px-3"
              />
            </div>
          ))}
          <button onClick={addFaq} className="btn btn-secondary p-2 mt-3">Add New FAQ</button>
        </div>
       
        <button className='btn btn-primary p-2 mt-3' onClick={handleSubmit}>Submit Content</button>
        <div className='existing-content-section mt-10'>
          <h2>{renderHeader()} Content</h2>
          <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
        </div>
      </div>
      <ToastContainer />
    </Layout>
  );
}

export default Content;
