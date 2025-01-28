import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { ClipLoader } from "react-spinners";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
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
import Script from "next/script"; // ✅ Fixes script warnings

const getTitle = (translation) => translation.title || translation.Title || "";
const getDescription = (translation) => translation.description || translation.Description || "";
const getMetaTitle = (translation) => translation.metaTitle || translation.MetaTitle || "";
const getMetaDescription = (translation) => translation.metaDescription || translation.MetaDescription || "";
const getContent = (translation) => translation.content || translation.Content || "";

const insertTocBeforeFirstHeading = (content, tocHtml) => {
  const firstHeadingIndex = content.search(/<h[1-6][^>]*>/);
  if (firstHeadingIndex === -1) return content;
  return content.slice(0, firstHeadingIndex) + tocHtml + content.slice(firstHeadingIndex);
};

const BlogPost = ({ initialBlog, authorData, relatedblogs, initialShortcodes, metaUrl, hreflangs }) => {
  const { t } = useTranslation("blog");
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;

  const [blog, setBlog] = useState(initialBlog);
  const [author, setAuthor] = useState(authorData?.author);
  const [loading, setLoading] = useState(!initialBlog);
  const [shortcodes, setShortcodes] = useState(initialShortcodes || []);

  console.log("Initial Blog Data:", initialBlog);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/blogs`;
          const { data } = await axios.get(apiUrl);
          const blogs = data;

          const blog = blogs.find((b) =>
            Object.values(b.translations).some((translation) => translation.slug === slug)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold text-gray-800">404 - Blog Not Found</h1>
        <p className="text-gray-600 mt-2">Sorry, this blog post is not available.</p>
        <a href="/blog" className="text-blue-500 mt-4">Go back to Blogs</a>
      </div>
    );
  }

  const translation = blog.translations[locale] || {};
  const content = getContent(translation);
  const [toc, updatedContent] = useToc(content);
  const tocHtml = toc ? ReactDOMServer.renderToStaticMarkup(<TableOfContents headings={toc} />) : "";
  const contentWithToc = insertTocBeforeFirstHeading(updatedContent, tocHtml);
  const contentWithShortcodes = <ReplaceShortcodes content={contentWithToc} shortcodes={shortcodes} />;
  const publicationDate = blog.createdAt ? format(new Date(blog.createdAt), "MMMM dd, yyyy") : "";

  return (
    <div className="relative">
      <Head>
        <title>{getMetaTitle(translation)} | YtubeTools</title>
        <meta name="description" content={getMetaDescription(translation) || ""} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={metaUrl} />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={getMetaTitle(translation)} />
        <meta property="og:description" content={getMetaDescription(translation)} />
        <meta property="og:image" content={translation.image || "/default-image.jpg"} />

        {/* hreflang Links */}
        {hreflangs.map((hreflang, index) => (
          <link key={index} rel={hreflang.rel} hreflang={hreflang.hreflang} href={hreflang.href} />
        ))}
      </Head>

    
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <h1 className="md:text-5xl text-xl font-bold mb-2">{translation.title}</h1>
     
      <div dangerouslySetInnerHTML={{ __html: translation.content }} />
        <h6>{t('Updated on')} {publicationDate}</h6>
        <AuthorInfo data={authorData} />
        <div className="overflow-hidden sm:rounded-lg mb-8">
         
          <Comments slug={slug} />
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ locale, params, req }) {
  try {
    const { slug } = params;
    if (!slug) return { notFound: true };

    const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers.host || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/blogs`;
    const token = process.env.AUTH_TOKEN || "your-secure-token"; 

    const headers = { Authorization: `Bearer ${token}` };
    const { data: blogs } = await axios.get(apiUrl, { headers });

    const blog = blogs.find((b) =>
      Object.values(b.translations).some((t) => t.slug === slug)
    );

    if (!blog) return { notFound: true };

    return {
      props: {
        initialBlog: blog,
        authorData: { author: null },
        relatedblogs: [],
        initialShortcodes: [],
        metaUrl: `${protocol}://${host}/blog/${slug}`,
        hreflangs: [],
        ...(await serverSideTranslations(locale, ["blog"])),
      },
    };
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    return { notFound: true };
  }
}

export default BlogPost;
