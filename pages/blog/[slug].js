import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ClipLoader } from 'react-spinners';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import Breadcrumb from "../Breadcrumb"; // Adjust the import path as needed

const BlogPost = ({ initialBlog }) => {
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [loading, setLoading] = useState(!initialBlog);
  const [schemaData, setSchemaData] = useState(null);
  const [breadcrumbSchema, setBreadcrumbSchema] = useState(null);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const apiUrl = `${window.location.origin}/api/blogs`;

          const { data } = await axios.get(apiUrl);
          const blogs = data;

          const blog = blogs.find(blog =>
            Object.values(blog.translations).some(translation => translation.slug === slug)
          );

          if (blog) {
            setBlog(blog);
          } else {
            console.log(`No blog found for slug: ${slug}`); // Log if no blog is found
          }

        } catch (error) {
          console.error('Error fetching blogs:', error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [slug, initialBlog]);

  useEffect(() => {
    if (blog && blog.translations) {
      const content = blog.translations[locale];
      if (content) {
        const schemaData = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": content.title,
          "image": [
            content.image || "https://example.com/photos/1x1/photo.jpg", // Replace with default or dynamic image URLs
          ],
          "datePublished": blog.createdAt,
          "dateModified": blog.updatedAt || blog.createdAt,
          "author": {
            "@type": "Person",
            "name": blog.author
          },
          "publisher": {
            "@type": "Organization",
            "name": "ytubetools", // Replace with your organization name
            "logo": {
              "@type": "ImageObject",
              "url": "https://example.com/logo.jpg" // Replace with your logo URL
            }
          },
          "description": content.description,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${window.location.origin}/blog/${slug}`
          }
        };

        const breadcrumbSchema = {
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
              "name": "Blog",
              "item": `${window.location.origin}/blog`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": content.title,
              "item": `${window.location.origin}/blog/${slug}`
            }
          ]
        };

        setSchemaData(schemaData);
        setBreadcrumbSchema(breadcrumbSchema);
      }
    }
  }, [blog, locale, slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!blog) {
    return <p className="text-red-500">No content available for this language.</p>;
  }

  const content = blog.translations ? blog.translations[locale] : null;

  if (!content) {
    return <p className="text-red-500">No content available for this language.</p>;
  }

  return (
    <div>
      <Head>
        <title>{content.title} | ytubetools</title>
        <meta name="description" content={content.description} />
        <meta name="keywords" content={`SEO, Blog, ytubetools, ${content.title}`} />
        <meta name="author" content={blog.author} />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.description} />
        <meta property="og:image" content={content.image || "https://example.com/photos/1x1/photo.jpg"} />
        <meta property="og:url" content={`${window.location.origin}/blog/${slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content.title} />
        <meta name="twitter:description" content={content.description} />
        <meta name="twitter:image" content={content.image || "https://example.com/photos/1x1/photo.jpg"} />
        <meta name="twitter:site" content="@ytubetools" />

        {schemaData && (
          <script type="application/ld+json">
            {JSON.stringify(schemaData)}
          </script>
        )}
        {breadcrumbSchema && (
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        )}
        {typeof window !== 'undefined' && blog.translations && Object.keys(blog.translations).map(lang => (
          <link
            key={lang}
            rel="alternate"
            href={`${window.location.origin}/blog/${blog.translations[lang].slug}`}
            hrefLang={lang}
          />
        ))}
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <Breadcrumb blogTitle={content.title} />
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
            <div className="text-gray-600 mb-4">{content.description}</div>
            <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
            {content.image && (
              <div className="flex justify-center my-4">
                <Image
                  src={content.image}
                  alt={content.title}
                  width={800}
                  height={630}
                  style={{ borderRadius: '0.5rem', maxWidth: '100%' }}
                />
              </div>
            )}
            <div className="my-4" dangerouslySetInnerHTML={{ __html: content.content }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export async function getStaticPaths() {
  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'ytubetools.com';
    const apiUrl = `${protocol}://${host}/api/blogs`;
    const { data } = await axios.get(apiUrl);

    const paths = data.map(blog => {
      const translations = Object.values(blog.translations);
      return translations.map(translation => ({
        params: { slug: translation.slug },
        locale: translation.locale
      }));
    }).flat();

    return { paths, fallback: true };
  } catch (error) {
    console.error('Error fetching blogs:', error.message);
    return { paths: [], fallback: true };
  }
}

export async function getStaticProps({ params, locale }) {
  try {
    const { slug } = params;
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'ytubetools.com';
    const apiUrl = `${protocol}://${host}/api/blogs/${slug}`;

    console.log(`Fetching from: ${apiUrl}`); // Log the API URL for debugging

    const { data } = await axios.get(apiUrl);

    return {
      props: {
        initialBlog: data,
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
      revalidate: 60, // Revalidate the page every 60 seconds
    };
  } catch (error) {
    console.error('Error fetching blog:', error.message);
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
