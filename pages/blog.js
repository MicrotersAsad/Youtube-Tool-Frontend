import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ClipLoader } from 'react-spinners';
import { FaCalendar, FaSearch, FaUserCircle } from 'react-icons/fa';
import { i18n } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { format } from 'date-fns';
import PromoSection from '../components/BlogPromoSection';
import Head from 'next/head';
import oops from "../public/opps.png";
import Skeleton from 'react-loading-skeleton';
// Utility functions
const createSlug = (title) => {
  return title
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

const extractFirstImage = (content) => {
  const regex = /<img.*?src="(.*?)"/;
  const match = regex.exec(content);
  return match ? match[1] : null;
};

const getTitle = (translation) => translation.title || translation.Title || '';
const getContent = (translation) => translation.content || translation.Content || '';

const parseCategories = (category) => {
  return category ? category.split(',') : [];
};

const BlogSection = ({ initialBlogs = [],availableLanguages, metaUrl  }) => {
  const router = useRouter();
  const { category: selectedCategory } = router.query;
  const [loading, setLoading] = useState(!initialBlogs.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [blogsData, setBlogsData] = useState(initialBlogs);
  const [categories, setCategories] = useState([]);
  const blogsPerPage = 9;
  const currentLanguage = i18n.language || 'en'; // Default to English if no language is set
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(selectedCategory || '');
  const hreflangs = [
    { rel: "alternate", hreflang: "x-default", href: metaUrl }, // x-default for fallback
    ...availableLanguages.map((lang) => ({
      rel: "alternate",
      hreflang: lang,
      href: lang === 'en' ? metaUrl : `${metaUrl.replace(/\/$/, '')}/${lang}/youtube`,
    })),
  ];
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/categories');
      const filteredCategories = response.data.map(category => {
        const translation = category.translations[currentLanguage];
        return {
          ...category,
          name: translation ? translation.name : category.name,
          slug: translation ? translation.slug : category.slug
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
    return blogsData.map(blog => {
      const lang = blog.defaultLanguage || 'en';
      let translation = blog.translations[lang] || blog.translations['en'] || {};

      const title = getTitle(translation);
      if (!translation.slug && title) {
        translation.slug = createSlug(title);
      }

      const content = getContent(translation);
      if (!translation.image && content) {
        translation.image = extractFirstImage(content);
      }

      // Ensure _id and other essential fields are preserved
      return {
        _id: blog._id,  // Preserve the _id
        createdAt: blog.createdAt,  // Preserve other essential fields
        author: blog.author,
        ...blog, // Spread the rest of the blog object to include all other fields
        translations: {
          ...blog.translations,
          [lang]: translation, // Merge the language-specific translations
          [currentLanguage]: blog.translations[currentLanguage] || translation, // Use current language or fallback
        },
      };
    }).filter(blog => blog.translations[currentLanguage]);
  }, [blogsData, currentLanguage]);

  const latestBlogs = processedBlogs.slice(0, 4);

  const categoryBlogs = useMemo(() => {
    let blogs = processedBlogs.slice(0); 
    if (currentCategory) {
      blogs = blogs.filter(blog =>
        blog.translations[currentLanguage].category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') === currentCategory
      );
    }
    if (searchQuery) {
      blogs = blogs.filter(blog => getTitle(blog.translations[currentLanguage]).toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return blogs;
  }, [currentCategory, processedBlogs, currentLanguage, searchQuery]);

  const currentBlogs = useMemo(() => {
    return categoryBlogs.slice((currentPage - 1) * blogsPerPage, currentPage * blogsPerPage);
  }, [categoryBlogs, currentPage, blogsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(categoryBlogs.length / blogsPerPage);
  }, [categoryBlogs.length, blogsPerPage]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/blogs');
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

  const handleCategoryChange = (categorySlug) => {
    setCurrentCategory(categorySlug);
    setCurrentPage(1);
    router.push({
      pathname: router.pathname,
      query: { category: categorySlug },
    }, undefined, { shallow: true });
  };

  const createCategorySlug = (category) => {
    return category
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^\w-]+/g, ''); 
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);



  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  

  return (
    <div className=''>
      <Head>
        <title>Blog | YtubeTools</title>
        <meta name="description" content="Explore insightful articles on YtubeTools, where we dive into the world of YouTube creators, share growth strategies, review tools, and provide tips to enhance your YouTube journey. Stay updated and learn more about becoming a successful YouTuber." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" /> 
  
        {/* Canonical URL */}
        <link rel="canonical" href={metaUrl} />
  
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={metaUrl} />
        <meta property="og:title" content="Blog | YtubeTools" />
        <meta property="og:description" content="Explore insightful articles on YtubeTools, where we dive into the world of YouTube creators, share growth strategies, review tools, and provide tips to enhance your YouTube journey. Stay updated and learn more about becoming a successful YouTuber." />
        <meta property="og:image" content="https://ytubetools.com/static/images/youtubers-og-image.jpg" />
        <meta property="og:image:secure_url" content="https://ytubetools.com/static/images/youtubers-og-image.jpg" />
        <meta property="og:site_name" content="YtubeTools" />
        <meta property="og:locale" content="en_US" />
  
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:domain" content="ytubetools.com" />
        <meta property="twitter:url" content={metaUrl} />
        <meta name="twitter:title" content="Blog | YtubeTools" />
        <meta name="twitter:description" content="Explore insightful articles on YtubeTools, where we dive into the world of YouTube creators, share growth strategies, review tools, and provide tips to enhance your YouTube journey. Stay updated and learn more about becoming a successful YouTuber." />
        <meta name="twitter:image" content="https://ytubetools.com/static/images/youtubers-twitter-image.jpg" />
        <meta name="twitter:site" content="@ytubetools" />
        <meta name="twitter:image:alt" content="Blog" />
  
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
  
      {/* Conditional Rendering: Display message if no blogs are available */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-white shadow-md rounded-lg p-4">
              <Skeleton height={180} className="mb-4" />
              <Skeleton height={20} width="60%" className="mb-2" />
              <Skeleton height={15} width="80%" className="mb-2" />
              <Skeleton height={15} width="40%" />
            </div>
          ))}
        </div>
      ) : processedBlogs.length === 0 ? (
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
          <PromoSection />
  
          <div className="max-w-7xl container">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-8">
              <div className="col-span-12">
                <h2 className="text-2xl text-blue-900 font-bold mb-2">Latest Blog</h2>
              </div>
  
              {/* Latest Blogs */}
              <div className="col-span-12 md:col-span-5">
                {latestBlogs.slice(0, 1).map((blog, index) => {
                  const content = blog.translations[currentLanguage];
                  return (
                    <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden relative">
                      {content?.image && (
                        <div className="w-full" style={{ height: '260px'}}>
                          <Image
                            src={content.image}
                            alt={content.title}
                            width={400}
                            height={260}
                            className='blog-img'
                            quality={50} // Image quality reduced
                          />
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                            <span className="mr-2">{content?.category || content._id}</span>
                          </div>
                        </div>
                      )}
                      <div className="border-t ps-3 pe-3 pt-3 d-flex">
                        <p className="text-sm text-gray-500">
                          <FaUserCircle className="text-center fs-6 text-red-400 inline" /> {blog.author}
                        </p>
                        <p className="text-sm text-gray-500 ms-auto">
                          <FaCalendar className="text-center text-red-400 inline" />
                          {format(new Date(blog.createdAt), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="pe-3 ps-3 pt-2">
                        <h6 className="text-lg font-semibold">
                          <Link href={`/blog/${content.slug}`} passHref>
                            <span className="text-blue-500 text-xl font-bold hover:underline">{content.title}</span>
                          </Link>
                        </h6>
                        <p className="text-gray-600 mb-4">{content.description || content.Description}</p>
                        <Link href={`/blog/${content.slug}`} passHref>
                          <span className="text-red-500 mt-4 block">Read More →</span>
                        </Link>
                        <div className="mt-2">
                          {parseCategories(blog.category).map((category, i) => (
                            <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
  
              {/* Other Blog Cards */}
              <div className="col-span-12 md:col-span-7 space-y-4">
                {latestBlogs.slice(1, 4).map((blog, index) => {
                  const content = blog.translations[currentLanguage];
                  return (
                    <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row relative">
                      {content?.image && (
                        <div className="w-full md:w-5/12" style={{ height: '165px', position: 'relative' }}>
                          <Image
                            src={content.image}
                            alt={content.title}
                            layout="fill"
                            objectFit="cover"
                            className="rounded"
                            quality={50} // Image quality reduced
                          />
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                            <span className="mr-2">{content?.category || content._id}</span>
                          </div>
                        </div>
                      )}
                      <div className="ps-2 pt-2 flex-1 md:w-7/12">
                        <h6 className="text-lg font-semibold">
                          <Link href={`/blog/${content.slug}`} passHref>
                            <span className="text-blue-500 text-xl font-bold hover:underline">{content.title}</span>
                          </Link>
                        </h6>
                        <Link href={`/blog/${content.slug}`} passHref>
                          <span className="text-red-500 mt-4 block">Read More →</span>
                        </Link>
                        <div className="border-t ps-2 pe-2 pt-2 d-flex">
                          <p className="text-sm text-gray-500">
                            <FaUserCircle className="text-center fs-6 text-red-400 inline" /> {blog.author}
                          </p>
                          <p className="text-sm text-gray-500 ms-auto">
                            <FaCalendar className="text-center text-red-400 inline" />
                            {format(new Date(blog.createdAt), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
  
            {/* Additional UI Elements */}
            <div className="flex justify-center mt-8">
              {totalPages > 1 && (
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
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}  

export async function getServerSideProps({ locale, req }) {
  try {
    // Determine protocol and host to build the base URL
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Construct the active URL based on locale and request URL
    // Exclude 'en' from the URL path to avoid "/en" in the meta URL
    const metaUrl = locale === 'en' ? `${baseUrl}${req.url}` : `${baseUrl}/${locale}${req.url}`;

    // Fetch blog data from API
    const apiUrl = `${baseUrl}/api/blogs`;
    const { data } = await axios.get(apiUrl);

    // Sort blogs by creation date
    const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Determine available languages for blogs
    const availableLanguages = Array.from(
      new Set(
        sortedData.flatMap((blog) => Object.keys(blog.translations || {}))
      )
    );

    return {
      props: {
        initialBlogs: sortedData,
        availableLanguages, // Pass available languages as prop
        metaUrl, // Pass the active URL as metaUrl
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    return {
      props: {
        initialBlogs: [],
        availableLanguages: [],
        metaUrl: locale === 'en' ? `${protocol}://${host}${req.url}` : `${protocol}://${host}/${locale}${req.url}`, // Fallback meta URL
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),
      },
    };
  }
}
export default BlogSection;
