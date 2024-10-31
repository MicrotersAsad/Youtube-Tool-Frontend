// BlogPost.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { ClipLoader } from "react-spinners";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Comments from "../../components/Comments";
import { useTranslation } from "react-i18next";
import { replaceShortcodes } from "../../components/replaceShortcodes"; // Import shortcode function

const getTitle = (translation) => translation.title || translation.Title || "";
const getDescription = (translation) =>
  translation.description || translation.description || "";
const getMetaTitle = (translation) =>
  translation.metaTitle || translation.metaTitle || "";
const getMetaDescription = (translation) =>
  translation.metaDescription || translation.metaDescription || "";
const getContent = (translation) =>
  translation.content || translation.Content || "";

const BlogPost = ({
  initialBlog,
  authorData,
  relatedBlogs,
  initialShortcodes,
}) => {
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
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/youtube`;
          const { data } = await axios.get(apiUrl);
          const blogs = data;

          const blog = blogs.find((blog) =>
            Object.values(blog.translations).some(
              (translation) => translation.slug === slug
            )
          );

          if (blog) {
            setBlog(blog);
            const authorResponse = await axios.get(
              `/api/authors?name=${blog.author}`
            );
            if (authorResponse.data.length > 0) {
              setAuthor(authorResponse.data[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching articles:", error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [slug, initialBlog]);

  const translation = blog?.translations ? blog.translations[locale] || {} : {};
  const content = getContent(translation);

  // Replace shortcodes in the updated content dynamically
  const contentWithShortcodes = replaceShortcodes(content, shortcodes);

  const categoryName = translation.category || "Blog";

  // Ensure scroll styles are applied on tables after content load
  useEffect(() => {
    const tables = document.querySelectorAll(".youtube-content table");
    tables.forEach((table) => {
      table.classList.add("scrollable-table");
    });
  }, [contentWithShortcodes]); // Re-run when content updates

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!blog) {
    return (
      <p className="text-red-500">
        {t("No content available for this language.")}
      </p>
    );
  }

  return (
    <div className="relative">
      <Head>
        <title>{getMetaTitle(translation)} | ytubetools</title>
        <meta
          name="description"
          content={getMetaDescription(translation) || ""}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-grow order-1 lg:order-2">
            <h1 className="md:text-5xl text-xl font-bold mb-4">
              {getTitle(translation)}
            </h1>
            <p>{getDescription(translation)}</p>

            <div className="overflow-hidden sm:rounded-lg mb-8">
              <div className="border-b border-gray-200">
                {/* Render processed content with shortcodes */}
                <div className="my-4 youtube-content">
                  {contentWithShortcodes}
                </div>
                {/* Additional sections like comments */}
                <Comments slug={slug} />
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .youtube-content h2 {
            padding-top: 12px;
          }
          .youtube-content p {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          /* Apply scrolling styles to tables with scrollable-table class */
        @media (max-width: 768px) {
  .youtube-content table {
    display: block !important;
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 20px 0 !important;
    font-size: 1rem !important;
    text-align: left !important;
    overflow-x: auto !important;
    white-space: nowrap !important;
  }
}


        `}</style>
      </div>
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
          destination: `/youtube/${currentSlug}`,
          permanent: false,
        },
      };
    }

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
            (translation) =>
              translation.category === blog.translations[locale]?.category
          )
      )
      .slice(0, 3);

    // Fetch shortcodes dynamically on the server side
    const shortcodesResponse = await axios.get(
      `${protocol}://${host}/api/shortcodes-tools`
    );
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
