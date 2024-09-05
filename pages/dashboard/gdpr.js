import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';

// Dynamically import the QuillWrapper component with SSR disabled
const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function GDPR() {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [existingMetaTitle, setExistingMetaTitle] = useState('');
  const [existingMetaDescription, setExistingMetaDescription] = useState('');
  const [language, setLanguage] = useState('en'); // Default language
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/gdpr?lang=${language}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        console.log("Fetched Data:", data); // Add debugging
        setQuillContent(data?.content || '');
        setMetaTitle(data?.metaTitle || '');
        setMetaDescription(data?.metaDescription || '');
        setExistingContent(data?.content || '');
        setExistingMetaTitle(data?.metaTitle || '');
        setExistingMetaDescription(data?.metaDescription || '');
   
    
      } catch (error) {
        console.error('Error fetching content:', error.message);
        setError(error.message);
      }
    };

    fetchContent();
  }, [language]); // Refetch content when language changes

  const handleSubmit = useCallback(async () => {
    try {
      console.log("Submitting Data:", { quillContent, metaTitle, metaDescription }); // Add debugging
      const response = await fetch('/api/gdpr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: quillContent, language, metaTitle, metaDescription }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }

      // Handle success
      console.log('Content posted successfully');
      setError(null);
      setExistingContent(quillContent);
      setExistingMetaTitle(metaTitle);
      setExistingMetaDescription(metaDescription);
     
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  }, [quillContent, metaTitle, metaDescription, language]);


  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  return (
    <Layout>
      <div className='container p-5'>
      <h2>GDPR Content Add</h2> 
        <div className="mb-4">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Select Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-28 p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="zh-HANT">中国传统的</option>
            <option value="zh-HANS">简体中文</option>
            <option value="nl">Nederlands</option>
            <option value="gu">ગુજરાતી</option>
            <option value="hi">हिंदी</option>
            <option value="it">Italiano</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="pl">Polski</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
            Meta Title
          </label>
          <input
            type="text"
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
            Meta Description
          </label>
          <textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows="3"
          />
        </div>
        {error && <div className="text-red-500">Error: {error}</div>}
        <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
        <button className='btn btn-primary p-2 mt-3' onClick={handleSubmit}>Submit Content</button>
        
        <div className='mt-10'>
          <h2>GDPR Content</h2>
          <p className="text-sm font-medium text-gray-700">Meta Title: {existingMetaTitle}</p>
          <p className="text-sm font-medium text-gray-700">Meta Description: {existingMetaDescription}</p>
          <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default GDPR;