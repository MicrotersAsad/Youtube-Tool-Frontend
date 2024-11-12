import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { ClipLoader } from "react-spinners";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Breadcrumb from "../Breadcrumb";
import Comments from "../../components/Comments";
import { useToc } from "../../hook/useToc";
import TableOfContents from "../../components/TableOfContents";
import ReactDOMServer from "react-dom/server";
import { format } from "date-fns";
import AuthorInfo from "../../components/AuthorCard";
import { useTranslation } from "react-i18next";
import { ReplaceShortcodes } from "../../components/replaceShortcodes";
import { FaFacebook, FaLinkedin, FaTwitter } from "react-icons/fa";
import Image from "next/image";

const getTitle = (translation) => translation.title || translation.Title || "";
const getDescription = (translation) => translation.description || translation.Description || "";
const getMetaTitle = (translation) => translation.metaTitle || translation.MetaTitle || "";
const getMetaDescription = (translation) => translation.metaDescription || translation.MetaDescription || "";
const getContent = (translation) => translation.content || translation.Content || "";

const insertTocBeforeFirstHeading = (content, tocHtml) => {
  const firstHeadingIndex = content.search(/<h[1-6][^>]*>/);
  if (firstHeadingIndex === -1) return content;
  const beforeFirstHeading = content.slice(0, firstHeadingIndex);
  const afterFirstHeading = content.slice(firstHeadingIndex);
  return `${beforeFirstHeading}${tocHtml}${afterFirstHeading}`;
};

const BlogPost = ({ initialBlog, authorData, relatedBlogs, initialShortcodes, metaUrl, hreflangs }) => {
  const { t } = useTranslation("blog");
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [author, setAuthor] = useState(authorData?.author);
  const [loading, setLoading] = useState(!initialBlog);
  const [shortcodes, setShortcodes] = useState(initialShortcodes || []);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/blogs`;
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

  const translation = blog?.translations ? blog.translations[locale] || {} : {};
  const content = getContent(translation);
  const [toc, updatedContent] = useToc(content);
  const tocHtml = toc ? ReactDOMServer.renderToStaticMarkup(<TableOfContents headings={toc} />) : "";
  const contentWithToc = insertTocBeforeFirstHeading(updatedContent, tocHtml);

  const contentWithShortcodes = (
    <ReplaceShortcodes content={contentWithToc} shortcodes={shortcodes} />
  );

  const categoryName = translation.category || "Blog";
  const publicationDate = blog?.createdAt ? format(new Date(blog.createdAt), "MMMM dd, yyyy") : "";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!blog) {
    return <p className="text-red-500">{t("No content available for this language.")}</p>;
  }

  return (
    <div className="relative">
      <Head>
        <title>{getMetaTitle(translation)} | YtubeTools</title>
        <meta name="description" content={getMetaDescription(translation) || ""} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={metaUrl} />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={metaUrl} />
        <meta property="og:title" content={getMetaTitle(translation)} />
        <meta property="og:description" content={getMetaDescription(translation)} />
        <meta property="og:image" content={translation.image || "/default-image.jpg"} />
        <meta property="og:site_name" content="YtubeTools" />
        <meta property="og:locale" content={locale} />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ytubetools" />
        <meta name="twitter:title" content={getMetaTitle(translation)} />
        <meta name="twitter:description" content={getMetaDescription(translation)} />
        <meta name="twitter:image" content={translation.image || "/default-image.jpg"} />
        
        {/* hreflang Links */}
        {hreflangs.map((hreflang, index) => (
          <link key={index} rel={hreflang.rel} hreflang={hreflang.hreflang} href={hreflang.href} />
        ))}
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-grow order-1 lg:order-2">
            <h1 className="md:text-5xl text-xl font-bold mb-2">{getTitle(translation)}</h1>
            <p className="text-gray-600 mb-4">{getDescription(translation)}</p>
            <h6>{t('Updated on')} {publicationDate}</h6>
            <AuthorInfo data={authorData} />

            <div className=" overflow-hidden sm:rounded-lg mb-8">
              <div className="border-b border-gray-200">
                <div className="my-4 result-content">{contentWithShortcodes}</div>

                {/* Author Information */}
                <div className="p-6 mb-3 bg-blue-50 md:w-full rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold mb-4">{t('About The Author')}</h2>
                  <hr />
                  <div className="flex items-center">
                    <img 
                      src={author?.image} 
                      alt={author?.name ? `Profile picture of ${author.name}` : 'Author image'} 
                      className="w-40 h-40 rounded-full mr-4" 
                    />
                    <div>
                      <h3 className="text-xl font-bold pt-3">{author?.name}</h3>
                      <p className="text-gray-700">{author?.bio}</p>
                      <div className="flex mt-2 space-x-4">
                        {author?.socialLinks?.facebook && (
                          <a href={author.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                            <FaFacebook size={24} />
                          </a>
                        )}
                        {author?.socialLinks?.twitter && (
                          <a href={author.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                            <FaTwitter size={24} />
                          </a>
                        )}
                        {author?.socialLinks?.linkedin && (
                          <a href={author.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                            <FaLinkedin size={24} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Blogs Section */}
                {relatedBlogs?.length > 0 && (
                  <div className="my-8">
                    <h2 className="text-2xl font-bold mb-4">{t('Related Blogs')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                      {relatedBlogs.map((relatedBlog, index) => {
                        const relatedTranslation = relatedBlog.translations[locale];
                        if (!relatedTranslation) return null;
                        return (
                          <div key={index} className="bg-gray-100 rounded-lg shadow hover:shadow-md transition-shadow">
                            <div className="h-[270px] rounded">
                              <Image
                                src={relatedTranslation?.image || '/placeholder.jpg'}
                                alt={relatedTranslation?.title || 'Related blog image'}
                                width={400}
                                height={270}
                                className="blog-img rounded"
                                quality={50}
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="text-xl font-semibold mb-2">
                                <a href={`/blog/${relatedTranslation.slug}`} className="text-blue-600 hover:underline">
                                  {relatedTranslation.title}
                                </a>
                              </h3>
                              <p className="text-gray-600 mb-2">{relatedTranslation.description?.substring(0, 100)}...</p>
                              <a href={`/blog/${relatedTranslation.slug}`} className="text-blue-500 hover:underline">
                                {t("Read More")}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <Comments slug={slug} />
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .result-content h2 { padding-top: 12px; }
          .result-content p { padding-top: 12px; padding-bottom: 12px; }
          .result-content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem; }
          .result-content table th, .result-content table td { border: 1px solid #ddd; padding: 12px 15px; }
          .result-content table th { background-color: #f4f4f4; font-weight: bold; }
          .result-content table tr:nth-child(even) { background-color: #f9f9f9; }
          .result-content table tr:hover { background-color: #f1f1f1; }
          .result-content table td { word-wrap: break-word; max-width: 300px; }
        `}</style>
      </div>
    </div>
  );
};


