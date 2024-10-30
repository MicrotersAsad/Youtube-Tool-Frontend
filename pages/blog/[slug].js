// BlogPost.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ClipLoader } from 'react-spinners';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Breadcrumb from '../Breadcrumb';
import Comments from '../../components/Comments';
import { useToc } from '../../hook/useToc';
import TableOfContents from '../../components/TableOfContents';
import ReactDOMServer from 'react-dom/server';
import { format } from 'date-fns';
import AuthorInfo from '../../components/AuthorCard';
import { useTranslation } from 'react-i18next';
import { replaceShortcodes } from '../../components/replaceShortcodes'; // Import shortcode function

const getTitle = (translation) => translation.title || translation.Title || '';
const getContent = (translation) => translation.content || translation.Content || '';

const insertTocBeforeFirstHeading = (content, tocHtml) => {
  const firstHeadingIndex = content.search(/<h[1-6][^>]*>/);
  if (firstHeadingIndex === -1) return content;
  const beforeFirstHeading = content.slice(0, firstHeadingIndex);
  const afterFirstHeading = content.slice(firstHeadingIndex);
  return `${beforeFirstHeading}${tocHtml}${afterFirstHeading}`;
};

const BlogPost = ({ initialBlog, authorData, relatedBlogs }) => {
  const { t } = useTranslation('blog');
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [author, setAuthor] = useState(authorData?.author);
  const [loading, setLoading] = useState(!initialBlog);
  const [shortcodes, setShortcodes] = useState([]);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/blogs`;
          const { data } = await axios.get(apiUrl);
          const blogs = data;

          const blog = blogs.find(blog =>
            Object.values(blog.translations).some(translation => translation.slug === slug)
          );

          if (blog) {
            setBlog(blog);
            const authorResponse = await axios.get(`/api/authors?name=${blog.author}`);
            if (authorResponse.data.length > 0) {
              setAuthor(authorResponse.data[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching blogs:', error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [slug, initialBlog]);

  useEffect(() => {
    const fetchShortcodes = async () => {
      try {
        const { data } = await axios.get('/api/shortcodes-tools');
        setShortcodes(data);
      } catch (error) {
        console.error('Error fetching shortcodes:', error.message);
      }
    };
    fetchShortcodes();
  }, []);

  const translation = blog?.translations ? blog.translations[locale] || {} : {};
  const content = getContent(translation);
  const [toc, updatedContent] = useToc(content);

  const tocHtml = toc ? ReactDOMServer.renderToStaticMarkup(<TableOfContents headings={toc} />) : '';
  const contentWithToc = insertTocBeforeFirstHeading(updatedContent, tocHtml);

  const contentWithShortcodes = replaceShortcodes(contentWithToc, shortcodes);

  const categoryName = translation.category || 'Blog';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!blog) {
    return <p className="text-red-500">{t('No content available for this language.')}</p>;
  }

  return (
    <div className="relative">
      <Head>
        <title>{getTitle(translation)} | ytubetools</title>
        <meta name="description" content={translation.description || ''} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-grow order-1 lg:order-2">
            <Breadcrumb categoryName={categoryName} blogTitle={getTitle(translation)} />
            <h1 className="md:text-5xl font-bold mb-4">{getTitle(translation)}</h1>
            <AuthorInfo data={authorData} />
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-8">
              <div className="p-6 bg-white border-b border-gray-200">
                {/* Render processed content with shortcodes */}
                <div className="my-4">{contentWithShortcodes}</div>
                {/* Additional sections like comments */}
                <Comments slug={slug} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ locale, params, req }) {
  try {
    const { slug } = params;
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host || 'localhost:3000';
    const apiUrl = `${protocol}://${host}/api/blogs`;

    const { data } = await axios.get(apiUrl);
    const blogs = data;

    const blog = blogs.find(blog =>
      Object.values(blog.translations).some(translation => translation.slug === slug)
    );

    if (!blog) {
      return {
        notFound: true,
      };
    }

    const currentTranslation = blog.translations[locale];
    if (!currentTranslation) {
      return {
        notFound: true,
      };
    }

    const currentSlug = currentTranslation.slug;
    if (currentSlug !== slug) {
      return {
        redirect: {
          destination: `/blog/${currentSlug}`,
          permanent: false,
        },
      };
    }

    const authorResponse = await axios.get(`${protocol}://${host}/api/authors`);
    const authors = authorResponse.data;

    const author = authors.find(author => author.role === 'Author' && author.name === blog.author);
    const editor = authors.find(author => author.role === 'Editor' && author.name === blog.editor);
    const developer = authors.find(author => author.role === 'Developer' && author.name === blog.developer);

    const categoryBlogs = blogs.filter(
      (b) =>
        b !== blog &&
        Object.values(b.translations).some(
          (translation) => translation.category === blog.translations[locale]?.category
        )
    ).slice(0, 3);

    return {
      props: {
        initialBlog: blog,
        authorData: {
          author: author || null,
          editor: editor || null,
          developer: developer || null,
        },
        relatedBlogs: categoryBlogs,
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching blogs or authors:', error.message);
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
