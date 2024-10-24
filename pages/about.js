import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';

function About({existingContent }) {

  
  const [quillContent, setQuillContent] = useState(existingContent || '');
  const [title, setTitle] = useState(existingContent || '');
  const [description, setDescription] = useState(existingContent || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/about?lang=${language}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setQuillContent(data?.content || '');
        setTitle(data?.metaTitle || '');
        setDescription(data?.metaDescription || '');
        
      } catch (error) {
        console.error('Error fetching content');
        setError('Failed to fetch content');
      }
    };

    fetchContent();
  }, [i18n.language]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>{title || 'About Us'}</title>
        <meta name="description" content={description || 'About Page'} />
        <meta property="og:url" content="https://ytubetools.com/about" />
        <meta property="og:description" content={description || 'Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel\'s performance with advanced features and insights.'} />
      </Head>
      <div className="mt-10">
        <h1 className="text-center">About Us</h1>
        <div dangerouslySetInnerHTML={{ __html: quillContent }} style={{ listStyleType: 'none' }}></div>
      </div>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
}

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const apiUrl = `${protocol}://${host}/api/about?language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error('Failed to fetch content');
    }

    const contentData = await contentResponse.json();



    return {
      props: {
       
        existingContent: contentData.content || '',
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
      
        existingContent: '',
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  }
}

export default About;
