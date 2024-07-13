/* eslint-disable react/no-unescaped-entities */
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useCallback, useEffect, useState } from 'react';


const Terms = () => {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // State to track loading
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/privacy?lang=${language}`);
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
  }, [i18n.language]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="content pt-6 pb-5">
        {error && <div className="text-red-500">Error: {error}</div>}
        <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
      </div>
    </div>
  );
};
export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/privacy&language=${locale}`;

  try {
    const [contentResponse] = await Promise.all([
      fetch(apiUrl),
    ]);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const [contentData] = await Promise.all([
      contentResponse.json(),
    ]);

    const meta = {
      title: contentData[0]?.title || "",
      description: contentData[0]?.description || "",
      image: contentData[0]?.image || "",
     
    };

    return {
      props: {
        meta,
        faqs: contentData[0].faqs || [],
        ...(await serverSideTranslations(locale, ['footer','navbar'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:");
    return {
      props: {
        meta: {},
        faqs: [],
        ...(await serverSideTranslations(locale, [ 'footer','navbar'])),
      },
    };
  }
}
export default Terms;
