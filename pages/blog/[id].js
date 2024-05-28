import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '../Breadcrumb'; // Adjust the path as needed
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
} from 'react-share';
import { ClipLoader } from 'react-spinners';

const BlogPost = () => {
  const router = useRouter();
  const { id } = router.query;
  const [blog, setBlog] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchBlog = async () => {
        try {
          const response = await axios.get(`/api/blogs?id=${id}`);
          if (response.status === 200) {
            const blogData = response.data;
            setBlog(blogData);
            console.log(blogData.relatedArticles);
            setRelatedArticles(blogData.relatedArticles || []);
          } else {
            throw new Error('Failed to fetch the blog post');
          }
        } catch (error) {
          console.error('Error fetching blog post:', error);
          setError('Error fetching blog post');
        }
      };

      fetchBlog();
    }
  }, [id]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard');
      });
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!blog) {
    return   <div className="flex justify-center items-center h-64">
    <ClipLoader size={50} color={"#123abc"} loading={loading} />
  </div>;
  }

  const shareUrl = `https://your-domain.com/blog/${id}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>{blog.Blogtitle}</title>
        <meta name="description" content={blog.description} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={blog.Blogtitle} />
        <meta property="og:description" content={blog.description} />
        <meta property="og:image" content={blog.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="your-domain.com" />
        <meta property="twitter:url" content={shareUrl} />
        <meta name="twitter:title" content={blog.Blogtitle} />
        <meta name="twitter:description" content={blog.description} />
        <meta name="twitter:image" content={blog.image} />
      </Head>
      <Breadcrumb blogTitle={blog.Blogtitle} />
      <article>
        <header className="mb-8">
          <div className="row">
            <div className="col-md-6">
              <h1 className="text-6xl font-bold mb-2 mt-5">{blog?.Blogtitle}</h1>
              <div className="text-gray-500 mb-4 mt-4">
                <span>By {blog.author} | </span>
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                <div className="flex space-x-4 mt-8">
                  <FacebookShareButton url={shareUrl} quote={blog.Blogtitle}>
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  <TwitterShareButton url={shareUrl} title={blog.Blogtitle}>
                    <TwitterIcon size={32} round />
                  </TwitterShareButton>
                  <LinkedinShareButton url={shareUrl} title={blog.Blogtitle} summary={blog.description}>
                    <LinkedinIcon size={32} round />
                  </LinkedinShareButton>
                  <button onClick={handleCopyLink} className="flex items-center px-3 py-2 bg-gray-200 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h4V6h4m1 6h6m4 4v4h-4m-1-6H7m-4 4v4H3v-4h4m6-4v4h4" />
                    </svg>
                    <span className="ml-2 text-gray-700">Copy Link</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <Image width={800} height={560} src={blog?.image} alt={blog.Blogtitle} />
            </div>
          </div>
        </header>
        <section>
          <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
        </section>
        {relatedArticles.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map((article) => (
                <div key={article._id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <Image src={article.image || '/default-image.jpg'} alt={article.Blogtitle} width={400} height={250} className="object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">
                      <Link href={`/blog/${article._id}`} className="text-blue-500 hover:underline">
                        {article.Blogtitle}
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">{article.description}</p>
                    <p className="text-gray-500 text-sm">By {article.author} · {new Date(article.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default BlogPost;
