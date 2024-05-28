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
  const [error, setError] = useState(null);
  const [toc, setToc] = useState([]);

  useEffect(() => {
    if (id) {
      const fetchBlog = async () => {
        try {
          const response = await axios.get(`/api/blogs?id=${id}`);
          if (response.status === 200) {
            const blogData = response.data;
            setBlog(blogData);
            generateToc(blogData.content);
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

  const generateToc = (content) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h1, h2'));
    const tocItems = headings.map((heading) => ({
      id: heading.id,
      text: heading.innerText,
      level: heading.tagName.toLowerCase(),
    }));
    setToc(tocItems);
  };

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
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} />
      </div>
    );
  }

  const shareUrl = `https://your-domain.com/blog/${id}`;

  return (
    <>
      <Head>
        <title>{blog.Blogtitle}</title>
        <meta name="description" content={blog.description} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={blog.Blogtitle} />
        <meta property="og:description" content={blog.description} />
        <meta property="og:image" content={`data:image/jpeg;base64,${blog.image}`} />
        <meta name="twitter:card" content={`data:image/jpeg;base64,${blog.image}`} />
        <meta property="twitter:domain" content="your-domain.com" />
        <meta property="twitter:url" content={shareUrl} />
        <meta name="twitter:title" content={blog.Blogtitle} />
        <meta name="twitter:description" content={blog.description} />
        <meta name="twitter:image" content={`data:image/jpeg;base64,${blog.image}`} />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
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
                <Image width={800} height={560} src={`data:image/jpeg;base64,${blog.image}`} alt={blog.Blogtitle} />
              </div>
            </div>
          </header>
          <aside>
            <nav className="toc">
              <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
              <ul className="space-y-2">
                {toc.map((item, index) => (
                  <li key={index} className={`ml-${item.level === 'h2' ? '4' : '0'}`}>
                    <a href={`#${item.id}`} className="text-blue-500 hover:underline">{item.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <section>
            <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
          </section>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
