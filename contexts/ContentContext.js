// contexts/ContentContext.js
import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const fetchContent = async (category, locale, host, protocol) => {
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

    return {
      content: contentData.translations[locale]?.content || '',
      meta: {
        title: contentData.translations[locale]?.title || '',
        description: contentData.translations[locale]?.description || '',
        image: contentData.translations[locale]?.image || '',
        url: `${protocol}://${host}/tools/${category}`,
      },
      faqs: contentData.translations[locale]?.faqs || [],
      relatedTools: contentData.translations[locale]?.relatedTools || [],
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      content: '',
      meta: {
        title: 'Default Title',
        description: 'Default Description',
        image: '',
        url: '',
      },
      faqs: [],
      relatedTools: [],
    };
  }
};

export const fetchReviews = async (tool, host, protocol) => {
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

  return (
    <ContentContext.Provider value={{ content, meta, faqs, reviews, fetchReviews }}>
      {children}
    </ContentContext.Provider>
  );
};
