// ContentProvider.js
import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const fetchContent = async (category, locale, host, protocol, setLoading) => {
  setLoading(true);
  // AUTH_TOKEN has been removed as per request.

  try {
    const apiUrl = `${protocol}://${host}/api/content?category=${category}&language=${locale}`;
    console.log(apiUrl);

    const contentResponse = await fetch(apiUrl, {
      headers: {
        // Authorization header has been removed.
        'Content-Type': 'application/json',
      },
    });
    console.log(contentResponse);

    if (!contentResponse.ok) {
      throw new Error('Failed to fetch content');
    }

    const contentData = await contentResponse.json();
    console.log(contentData);

    if (!contentData.translations || !contentData.translations[locale]) {
      throw new Error('Invalid content data format');
    }

    // Define base URL
    const basePath = `${protocol}://${host}/tools/${category}`;
    const canonicalUrl = locale === "en" ? basePath : `${protocol}://${host}/${locale}/tools/${category}`;

    // Generate hreflang links
    const translations = contentData.translations || {};
    const hreflangs = [
      { rel: "alternate", hreflang: "x-default", href: `${basePath}` },
      { rel: "alternate", hreflang: "en", href: `${basePath}` },
      ...Object.keys(translations)
        .filter((lang) => lang !== "en")
        .map((lang) => ({
          rel: "alternate",
          hreflang: lang,
          href: `${protocol}://${host}/${lang}/tools/${category}`,
        })),
    ];

    return {
      content: contentData.translations[locale]?.content || '',
      meta: {
        title: contentData.translations[locale]?.title || 'Default Title',
        description: contentData.translations[locale]?.description || 'Default Description',
        image: contentData.translations[locale]?.image || '',
        url: canonicalUrl, // Canonical URL updated with language-specific logic
      },
      faqs: contentData.translations[locale]?.faqs || [],
      relatedTools: contentData.translations[locale]?.relatedTools || [],
      reactions: contentData.translations[locale]?.reactions || { likes: 0, unlikes: 0, reports: [], users: {} },
      translations: contentData.translations,
      hreflangs, // Pass hreflang links to props
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      content: '',
      reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
      translations: [],
      meta: {
        title: 'Default Title',
        description: 'Default Description',
        image: '',
        url: '',
      },
      faqs: [],
      relatedTools: [],
      hreflangs: [
        { rel: "alternate", hreflang: "x-default", href: `${protocol}://${host}/tools/${category}` },
        { rel: "alternate", hreflang: "en", href: `${protocol}://${host}/tools/${category}` },
      ],
    };
  } finally {
    setLoading(false);
  }
};

export const fetchReviews = async (tool, host, protocol, setLoading) => {
  setLoading(true);
  // AUTH_TOKEN has been removed as per request.

  try {
    const apiUrl = `${protocol}://${host}/api/reviews?tool=${tool}`;
    const response = await fetch(apiUrl, {
      headers: {
        // Authorization header has been removed.
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch reviews');

    const data = await response.json();
    const formattedData = data.map((review) => ({
      ...review,
      createdAt: format(new Date(review.createdAt), 'MMMM dd, yyyy'),
    }));
    return formattedData;
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return [];
  } finally {
    setLoading(false);
  }
};

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
  });
  const [reviews, setReviews] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState([]);
  const [hreflangs, setHreflangs] = useState([]);

  return (
    <ContentContext.Provider
      value={{
        content,
        meta,
        faqs,
        reactions,
        translations,
        reviews,
        loading,
        hreflangs,
        setLoading,
        setContent,
        setFaqs,
        setMeta,
        setReviews,
        setTranslations,
        setHreflangs,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};