// BlogPost.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { ClipLoader } from "react-spinners";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Comments from "../../components/Comments";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { ReplaceShortcodes } from "../../components/replaceShortcodes";
import { FaCheckCircle, FaFacebook, FaLinkedin, FaTwitter } from "react-icons/fa";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';

const getImage = (translation) => translation.image || "";
const getTitle = (translation) => translation.title || "";
const getDescription = (translation) => translation.description || "";
const getMetaTitle = (translation) => translation.metaTitle || "";
const getMetaDescription = (translation) => translation.metaDescription || "";
const getContent = (translation) => translation.content || "";

const BlogPost = ({ initialBlog, authorData, relatedBlogs, initialShortcodes }) => {
  const { t } = useTranslation("blog");
  const router = useRouter();
  const { slug } = router.query;
  const { locale, defaultLocale, push } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [author, setAuthor] = useState(authorData?.author);
  const [loading, setLoading] = useState(!initialBlog);
  const [shortcodes, setShortcodes] = useState(initialShortcodes || []);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/youtube`;
          const { data } = await axios.get(apiUrl);
          const blogs = data;

          const blog = blogs.find((blog) =>
            Object.values(blog.translations).some((translation) => translation.slug === slug)
          );

          if (blog) {
            setBlog(blog);
            const authorResponse = await axios.get(`/api/authors?name=${blog.author}`);
            if (authorResponse.data.length > 0) {
              setAuthor(authorResponse.data[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching blogs:", error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [slug, initialBlog]);

  // Get translation for the current locale, falling back to English if needed
  const translation =
    blog?.translations?.[locale] || blog?.translations?.["en"] || {}; // Fall back to English
  const content = getContent(translation);

  // Show fallback message if no content is available in the selected language or English
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{t("Sorry, this language is not available.")}</p>
        <button
          onClick={() => push("/", "/", { locale: defaultLocale })}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {t("Go to homepage")}
        </button>
      </div>
    );
  }

  const contentWithShortcodes = (
    <ReplaceShortcodes content={content} shortcodes={shortcodes} />
  );

  const categoryName = translation.category || "Blog";
  const publicationDate = blog?.createdAt ? format(new Date(blog.createdAt), "MMMM dd, yyyy") : "";

  return (
    <div className="relative">
      <Head>
        <title>{getMetaTitle(translation)}</title>
        <meta name="description" content={getMetaDescription(translation) || ""} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={getMetaTitle(translation)} />
        <meta property="og:description" content={getMetaDescription(translation)} />
        <meta property="og:image" content={getImage(translation)} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/youtube/${slug}`} />
        <meta property="og:site_name" content="ytubetools" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getMetaTitle(translation)} />
        <meta name="twitter:description" content={getMetaDescription(translation)} />
        <meta name="twitter:image" content={getImage(translation)} />
        
        {/* Author and Article-specific metadata */}
        <meta name="author" content={author?.name || "ytubetools"} />
        <meta property="article:published_time" content={blog?.createdAt || ""} />
        <meta property="article:author" content={author?.name || ""} />
        <meta property="article:section" content={categoryName} />
        <meta property="article:tag" content={categoryName} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-grow order-1 lg:order-2">
            <h1 className="md:text-5xl text-xl font-bold mb-2">
              {loading ? <Skeleton width={300} /> : getTitle(translation)}
            </h1>
            <p className="text-gray-600 mb-4">
              {loading ? <Skeleton count={2} /> : getDescription(translation)}
            </p>
            <h6>{t('Updated on')} {publicationDate || <Skeleton width={100} />}</h6>

            <div className="overflow-hidden sm:rounded-lg mb-8">
              <div className="border-b border-gray-200">
                <div className="my-4 result-content">
                  {loading ? <Skeleton count={10} /> : contentWithShortcodes}
                </div>

                <div className="my-8">
                  <h2 className="text-2xl font-bold mb-4">{t("Other Countries Highest Earning Youtubers")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3">
                    {loading
                      ? Array(3).fill(0).map((_, i) => (
                          <Skeleton key={i} width="100%" height={20} />
                        ))
                      : relatedBlogs.map((relatedBlog, index) => {
                          const relatedTranslation = relatedBlog.translations[locale] || {};
                          return (
                            <div key={index}>
                              <a href={`/youtube/${relatedTranslation.slug}`} className="flex items-center space-x-3">
                                <FaCheckCircle className="text-green-600 text-lg mb-2" />
                                <h5 className="text-lg font-semibold text-blue-600 hover:underline truncate whitespace-nowrap overflow-hidden">
                                  {getTitle(relatedTranslation)}
                                </h5>
                              </a>
                            </div>
                          );
                        })}
                  </div>
                </div>

                <Comments slug={slug} />
              </div>
            </div>
          </div>
        </div>
        <style jsx global>{`
          .result-content h2 {
            padding-top: 12px !important;
          }
          .result-content p {
            padding-top: 12px !important;
            padding-bottom: 12px !important;
          }
          /* Additional styles for responsive table */
          /* ...existing styles... */
        `}</style>
      </div>
    </div>
  );
};

export async function getServerSideProps({ locale, params, req }) {
  try {
    const { slug } = params;
    const protocol = req.headers["x-forwarded-proto"] || "https"; // Use https as default in production
    const host = req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/youtube`;

    // Fetch all blogs
    const { data } = await axios.get(apiUrl);
    const blogs = data;

    // Find the blog with the specified slug and locale
    const blog = blogs.find(
      (blog) =>
        blog.translations[locale] && blog.translations[locale].slug === slug
    );

    if (!blog) {
      return { notFound: true };
    }

    // Fetch authors and find the author of the blog
    const authorResponse = await axios.get(`${protocol}://${host}/api/authors`);
    const authors = authorResponse.data;
    const author = authors.find((author) => author.name === blog.author);

    // Find related blogs in the same category
    const categoryBlogs = blogs.filter(
      (b) =>
        b !== blog &&
        b.translations[locale] &&
        b.translations[locale].category === blog.translations[locale].category
    );

    // Fetch shortcodes
    const shortcodesResponse = await axios.get(`${protocol}://${host}/api/shortcodes-tools`);
    const initialShortcodes = shortcodesResponse.data;

    return {
      props: {
        initialBlog: blog,
        authorData: { author: author || null },
        relatedBlogs: categoryBlogs,
        initialShortcodes,
        ...(await serverSideTranslations(locale, ["blog", "navbar", "footer"])),
      },
    };
  } catch (error) {
    console.error("Error fetching blogs or authors:", error.message);
    return { notFound: true };
  }
}





export default BlogPost;
