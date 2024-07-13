import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { ClipLoader } from 'react-spinners';
import { FaArrowRight } from 'react-icons/fa';
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const BlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const blogsPerPage = 9;

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/blogs`);
      setBlogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('Failed to fetch blogs.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const parseCategories = (category) => {
    return category ? category.split(',') : [];
  };

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;

  const filteredBlogs = blogs.filter(blog => blog.language === i18n.language);
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, Math.min(indexOfLastBlog, filteredBlogs.length));
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

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
      <div className="container mx-auto px-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
          <div>
            {currentBlogs.slice(0, 1).map((blog, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={600}
                  height={400}
                />
                <div className="p-6">
                  <h3 className="text-3xl font-semibold mb=2">
                    {blog.slug ? (
                      <Link href={`/blog/${blog.slug}`} passHref>
                        <span className="text-blue-500 hover:underline">{blog.title}</span>
                      </Link>
                    ) : (
                      <span className="text-blue-500">{blog.title}</span>
                    )}
                  </h3>
                  <p className="text-gray-600 mb-4">{blog.description}</p>
                  <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                  <div className="mt-2">
                    {parseCategories(blog.category).map((category, i) => (
                      <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {currentBlogs.slice(1, 4).map((blog, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={280}
                  height={100}
                  className="object-cover rounded-lg blog-img"
                />
                <div className="p-4">
                  <h4 className="text-lg font-semibold">
                    {blog.slug ? (
                      <Link href={`/blog/${blog.slug}`} passHref>
                        <span className="text-blue-500 hover:underline">{blog.title}</span>
                      </Link>
                    ) : (
                      <span className="text-blue-500">{blog.title}</span>
                    )}
                  </h4>
                  <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                  <div className="mt-2">
                    {parseCategories(blog.category).map((category, i) => (
                      <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-500 text-white p-10 rounded-lg relative w-full text-center mt-5 mb-5">
          <div className="bg-red-500 absolute inset-x-0 -top-10 h-20 rounded-b-full"></div>
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
          {currentBlogs.slice(4).map((blog, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
              <Image
                src={blog.image}
                alt={blog.title}
                width={600}
                height={400}
                className="object-cover rounded-lg"
              />
              <div className="p-4">
                <h4 className="text-lg font-semibold">
                  {blog.slug ? (
                    <Link href={`/blog/${blog.slug}`} passHref>
                      <span className="text-blue-500 hover:underline">{blog.title}</span>
                    </Link>
                  ) : (
                    <span className="text-blue-500">{blog.title}</span>
                  )}
                </h4>
                <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                <div className="mt-2">
                  {parseCategories(blog.category).map((category, i) => (
                    <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                  ))}
                </div>
                {blog.slug && (
                  <Link href={`/blog/${blog.slug}`} passHref>
                    <span className="text-red-500 hover:underline mt-3"><span>Read More <FaArrowRight/></span></span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <nav className="block">
            <ul className="flex pl-0 rounded list-none flex-wrap">
              {[...Array(totalPages)].map((_, index) => (
                <li key={index}>
                  <a
                    onClick={() => paginate(index + 1)}
                    className={`cursor-pointer relative block py-2 px-3 leading-tight border border-gray-300 bg-navy ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-gray-200'}`}
                  >
                    {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/blogs`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await contentResponse.json();

    const meta = {
      title: contentData[0]?.metaTitle || "",
      description: contentData[0]?.metaDescription || "",
      image: contentData[0]?.image || "",
    };

    return {
      props: {
        meta,
        faqs: contentData[0]?.faqs || [],
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        ...(await serverSideTranslations(locale, ['footer', 'navbar'])),
      },
    };
  }
}

export default BlogSection;
