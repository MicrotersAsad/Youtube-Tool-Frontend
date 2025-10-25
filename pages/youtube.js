
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
import oops from '../public/opps.png';

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

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  const [pageGroup, setPageGroup] = useState(0);
  const pagesPerGroup = 5;

  const paginationGroup = useMemo(() => {
    const start = pageGroup * pagesPerGroup;
    return Array.from({ length: pagesPerGroup }, (_, i) => start + i + 1).filter(
      (page) => page <= totalPages
    );
  }, [pageGroup, totalPages]);

  const handleNextGroup = () => {
    if ((pageGroup + 1) * pagesPerGroup < totalPages) {
      setPageGroup(pageGroup + 1);
    }
  };

  const handlePreviousGroup = () => {
    if (pageGroup > 0) {
      setPageGroup(pageGroup - 1);
    }
  };

  return (
    <nav className="flex justify-center mt-8 space-x-2 pt-5 pb-5">
      <button
        onClick={handlePreviousGroup}
        disabled={pageGroup === 0}
        className="px-4 py-2 rounded bg-gray-300 text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>
      {paginationGroup.map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-4 py-2 rounded ${
            currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={handleNextGroup}
        disabled={(pageGroup + 1) * pagesPerGroup >= totalPages}
        className="px-4 py-2 rounded bg-gray-300 text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
};

const BlogSection = ({ initialBlogs = [], availableLanguages, metaUrl, meta }) => {
  const router = useRouter();
  const { category: selectedCategory } = router.query;
  const [loading, setLoading] = useState(!initialBlogs.length);
 
  const [error, setError] = useState('');
  const [blogsData, setBlogsData] = useState(initialBlogs);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(selectedCategory || '');
  const [search, setSearch] = useState('');
  const blogsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(meta?.currentPage || 1);  // Safe fallback
const [totalPages, setTotalPages] = useState(meta?.totalPages || 1);  // Safe fallback

  const currentLanguage = i18n.language || 'en';
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
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
  }, [currentLanguage]);;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchBlogs = useCallback(
    async (page = 1, category = '') => {
      setLoading(true);
      try {
        const token = 'fc905a5a5ae08609ba38b046ecc8ef00'; // Example token
  
        if (!token) {
          throw new Error('No authorization token found');
        }
  
        const response = await axios.get(`/api/youtube`, {
          params: { page, limit: blogsPerPage, category },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const { data: blogs, meta = { currentPage: 1, totalPages: 1 } } = response.data;
  
        // Ensure blogsData is always an array
        setBlogsData(Array.isArray(blogs) ? blogs : []);
        setCurrentPage(meta.currentPage || 1);
        setTotalPages(meta.totalPages || 1);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to fetch blogs.');
      } finally {
        setLoading(false);
      }
    },
    [blogsPerPage]
  );
  
  

  useEffect(() => {
    fetchBlogs(currentPage, currentCategory);
  }, [currentPage, currentCategory, fetchBlogs]);

  const handleCategoryChange = (categorySlug) => {
    setCurrentCategory(categorySlug || ''); // Default to empty string if "All" is selected
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
  
 
  const hreflangs = [
    { rel: "alternate", hreflang: "x-default", href: metaUrl }, // x-default for fallback
    ...availableLanguages.map((lang) => ({
      rel: "alternate",
      hreflang: lang,
      href: lang === 'en' ? metaUrl : `${metaUrl.replace(/\/$/, '')}/${lang}/youtube`,
    })),
  ];
  const processedBlogs = useMemo(() => {
    return blogsData
      .map((blog) => {
        const translation = blog.translations[currentLanguage];
        if (!translation) return null;

        const { title, category } = translation;

        // Normalize category and currentCategory for comparison
        const normalizedCategory = category ? category.toLowerCase().replace(/\s+/g, '-') : '';
        const normalizedCurrentCategory = currentCategory ? currentCategory.toLowerCase() : '';

        // Generate slug if it doesn't exist
        if (!translation.slug && title) {
          translation.slug = createSlug(title);
        }

        // Extract first image if it doesn't exist
        if (!translation.image && translation.content) {
          translation.image = extractFirstImage(translation.content);
        }

        // Filter by search query
        const searchMatch = !search || (title && title.toLowerCase().includes(search.toLowerCase()));

        // Filter by category
        const categoryMatch = !currentCategory || normalizedCategory === normalizedCurrentCategory;

        // Exclude blogs that don't match search or category
        if (!searchMatch || !categoryMatch) return null;

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
      .filter((blog) => blog); // Remove null entries after filtering
  }, [blogsData, currentLanguage, search, currentCategory]);
  
  
 
  
  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="max-w-7xl container mx-auto px-4">
      <Head>
      <title>Learn More About Youtubers | YtubeTools</title>
  <meta name="description" content="Discover insights, tools, and information about YouTubers with YtubeTools. Learn more about popular creators, growth tips, and strategies to enhance your YouTube experience." />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index, follow" /> 

  {/* Canonical URL */}
  <link rel="canonical" href={metaUrl} />

  {/* Open Graph Meta Tags */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content={metaUrl} />
  <meta property="og:title" content="Learn More About Youtubers | YtubeTools" />
  <meta property="og:description" content="Discover insights and tools to learn more about popular YouTubers. Access exclusive resources to improve your YouTube knowledge and growth strategies with YtubeTools." />
  <meta property="og:image" content="https://ytubetools.com/static/images/youtubers-og-image.jpg" />
  <meta property="og:image:secure_url" content="https://ytubetools.com/static/images/youtubers-og-image.jpg" />
  <meta property="og:site_name" content="YtubeTools" />
  <meta property="og:locale" content="en_US" />

  {/* Twitter Meta Tags */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:domain" content="ytubetools.com" />
  <meta property="twitter:url" content={metaUrl} />
  <meta name="twitter:title" content="Learn More About Youtubers | YtubeTools" />
  <meta name="twitter:description" content="Explore YtubeTools for information on popular YouTubers, growth tips, and strategies to enhance your YouTube journey." />
  <meta name="twitter:image" content="https://ytubetools.com/static/images/youtubers-twitter-image.jpg" />
  <meta name="twitter:site" content="@ytubetools" />
  <meta name="twitter:image:alt" content="Learn More About Youtubers" />

        {/* Alternate hreflang Tags for SEO */}
        {hreflangs.map((hreflang, index) => (
          <link
            key={index}
            rel={hreflang.rel}
            hreflang={hreflang.hreflang}
            href={hreflang.href}
          />
        ))}
      </Head>

      {loading ? (
        <Skeleton count={5} />
      ) : (
        <>
          <div className="flex justify-center mb-6 mt-6">
            <div className="relative w-full max-w-lg">
            <input
            type="text"
            placeholder="Search by title"
            value={search}
            onChange={handleSearchChange}
            className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500 mb-3 md:mb-0"
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
            {processedBlogs.map((blog) => {
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

          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};



export async function getServerSideProps({ locale = 'en', req, query }) {
  const { page = 1, category = '' } = query;

  // Get the base URL from the request headers
  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  // Fetch the token securely (e.g., from cookies, environment variables)
  const token ='fc905a5a5ae08609ba38b046ecc8ef00';  // Replace with a secure way of managing the token

  if (!token) {
    throw new Error('No authorization token found');
  }

  try {
    // Make the API request to fetch data
    const { data } = await axios.get(`${baseUrl}/api/youtube`, {
      headers: {
        Authorization: `Bearer ${token}`,  // Add the Bearer token
      },
      params: { page, limit: 9, category },
    });

    // Construct the meta URL (to avoid duplication and ensure correct locale)
    const metaUrl = `${baseUrl}${req.url}`;

    return {
      props: {
        initialBlogs: data.data || [],  // Safely access `data`
        meta: data.meta || { currentPage: 1, totalPages: 0 },
        availableLanguages: ['en', 'es'],  // Add any other languages you want to support
        metaUrl,
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),  // Add translations
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialBlogs: [],
        meta: { currentPage: 1, totalPages: 0 },
        availableLanguages: [],  // If error occurs, return an empty languages array
        metaUrl: `${baseUrl}${req.url}`,
      },
    };
  }
}


export default BlogSection;
