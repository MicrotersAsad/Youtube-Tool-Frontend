import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ClipLoader } from 'react-spinners';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const BlogPost = ({ initialBlog }) => {
  const router = useRouter();
  const { slug } = router.query;
  const { locale } = router;
  const [blog, setBlog] = useState(initialBlog);
  const [loading, setLoading] = useState(!initialBlog);

  useEffect(() => {
    if (!initialBlog && slug) {
      const fetchData = async () => {
        try {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const apiUrl = `${protocol}//${host}/api/blogs`;

          console.log(`Fetching data from: ${apiUrl}`); // Debugging log

          const { data } = await axios.get(apiUrl);
          const blogs = data;

          // Debugging log
          console.log(`Fetched data: ${JSON.stringify(blogs, null, 2)}`);

          // Find the correct blog post that matches the slug within translations
          const blog = blogs.find(blog =>
            Object.values(blog.translations).some(translation => translation.slug === slug)
          );

          if (blog) {
            setBlog(blog);
          } else {
            console.log(`No blog found for slug: ${slug}`); // Debugging log
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
  console.log(content);

  if (!content) {
    return <p className="text-red-500">No content available for this language.</p>;
  }

  return (
    <div>
      <Head>
        {typeof window !== 'undefined' && blog.translations && Object.keys(blog.translations).map(lang => (
          <link
            key={lang}
            rel="alternate"
            href={`${window.location.protocol}//${window.location.host}/blog/${blog.translations[lang].slug}`}
            hrefLang={lang} // Corrected property name
          />
        ))}
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
            <div className="text-gray-600 mb-4">{content.description}</div>
            {content.image && (
              <img
                src={content.image}
                alt={content.title}
                width={1200}
                height={630}
                style={{ borderRadius: '0.5rem', maxWidth: '100%' }}
              />
            )}
            <div className="my-4" dangerouslySetInnerHTML={{ __html: content.content }} />
            <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ locale, params, req }) {
  try {
    const { slug } = params;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/blogs`;

    console.log(`Fetching data from: ${apiUrl}`); // Debugging log

    const { data } = await axios.get(apiUrl);
    const blogs = data;

    // Debugging log
    console.log(`Fetched data: ${JSON.stringify(blogs, null, 2)}`);

    // Find the correct blog post that matches the slug within translations
    const blog = blogs.find(blog =>
      Object.values(blog.translations).some(translation => translation.slug === slug)
    );

    if (!blog) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        initialBlog: blog,
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching blogs:', error.message);
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
