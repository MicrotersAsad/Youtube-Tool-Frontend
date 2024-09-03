import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const fetchContent = async (category, locale, host, protocol, setLoading) => {
  setLoading(true);
  try {
    const apiUrl = `${protocol}://${host}/api/content?category=${category}&language=${locale}`;
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error('Failed to fetch content');
    }

    const contentData = await contentResponse.json();

    if (!contentData.translations || !contentData.translations[locale]) {
      throw new Error('Invalid content data format');
    }
    const reactions = contentData.translations[locale]?.reactions || { likes: 0, unlikes: 0, reports: [], users: {} };
    const translations=contentData.translations
    
    return {
      content: contentData.translations[locale]?.content || '',
      meta: {
        title: contentData.translations[locale]?.title || '',
        description: contentData.translations[locale]?.description || '',
        image: contentData.translations[locale]?.image || '',
        url: `${protocol}://${host}`,
      },
      faqs: contentData.translations[locale]?.faqs || [],
      relatedTools: contentData.translations[locale]?.relatedTools || [],
      reactions,
      translations
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      content: '',
      reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
      translations:[],
      meta: {
        title: 'Default Title',
        description: 'Default Description',
        image: '',
        url: '',
      },
      faqs: [],
      relatedTools: [],
    };
  } finally {
    setLoading(false);
  }
};

export const fetchReviews = async (tool, host, protocol, setLoading) => {
  setLoading(true);
  try {
    const apiUrl = `${protocol}://${host}/api/reviews?tool=${tool}`;
    const response = await fetch(apiUrl);

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

  return (
    <ContentContext.Provider value={{ content, meta, faqs,reactions,translations, reviews, loading, setLoading, setContent, setFaqs, setMeta, setReviews,setTranslations }}>
      {children}
    </ContentContext.Provider>
  );
};
