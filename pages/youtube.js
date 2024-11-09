import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaCalendar, FaSearch, FaUserCircle } from 'react-icons/fa';
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { format } from 'date-fns';
import Head from 'next/head';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import oops from "../public/opps.png"
const createSlug = (title) => {
  return title
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const extractFirstImage = (content) => {
  const regex = /<img.*?src="(.*?)"/;
  const match = regex.exec(content);
  return match ? match[1] : null;
};

const BlogSection = ({ initialBlogs = [] }) => {
  const router = useRouter();
  const { category: selectedCategory } = router.query;
  const [loading, setLoading] = useState(!initialBlogs.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [blogsData, setBlogsData] = useState(initialBlogs);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(selectedCategory || '');

  const blogsPerPage = 9;
  const currentLanguage = i18n.language || 'en';

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/yt-categories');
      const filteredCategories = response.data.map((category) => {
        const translation = category.translations[currentLanguage];
        return {
          ...category,
          name: translation ? translation.name : category.name,
          slug: translation ? translation.slug : category.slug,
        };
      });
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const processedBlogs = useMemo(() => {
    return blogsData
      .map((blog) => {
        const translation = blog.translations[currentLanguage];

        if (!translation) {
          return null; // Exclude blogs without the current language translation
        }

        const title = translation.title || '';

        if (!translation.slug && title) {
          translation.slug = createSlug(title);
        }
        if (!translation.image && translation.content) {
          translation.image = extractFirstImage(translation.content);
        }

        return {
          _id: blog._id,
          createdAt: blog.createdAt,
          author: blog.author,
          ...blog,
          translations: {
            ...blog.translations,
            [currentLanguage]: translation,
          },
        };
      })
      .filter((blog) => blog); // Filter out null values
  }, [blogsData, currentLanguage]);

  const categoryBlogs = useMemo(() => {
    let blogs = processedBlogs;
    if (currentCategory) {
      blogs = blogs.filter(
        (blog) =>
          blog.translations[currentLanguage].category &&
          createSlug(blog.translations[currentLanguage].category) === currentCategory
      );
    }
    if (searchQuery) {
      blogs = blogs.filter((blog) =>
        (blog.translations[currentLanguage].title || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }
    return blogs;
  }, [currentCategory, processedBlogs, currentLanguage, searchQuery]);

  const currentBlogs = useMemo(() => {
    return categoryBlogs.slice((currentPage - 1) * blogsPerPage, currentPage * blogsPerPage);
  }, [categoryBlogs, currentPage, blogsPerPage]);

  const totalPages = Math.ceil(categoryBlogs.length / blogsPerPage);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/youtube');
      setBlogsData(response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('Failed to fetch blogs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBlogs.length) {
      fetchBlogs();
    }
  }, [fetchBlogs, initialBlogs]);

  const handleCategoryChange = (categorySlug) => {
    setCurrentCategory(categorySlug);
    setCurrentPage(1);
    router.push(
      {
        pathname: router.pathname,
        query: { category: categorySlug },
      },
      undefined,
      { shallow: true }
    );
  };

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="max-w-7xl container mx-auto px-4">
      <Head>
        <title>Ytubetools - Enhance Your YouTube Experience</title>
        <meta
          name="description"
          content="Explore our Article at Ytubetools for insights, tips, and tools designed to improve your YouTube content creation and viewer experience."
        />
      </Head>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array(9)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-white shadow-md rounded-lg p-4">
                <Skeleton height={180} className="mb-4" />
                <Skeleton height={20} width="60%" className="mb-2" />
                <Skeleton height={15} width="80%" className="mb-2" />
                <Skeleton height={15} width="40%" />
              </div>
            ))}
        </div>
      ) : currentBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Image src={oops} alt="No Blogs Available" width={200} height={200} />
          <h2 className="text-2xl font-semibold text-gray-700 mt-6">
            Oops! No Blogs Available
          </h2>
          <p className="text-gray-500 mt-4">
            It seems like we don't have any articles in this language or category.
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-6 mt-6">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search blogs by title..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute top-3 right-3 text-gray-400" />
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <ul className="flex flex-wrap justify-center space-x-2">
              <li
                className={`px-4 py-2 list-none rounded-full text-sm font-medium border ${
                  !currentCategory ? 'bg-purple-700 text-white' : 'bg-white text-gray-700'
                }`}
                onClick={() => handleCategoryChange('')}
              >
                <span className="cursor-pointer">All Posts</span>
              </li>
              {categories.map((category) => (
                <li
                  key={category.slug}
                  className={`px-4 py-2 list-none rounded-full text-sm font-medium border ${
                    currentCategory === category.slug ? 'bg-purple-700 text-white' : 'bg-white text-gray-700'
                  }`}
                  onClick={() => handleCategoryChange(category.slug)}
                >
                  <span className="cursor-pointer">{category.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {currentBlogs.map((blog) => {
              const content = blog.translations[currentLanguage];
              return (
                <div key={blog._id} className="bg-white shadow-md rounded-lg overflow-hidden relative">
                  <Image
                    src={content.image || '/default.jpg'}
                    alt={content.title || 'Blog Image'}
                    width={400}
                    height={270}
                    className="blog-img"
                  />
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                    <span>{content.category || 'Uncategorized'}</span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-lg font-semibold">
                      <Link href={`/youtube/${content.slug}`}>
                        <span className="text-blue-500 text-xl font-bold hover:underline">
                          {content.title}
                        </span>
                      </Link>
                    </h4>
                    <p className="text-gray-500 text-sm">{content.description}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <FaUserCircle className="mr-1" /> {blog.author} &nbsp; | &nbsp;
                      <FaCalendar className="mr-1" /> {format(new Date(blog.createdAt), 'dd/MM/yyyy')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            {totalPages > 1 && (
              <nav className="block">
                <ul className="flex pl-0 rounded list-none flex-wrap">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <li key={index} className="page-item">
                      <button
                        onClick={() => setCurrentPage(index + 1)}
                        className={`page-link ${
                          currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'
                        } px-4 py-2 mx-1 rounded-full`}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export async function getServerSideProps({ locale, req }) {
  try {
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/youtube`;
    const { data } = await axios.get(apiUrl);

    return {
      props: {
        initialBlogs: data,
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialBlogs: [],
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),
      },
    };
  }
}

export default BlogSection;
