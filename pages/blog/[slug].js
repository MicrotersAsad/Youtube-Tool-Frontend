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
import { replaceShortcodes } from '../../components/replaceShortcodes'; // শর্টকোড ফাংশন ইম্পোর্ট

const BlogPost = ({ initialBlog }) => {
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [loading, setLoading] = useState(!initialBlog);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/blogs`;
          console.log('Fetching data from API:', apiUrl);
          const { data } = await axios.get(apiUrl);
          const blogs = data;

          // স্লাগের সাথে মিলে যাওয়ার জন্য ডেটা ফিল্টার করা হচ্ছে
          const blog = blogs.find(blog =>
            blog.slug === slug // সরাসরি স্লাগ ফিল্টার করা হচ্ছে
          );

          if (blog) {
            console.log('Blog found:', blog);
            setBlog(blog);
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

  // চেক করে দেখুন যে ব্লগ সঠিকভাবে লোড হয়েছে কি না
  console.log('Loaded blog:', blog);

  const content = blog?.content || '';
  const [toc, updatedContent] = useToc(content);

  // কনটেন্টের মধ্যে শর্টকোড প্রতিস্থাপন করা
  const contentWithShortcodes = replaceShortcodes(updatedContent);
  console.log('Content with shortcodes:', contentWithShortcodes);

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

                {/* এখানে শর্টকোড প্রসেস করা কনটেন্ট রেন্ডার করা */}
                <div className="my-4">
                  {contentWithShortcodes}
                </div>

                {/* অন্যান্য কন্টেন্ট */}
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

    console.log('Fetching blogs with slug:', slug, 'from URL:', apiUrl);
    const { data } = await axios.get(apiUrl);
    const blogs = data;

    // স্লাগ অনুযায়ী ব্লগ খুঁজে বের করা হচ্ছে
    const blog = blogs.find(blog =>
      blog.slug === slug // সরাসরি স্লাগ ফিল্টার করা
    );

    if (!blog) {
      console.warn('Blog not found for slug:', slug);
      return {
        notFound: true,
      };
    }

    console.log('Blog found:', blog);

    return {
      props: {
        initialBlog: blog,
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching blogs:', error.message);
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
