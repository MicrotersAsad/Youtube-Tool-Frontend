import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { ClipLoader } from 'react-spinners';
import { FaArrowRight } from 'react-icons/fa';
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

const BlogSection = ({ initialBlogs }) => {
  const [loading, setLoading] = useState(!initialBlogs.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [blogsData, setBlogsData] = useState(initialBlogs);
  const blogsPerPage = 9;

  const filteredBlogs = blogsData.filter(blog => blog.translations[i18n.language]);
  const currentBlogs = filteredBlogs.slice((currentPage - 1) * blogsPerPage, currentPage * blogsPerPage);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/blogs`);
      setBlogsData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('Failed to fetch blogs.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBlogs.length) {
      fetchBlogs();
    } else {
      setLoading(false);
    }
  }, [fetchBlogs, initialBlogs]);

  const parseCategories = (category) => {
    return category ? category.split(',') : [];
  };

  const getTranslatedContent = (blog) => {
    const lang = i18n.language || blog.defaultLanguage;
    return blog.translations[lang] || blog.translations[blog.defaultLanguage];
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (filteredBlogs.length === 0) {
    return <p>No blogs available in this language.</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <Head>
        <title>YtubeTools Blog | Ytubetool</title>
        <meta name="description" content="Blog Page" />
        <meta property="og:url" content="https://ytubetools.com/blog" />
        <meta
          property="og:description"
          content="Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights."
        />
      </Head>

      <div className="container mx-auto px-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
          <div>
            {currentBlogs.slice(0, 1).map((blog, index) => {
              const content = getTranslatedContent(blog);
              return (
                <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                  {content.image && (
                    <Image
                      src={content.image}
                      alt={content.title}
                      width={600}
                      height={400}
                      layout="responsive"
                      className="object-cover rounded-lg"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-3xl font-semibold mb-2">
                      <Link href={`/blog/${content.slug}`} passHref>
                        <span className="text-blue-500 hover:underline">{content.title}</span>
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">{content.description}</p>
                    <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                    <div className="mt-2">
                      {parseCategories(blog.category).map((category, i) => (
                        <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-4">
            {currentBlogs.slice(1, 4).map((blog, index) => {
              const content = getTranslatedContent(blog);
              return (
                <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row">
                  {content.image && (
                    <Image
                      src={content.image}
                      alt={content.title}
                      width={280}
                      height={100}
                      layout="responsive"
                      className="object-cover rounded-lg blog-img"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="text-lg font-semibold">
                      <Link href={`/blog/${content.slug}`} passHref>
                        <span className="text-blue-500 hover:underline">{content.title}</span>
                      </Link>
                    </h4>
                    <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                    <div className="mt-2">
                      {parseCategories(blog.category).map((category, i) => (
                        <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-red-500 text-white p-10 rounded-lg relative w-full text-center mt-5 mb-5">
          <div className="mt-10">
            <h2 className="text-2xl text-white font-bold mb-2">SUBSCRIBE TO OUR NEWSLETTER</h2>
            <p className="mb-4">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Deleniti aliquid molestias voluptatem fugiat provident tenetur saepe hic consectet.</p>
            <form className="flex justify-center" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email Address" className="w-full max-w-xs p-3 rounded-l-md focus:outline-none" />
              <button type="submit" className="bg-red-600 p-3 rounded-r-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {currentBlogs.slice(4).map((blog, index) => {
            const content = getTranslatedContent(blog);
            return (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                {content.image && (
                  <Image
                    src={content.image}
                    alt={content.title}
                    width={600}
                    height={400}
                    layout="responsive"
                    className="object-cover rounded-lg"
                  />
                )}
                <div className="p-4">
                  <h4 className="text-lg font-semibold">
                    <Link href={`/blog/${content.slug}`} passHref>
                      <span className="text-blue-500 hover:underline">{content.title}</span>
                    </Link>
                  </h4>
                  <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                  <div className="mt-2">
                    {parseCategories(blog.category).map((category, i) => (
                      <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                    ))}
                  </div>
                  <Link href={`/blog/${content.slug}`} passHref>
                    <span className="text-red-500 hover:underline mt-3"><span>Read More <FaArrowRight/></span></span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-8">
          <nav className="block">
            <ul className="flex pl-0 rounded list-none flex-wrap">
              {Array.from({ length: totalPages }, (_, index) => (
                <li key={index} className="page-item">
                  <button
                    onClick={() => paginate(index + 1)}
                    className={`page-link ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ locale, req }) {
  try {
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/blogs`;
    const { data } = await axios.get(apiUrl);
    return {
      props: {
        initialBlogs: data,
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching blogs:', error.message);
    return {
      props: {
        initialBlogs: [],
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
    };
  }
}

export default BlogSection;