export async function getServerSideProps({ locale, params, req }) {
  try {
    const { slug } = params;
    const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/blogs`;

    const { data } = await axios.get(apiUrl);
    const blogs = data;

    const blog = blogs.find((blog) =>
      Object.values(blog.translations).some((translation) => translation.slug === slug)
    );

    if (!blog) {
      return {
        notFound: true,
      };
    }

    const currentTranslation = blog.translations[locale];
    if (!currentTranslation) {
      return {
        notFound: true,
      };
    }

    const currentSlug = currentTranslation.slug;
    if (currentSlug !== slug) {
      return {
        redirect: {
          destination: `/blog/${currentSlug}`,
          permanent: false,
        },
      };
    }

    // Define meta URL
    const metaUrl = `${protocol}://${host}/${locale === "en" ? "" : `${locale}/`}blog/${slug}`;

    // Define available languages for hreflang tags
    const availableLanguages = Object.keys(blog.translations);

    // Construct hreflang tags
    const hreflangs = [
      { rel: "alternate", hreflang: "x-default", href: metaUrl },
      ...availableLanguages.map((lang) => ({
        rel: "alternate",
        hreflang: lang,
        href: lang === "en" ? metaUrl : `${protocol}://${host}/${lang}/blog/${slug}`,
      })),
    ];

    const authorResponse = await axios.get(`${protocol}://${host}/api/authors`);
    const authors = authorResponse.data;

    const author = authors.find(
      (author) => author.role === "Author" && author.name === blog.author
    );
    const editor = authors.find(
      (author) => author.role === "Editor" && author.name === blog.editor
    );
    const developer = authors.find(
      (author) => author.role === "Developer" && author.name === blog.developer
    );

    const categoryBlogs = blogs
      .filter(
        (b) =>
          b !== blog &&
          Object.values(b.translations).some(
            (translation) => translation.category === blog.translations[locale]?.category
          )
      )
      .slice(0, 3);

    const shortcodesResponse = await axios.get(`${protocol}://${host}/api/shortcodes-tools`);
    const initialShortcodes = shortcodesResponse.data;

    return {
      props: {
        initialBlog: blog,
        authorData: {
          author: author || null,
          editor: editor || null,
          developer: developer || null,
        },
        relatedBlogs: categoryBlogs,
        initialShortcodes,
        metaUrl, // Pass meta URL to component
        hreflangs, // Pass hreflangs to component
        ...(await serverSideTranslations(locale, ["blog", "navbar", "footer"])),
      },
    };
  } catch (error) {
    console.error("Error fetching blogs or authors:", error.message);
    return {
      notFound: true,
    };
  }
}


export default BlogPost;
