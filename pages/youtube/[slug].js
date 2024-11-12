// BlogPost.jsx
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { ClipLoader } from "react-spinners";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Comments from "../../components/Comments";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { ReplaceShortcodes } from "../../components/replaceShortcodes";
import { FaCheckCircle } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const getImage = (translation) => translation.image || "";
const getTitle = (translation) => translation.title || "Untitled Post";
const getDescription = (translation) =>
  translation.description || "Description not available.";
const getMetaTitle = (translation) => translation.metaTitle || "Blog Post";
const getMetaDescription = (translation) => translation.metaDescription || "";
const getContent = (translation) =>
  translation.content || "Content not available in this language.";

const BlogPost = ({
  initialBlog,
  authorData,
  relatedBlogs,
  initialShortcodes,
  availableLanguages,
}) => {
  const { t } = useTranslation("blog");
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;

  const [blog, setBlog] = useState(initialBlog);
  const [author, setAuthor] = useState(authorData?.author);
  const [loading, setLoading] = useState(!initialBlog);
  const [shortcodes, setShortcodes] = useState(initialShortcodes || []);

  const translation = blog?.translations ? blog.translations[locale] : null;

  if (!translation) {
    return (
      <p className="text-red-500">
        {t("No content available for this language.")}
      </p>
    );
  }

  const content = getContent(translation);
  const contentWithShortcodes = (
    <ReplaceShortcodes content={content} shortcodes={shortcodes} />
  );

  const categoryName = translation.category || "Blog";
  const publicationDate = blog?.createdAt
    ? format(new Date(blog.createdAt), "MMMM dd, yyyy")
    : "";
  const metaUrl = `https://${
    typeof window !== "undefined" ? window.location.host : "localhost:3000"
  }/youtube/${slug}`;

  // Generate hreflang URLs
  const hreflangs = availableLanguages.map((lang) => ({
    rel: "alternate",
    hreflang: lang,
    href: lang === "en" ? metaUrl : `${metaUrl.replace(/\/$/, "")}/${lang}`,
  }));


  return (
    <div className="relative">
      <Head>
        <title>{getMetaTitle(translation)}</title>
        <meta name="description" content={getMetaDescription(translation)} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />

        {/* Canonical URL */}
        <link rel="canonical" href={metaUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={getMetaTitle(translation)} />
        <meta property="og:description" content={getMetaDescription(translation)} />
        <meta property="og:image" content={getImage(translation)} />
        <meta property="og:url" content={metaUrl} />
        <meta property="og:site_name" content="ytubetools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getMetaTitle(translation)} />
        <meta name="twitter:domain" content="ytubetools.com" />
        <meta property="twitter:url" content={metaUrl} />
        <meta name="twitter:description" content={getMetaDescription(translation)} />
        <meta name="twitter:image" content={getImage(translation)} />
        <meta name="author" content={author?.name || "ytubetools"} />
        <meta property="article:published_time" content={blog?.createdAt || ""} />
        <meta property="article:author" content={author?.name || ""} />
        <meta property="article:section" content={categoryName} />
        <meta property="article:tag" content={categoryName} />

        {/* Alternate hreflang Tags for SEO */}
        {hreflangs.map((hreflang, index) => (
          <link key={index} rel={hreflang.rel} hreflang={hreflang.hreflang} href={hreflang.href} />
        ))}
      </Head>

      {/* Render loading or error state if applicable */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <ClipLoader size={50} color={"#123abc"} loading={loading} />
        </div>
      ) : !blog ? (
        <p className="text-red-500">{t("No content available for this language.")}</p>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
          <h1 className="md:text-5xl text-xl font-bold mb-2">
            {getTitle(translation)}
          </h1>
          <p className="text-gray-600 mb-4">
            {getDescription(translation)}
          </p>
          <h6>{t("Updated on")} {publicationDate}</h6>

          <div className="overflow-hidden sm:rounded-lg mb-8">
            <div className="border-b border-gray-200">
              <div className="my-4 result-content">
                {contentWithShortcodes}
              </div>

              <div className="my-8">
                <h2 className="text-2xl font-bold mb-4">
                  {t("Other Countries Highest Earning Youtubers")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {relatedBlogs.map((relatedBlog, index) => {
                    const relatedTranslation = relatedBlog.translations[locale];
                    if (!relatedTranslation) return null; // Skip if translation is missing

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
      )}
        <style jsx global>{`
          .result-content h2 {
            padding-top: 12px !important;
          }
          .result-content p {
            padding-top: 12px !important;
            padding-bottom: 12px !important;
          }
          .result-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 20px 0 !important;
            font-size: 1rem !important;
          }
          .result-content table th,
          .result-content table td {
            border: 1px solid #ddd !important;
            padding: 12px 15px !important;
          }
          .result-content table th {
            background-color: #f4f4f4 !important;
            font-weight: bold !important;
          }
          .result-content table tr:nth-child(even) {
            background-color: #f9f9f9 !important;
          }
          .result-content table tr:hover {
            background-color: #f1f1f1 !important;
          }
          .result-content table td {
            word-wrap: break-word !important;
            max-width: 450px !important;
          }
          @media (max-width: 768px) {
            .result-content table,
            .result-content table tr,
            .result-content table th,
            .result-content table td {
              display: block;
              width: 100% !important;
              box-sizing: border-box;
              padding-left: 30px;
            }
            .result-content table tr {
              margin-bottom: 10px;
              border: 1px solid #ddd;
              padding: 10px;
              background-color: #f9f9f9;
            }
            .result-content table th,
            .result-content table td {
              text-align: left;
            }
            .result-content table td::before {
              content: attr(data-label);
              font-weight: bold;
              color: #333;
              margin-right: 5px;
              display: inline-block;
              width: 45%;
            }
          }
        `}</style>
      </div>
    
  );
};


export async function getServerSideProps({ locale, params, req }) {
  try {
    const { slug } = params;
    const protocol =
      req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/youtube`;

    const { data } = await axios.get(apiUrl);
    const blogs = data;

    const blog = blogs.find((blog) =>
      Object.values(blog.translations).some(
        (translation) => translation.slug === slug
      )
    );

    if (!blog || !blog.translations[locale]) {
      return { notFound: true };
    }

    // Determine available languages from translations
    const availableLanguages = Object.keys(blog.translations);

    const authorResponse = await axios.get(`${protocol}://${host}/api/authors`);
    const authors = authorResponse.data;
    const author = authors.find((author) => author.name === blog.author);

    const categoryBlogs = blogs.filter(
      (b) =>
        b !== blog &&
        Object.values(b.translations).some(
          (translation) =>
            translation.category === blog.translations[locale]?.category
        )
    );

    const shortcodesResponse = await axios.get(
      `${protocol}://${host}/api/shortcodes-tools`
    );
    const initialShortcodes = shortcodesResponse.data;

    return {
      props: {
        initialBlog: blog,
        authorData: { author: author || null },
        relatedBlogs: categoryBlogs,
        initialShortcodes,
        availableLanguages, // Pass available languages
        ...(await serverSideTranslations(locale, ["blog", "navbar", "footer"])),
      },
    };
  } catch (error) {
    console.error("Error fetching blogs or authors:", error.message);
    return { notFound: true };
  }
}

export default BlogPost;
