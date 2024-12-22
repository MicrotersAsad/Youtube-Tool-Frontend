import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { fetchContent, fetchReviews } from '../contexts/ContentContext';

export const getContentProps = async (category, locale) => {
  const host = process.env.NEXT_PUBLIC_HOST || 'localhost:3000';
  const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';

  const contentProps = await fetchContent(category, locale, host, protocol, () => {});
  const reviews = await fetchReviews(category, host, protocol, () => {});

  return {
    props: {
      ...contentProps,
      reviews,
      ...(await serverSideTranslations(locale, [
        'common',
        'tagextractor',
        'navbar',
        'titlegenerator',
        'trending',
        'videoDataViewer',
        'banner',
        'logo',
        'search',
        'embed',
        'hashtag',
        'calculator',
        'thumbnail',
        'tdextractor',
        'channelId',
      ])),
    },
  };
};
