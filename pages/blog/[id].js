// pages/blog/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';

const BlogPost = () => {
  const router = useRouter();
  const { id } = router.query;
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchBlog = async () => {
        try {
          const response = await axios.get(`/api/blogs?id=${id}`);
          setBlog(response.data);
        } catch (error) {
          setError('Error fetching blog post');
        }
      };

      fetchBlog();
    }
  }, [id]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!blog) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Head>
        <title>{blog.title}</title>
        <meta name="description" content={blog.description} />
        <meta property="og:url" content={`https://your-domain.com/blog/${id}`} />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.description} />
        <meta property="og:image" content={blog.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="your-domain.com" />
        <meta property="twitter:url" content={`https://your-domain.com/blog/${id}`} />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={blog.description} />
        <meta name="twitter:image" content={blog.image} />
      </Head>
      <div className='p-5'>
        <img src={blog.image} alt={blog.title} className="w-100 h-100 object-cover" />
      </div>
      <h1 className="text-4xl font-bold mb-4">{blog.Blogtitle}</h1>
      <p className="text-gray-600 mb-8">{blog.description}</p>
      <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
    </div>
  );
};

export default BlogPost;
