import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { ClipLoader } from "react-spinners";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Comments from "../../components/Comments";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { ReplaceShortcodes } from "../../components/replaceShortcodes";
import { FaCheckCircle, FaClock, FaTimes } from "react-icons/fa";

const BlogPost = ({
  initialBlog,
  authorData,
  initialShortcodes,
  hreflangs,
  metaTitle,
  metaDescription,
  metaImage
}) => {

  const { t } = useTranslation("blog");
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;

  const [blog] = useState(initialBlog);
  const [author] = useState(authorData?.author);
  const [shortcodes] = useState(initialShortcodes || []);
  const [relatedBlogs, setRelatedBlogs] = useState([]); // State for related blogs
  const [loadingRelatedBlogs, setLoadingRelatedBlogs] = useState(true); // Loading state for related blogs

  const [schemaData, setSchemaData] = useState(null);
  const [breadcrumbSchema, setBreadcrumbSchema] = useState(null);

  const translation = blog?.translations?.[locale];
  const content = translation?.content || t("Content not available.");
  const categoryName = translation?.category || t("Blog");

  // Define or import getTitle function
  const getTitle = (translation) => {
    return translation.title || "Default Title";
  };

  useEffect(() => {
    const titleElement = document.querySelector("title");
  
    // Remove class attribute if present
    if (titleElement) {
      titleElement.removeAttribute("class");
    }
  }, []);

  useEffect(() => {
    const fetchRelatedBlogs = async () => {
      try {
        // Set up the initial page and limit for the request
        const page = 1; // Start from page 1
        const limit = 600; // Fetch 600 blogs at a time

        // Get the token from secure places
        const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Example token
        if (!token) {
          throw new Error('Authorization token not found');
        }

        // Make the API request with the Authorization header
        const response = await fetch(`/api/youtube?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Add the token in the Authorization header
            'Content-Type': 'application/json', // Ensure content type is JSON
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data.data)) {
          const allBlogs = data.data;

          // Filter out the current blog and match the category of related blogs
          const filteredBlogs = allBlogs.filter(
            (b) =>
              b._id !== blog._id &&
              Object.values(b.translations || {}).some(
                (translation) =>
                  translation.category === blog.translations[locale]?.category
              )
          );

          setRelatedBlogs(filteredBlogs);
      
        } else {
          console.error("Blogs data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching related blogs:", error.message);
      } finally {
        setLoadingRelatedBlogs(false);
      }
    };

    if (blog) {
      fetchRelatedBlogs();
    }
  }, [blog, locale]);

  // Define breadcrumb data
  const breadcrumbItems = [
    { label: t("Home"), link: "/" },
    { label: "Youtube", link: `/youtube` }, // Adjust the link as per your routing
    { label: translation?.title }
  ];

  useEffect(() => {
    if (blog && blog.translations) {
      const translation = blog.translations[locale] || {};
      const title = getTitle(translation);
      const description = translation.description || translation.Description || '';
      const image = translation.image || "https://example.com/photos/1x1/photo.jpg";

      if (content) {
        const schemaDataObj = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "image": [image],
          "datePublished": blog.createdAt,
          "dateModified": blog.updatedAt || blog.createdAt,
          "author": {
            "@type": "Person",
            "name": blog.author
          },
          "publisher": {
            "@type": "Organization",
            "name": "ytubetools",
            "logo": {
              "@type": "ImageObject",
              "url": "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733391907509-yticon.png"
            }
          },
          "description": description,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/blog/${slug}`
          }
        };

        const breadcrumbSchemaObj = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.ytubetools.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Youtube",
              "item": `https://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/youtube`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": title,
              "item": `https://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/blog/${slug}`
            }
          ]
        };

        setSchemaData(schemaDataObj);
        setBreadcrumbSchema(breadcrumbSchemaObj);
      }
    }
  }, [blog, locale, slug, content, categoryName]);

  if (!translation) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{t("No content available for this language.")}</p>
      </div>
    );
  }

  const metaUrl = `https://${router.host || "localhost:3000"}/youtube/${slug}`;

  const publicationDate = blog?.createdAt
    ? format(new Date(blog.createdAt), "MMMM dd, yyyy")
    : "";

  const renderContentWithShortcodes = () => {
    return <ReplaceShortcodes content={content} shortcodes={shortcodes} />;
  };

  return (
    <div className="relative">
      <Head>
        <title>{metaTitle}</title> {/* No class needed */}
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />

        {/* Canonical URL */}
        <link rel="canonical" href={metaUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content={metaUrl} />
        <meta property="og:site_name" content="ytubetools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta property="twitter:url" content={metaUrl} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImage} />
        <meta name="author" content={author?.name || "ytubetools"} />
        <meta property="article:published_time" content={blog?.createdAt || ""} />
        <meta property="article:author" content={author?.name || ""} />
        <meta property="article:section" content={categoryName} />
        <meta property="article:tag" content={categoryName} />

        {/* Alternate hreflang Tags for SEO */}
        {hreflangs.map((hreflang, index) => (
          <link key={index} rel={hreflang.rel} hreflang={hreflang.hreflang} href={hreflang.href} />
        ))}

        {/* Inject Schema.org Article JSON-LD */}
        {schemaData && (
          <script type="application/ld+json">
            {JSON.stringify(schemaData)}
          </script>
        )}

        {/* Inject BreadcrumbList JSON-LD */}
        {breadcrumbSchema && (
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        )}
      </Head>

      {/* Breadcrumb Navigation */}
      
        <ol className="flex mt-5 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-x-2">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {item.link ? (
                <a href={item.link} className="text-blue-600 hover:underline">
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-500">{item.label}</span>
              )}
              {index < breadcrumbItems.length - 1 && (
                <svg
                  className="h-5 w-5 mx-2 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Blog Title and Description */}
        <h1 className="md:text-5xl text-xl font-bold mb-2">{translation.title}</h1>
        <p className="text-gray-600 mb-4">{translation.description}</p>
        <h6 className="flex items-center text-gray-600 mb-4">
          <FaClock className="text-[#f00] me-2" /> {t("Updated on")} {publicationDate}
        </h6>

        <div className="overflow-hidden sm:rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <div className="my-4 result-content">
              {renderContentWithShortcodes()}
            </div>

            {/* Related Blogs Section */}
            <div className="my-8">
              <h2 className="text-2xl font-bold mb-4">
                {t("Other Countries Highest Earning Youtubers")}
              </h2>
              {loadingRelatedBlogs ? (
                <div className="flex justify-center items-center h-24">
                  <ClipLoader size={30} color={"#123abc"} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                  {relatedBlogs.length > 0 ? (
                    relatedBlogs.slice(0, 30).map((relatedBlog, index) => {
                      const relatedTranslation = relatedBlog.translations[locale];
                      if (!relatedTranslation) return null;

                      return (
                        <div key={index}>
                          <a
                            href={`/youtube/${relatedTranslation.slug}`}
                            className="flex items-center space-x-3"
                          >
                            <FaCheckCircle className="text-green-600 text-lg mb-2" />
                            <h5 className="text-lg font-semibold text-blue-600 hover:underline truncate">
                              {relatedTranslation.title}
                            </h5>
                          </a>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500">{t("No related blogs found.")}</p>
                  )}
                </div>
              )}
            </div>

            <Comments slug={slug} />
          </div>
        </div>
      </div>
      <style >{`
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

    if (!slug) {
      console.error("Slug is missing in params.");
      return { notFound: true };
    }

    const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/youtube`;

    // Retrieve the token securely (from cookies or headers)
    const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Example token  // You can change this to suit where you store the token
    if (!token) {
      console.error("Authorization token is missing.");
      return { notFound: true };
    }

    // Fetch YouTube data from the API with the Authorization header
    const { data } = await axios.get(`${apiUrl}?slug=${slug.trim().toLowerCase()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if data was found
    if (!data || data.length === 0) {
      console.error("Blog not found for slug:", slug);
      return { notFound: true };
    }

    const blog = data;

    const currentTranslation =
      blog.translations[locale] || blog.translations[blog.defaultLanguage];
      
      
    if (!currentTranslation) {
      console.error(`Translation for locale "${locale}" not found.`);
      return { notFound: true };
    }

    const currentSlug = currentTranslation.slug;
    if (currentSlug.trim().toLowerCase() !== slug.trim().toLowerCase()) {
  
      return {
        redirect: {
          destination: `/youtube/${currentSlug}`,
          permanent: false,
        },
      };
    }

    // Define meta URL
    const metaUrl = `${protocol}://${host}/${locale === "en" ? "" : `${locale}/`}youtube/${slug}`;

    // Define available languages for hreflang tags
    const availableLanguages = Object.keys(blog.translations);

    // Construct hreflang tags
    const hreflangs = [
      { rel: "alternate", hreflang: "x-default", href: metaUrl },
      ...availableLanguages.map((lang) => ({
        rel: "alternate",
        hreflang: lang,
        href: lang === "en" ? metaUrl : `${protocol}://${host}/${lang}/youtube/${slug}`,
      })),
    ];

    // Fetch shortcodes (if any)
    const shortcodesResponse = await axios.get(`${protocol}://${host}/api/shortcodes-tools`);
    const initialShortcodes = shortcodesResponse.data;

    // Prepare the meta information
    const metaTitle = currentTranslation.metaTitle || 'Default Blog Title';
 
    const metaDescription = currentTranslation.metaDescription || 'This is a brief description of the blog content. Customize it for SEO purposes.';
    const metaImage = currentTranslation.image || 'https://yourdomain.com/default-image.jpg'; // Add a fallback image URL if no image is found.

    return {
      props: {
        initialBlog: blog,
        initialShortcodes,
        metaUrl,
        hreflangs,
        metaTitle,        // Pass meta title to component
        metaDescription,  // Pass meta description to component
        metaImage,        // Pass meta image to component
        ...(await serverSideTranslations(locale, ["blog", "navbar", "footer"])),
      },
    };
  } catch (error) {
    console.error("Error fetching youtube or authors:", error.message);
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
