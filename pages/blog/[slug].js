import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ClipLoader } from 'react-spinners';

const BlogPost = ({ blog, domain }) => {
  const router = useRouter();
  const { slug } = router.query;
  const [loading, setLoading] = useState(true);

  const content = blog.translations && Object.values(blog.translations).find(translation => translation.slug === slug);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (!content) {
    return <p className="text-red-500">No content available for this language.</p>;
  }

  return (
    <div>
      <Head>
        {Object.keys(blog.translations).map(lang => (
          <link
            key={lang}
            rel="alternate"
            href={`https://${domain}/blog/${blog.translations[lang].slug}`}
            hreflang={lang}
          />
        ))}
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
            <div className="text-gray-600 mb-4">{content.description}</div>
            <Image
              src={content.image}
              alt={content.title}
              width={1200}
              height={630}
              layout="responsive"
              className="rounded-lg"
            />
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
    const host = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const apiUrl = `${protocol}://${host}/api/blogs`;

    console.log(`Fetching data from: ${apiUrl}`); // Debugging log

    const { data } = await axios.get(apiUrl);

    // Debugging log
    console.log(`Fetched data: ${JSON.stringify(data, null, 2)}`);

    const blog = data.find(blog =>
      Object.values(blog.translations).some(translation => translation.slug === slug)
    );

    if (!blog) {
      console.log(`No blog found for slug: ${slug}`); // Debugging log
      return {
        notFound: true,
      };
    }

    return {
      props: {
        blog,
        domain: host,
        ...(await serverSideTranslations(locale, ['common', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching blog post:', error.message);
    return {
      notFound: true,
    };
  }
}

export default BlogPost;
