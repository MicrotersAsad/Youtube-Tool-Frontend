/* eslint-disable react/no-unescaped-entities */
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';

const Gdpr = ({ existingContent, meta }) => {
  const [quillContent, setQuillContent] = useState(existingContent || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(existingContent || '');
  const [description, setDescription] = useState(existingContent || '');
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/gdpr?lang=${language}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setQuillContent(data?.content || '');
        setTitle(data?.metaTitle || '');
        setDescription(data?.metaDescription || '')
        setLoading(false);
      } catch (error) {
        console.error('Error fetching content:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchContent();
  }, [i18n.language]);



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{title || 'Gdpr'}</title>
        <meta name="description" content={description || 'Gdpr'} />
        <meta property="og:url" content="https://ytubetools.com/gdpr" />
        <meta property="og:description" content={description || 'Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel\'s performance with advanced features and insights.'} />
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
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : "http";
  const apiUrl = `${protocol}://${host}/api/gdpr?language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await contentResponse.json();

    const meta = {
      title: "Gdpr  - YouTube Tools",
      description: "This is the gdpr page for YouTube Tools.",
      image: "https://your-site.com/path-to-your-image.jpg",
      url: `${protocol}://${host}/gdpr`
    };

    return {
      props: {
        meta,
        existingContent: contentData.content || '',
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {
          title: "Gdpr  - YouTube Tools",
          description: "This is the Gdpr page for YouTube Tools.",
          image: "https://your-site.com/path-to-your-image.jpg",
          url: `${protocol}://${host}/gdpr`
        },
        existingContent: '',
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  }
}

export default Gdpr;
