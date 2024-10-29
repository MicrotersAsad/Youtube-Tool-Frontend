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
import { replaceShortcodes } from '../../components/replaceShortcodes'; // Import shortcode function

const BlogPost = ({ initialBlog, initialShortcodes }) => {
  console.log(initialShortcodes);
  
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [shortcodes, setShortcodes] = useState(initialShortcodes);
  const [loading, setLoading] = useState(!initialBlog);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/blogs`;
          const { data } = await axios.get(apiUrl);
          const fetchedBlog = data.find((item) => item.slug === slug);

          if (fetchedBlog) {
            setBlog(fetchedBlog);
          } else {
            console.warn('No blog found with slug:', slug);
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

  // Fetch shortcodes dynamically if not provided initially
  useEffect(() => {
    if (!initialShortcodes) {
      const fetchShortcodes = async () => {
        try {
          const { data } = await axios.get('/api/shortcodes-tools');
          setShortcodes(data);
        } catch (error) {
          console.error('Error fetching shortcodes:', error.message);
        }
      };

      fetchShortcodes();
    }
  }, [initialShortcodes]);

  const content = blog?.content || '';
  const [toc, updatedContent] = useToc(content);

  // Replace shortcodes in the content with the dynamic components
  const contentWithShortcodes = replaceShortcodes(updatedContent, shortcodes);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!blog) {
    return <p className="text-red-500">No content available for this language.</p>;
  }

  return (
    <div className="relative">
      <Head>
        {/* Head meta tags */}
        <title>{blog.title} | ytubetools</title>
        <meta name="description" content={blog.description} />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-grow order-1 lg:order-2">
            <Breadcrumb blogTitle={blog.title} />
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-8">
              <div className="p-6 bg-white border-b border-gray-200">
                <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>

                {/* Render processed content with shortcodes */}
                <div className="my-4">{contentWithShortcodes}</div>

                {/* Additional content */}
              </div>
            </div>
            <Comments slug={slug} />
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

    const { data: blogs } = await axios.get(apiUrl);
    const blog = blogs.find((item) => item.slug === slug);

    if (!blog) {
      return {
        notFound: true,
      };
    }

    // Fetch shortcodes on server-side
    const { data: shortcodes } = await axios.get(`${protocol}://${host}/api/shortcodes-tools`);

    return {
      props: {
        initialBlog: blog,
        initialShortcodes: shortcodes,
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
