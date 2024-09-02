/* eslint-disable react/no-unescaped-entities */
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';

const Terms = ({ existingContent, initialTitle, initialDescription }) => {
  const [quillContent, setQuillContent] = useState(existingContent || '');
  const [error, setError] = useState(null);
  const [title, setTitle] = useState(initialTitle || 'Terms & Condition');
  const [description, setDescription] = useState(initialDescription || 'Terms & Condition');
   const [loading,setLoading ]=useState()
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/terms?lang=${language}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        console.log("Fetched Data:", data);
        setQuillContent(data?.content || '');
        setTitle(data?.metaTitle || title);
        setDescription(data?.metaDescription || description);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching content:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchContent();
  }, [i18n.language]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:url" content="https://ytubetools.com/terms" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>
      <div className="content pt-6 pb-5">
        {error && <div className="text-red-500">Error: {error}</div>}
        <div dangerouslySetInnerHTML={{ __html: quillContent }}></div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : 'http';
  const apiUrl = `${protocol}://${host}/api/privacy?language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await contentResponse.json();

    return {
      props: {
        existingContent: contentData.content || '',
        initialTitle: contentData.metaTitle || 'Terms & Condition',
        initialDescription: contentData.metaDescription || 'Terms & Condition',
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        existingContent: '',
        initialTitle: 'Terms & Condition',
        initialDescription: 'Terms & Condition',
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  }
}

export default Terms;
