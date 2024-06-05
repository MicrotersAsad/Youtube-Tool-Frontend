import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '../Breadcrumb';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
} from 'react-share';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye } from 'react-icons/fa';

const BASE_URL = "https://youtube-tool-frontend.vercel.app/";

const BlogPost = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);
  const [toc, setToc] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyComment, setReplyComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchBlog(slug);
      incrementViewCount(slug); // Increment view count
      fetchComments(slug); // Pass slug to fetchComments
    }
  }, [slug]);

  const fetchBlog = async (slug) => {
    try {
      const response = await axios.get('/api/blogs', { params: { slug } });
      if (response.status === 200) {
        const blogData = response.data;
        if (blogData) {
          setBlog(blogData);
          generateToc(blogData.content);
        } else {
          setError('No blog found with this slug.');
        }
      } else {
        throw new Error('Failed to fetch the blog post');
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setError('Error fetching blog post');
    }
  };

  const incrementViewCount = async (slug) => {
    try {
      await axios.post(`/api/incrementView`, { slug });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

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

  const fetchComments = async (slug) => {
    try {
      const response = await axios.get(`/api/comments/${slug}`);
      if (response.status === 200) {
        setComments(response.data);
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!user) {
      alert('You must be logged in to add a comment.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `/api/comments/${slug}`,
        { content: newComment, parentId: null },
        { headers }
      );

      if (response.status === 201) {
        setComments([...comments, response.data]);
        setNewComment('');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReplyToComment = (commentId) => {
    setReplyTo(commentId);
  };

  const handleAddReply = async (parentId) => {
    if (!replyComment.trim()) return;

    if (!user) {
      alert('You must be logged in to reply.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `/api/comments/${slug}`,
        { content: replyComment, parentId },
        { headers }
      );

      if (response.status === 201) {
        setComments([...comments, response.data]);
        setReplyComment('');
        setReplyTo(null);
      } else {
        throw new Error('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
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

  const shareUrl = `https://your-domain.com/blog/${slug}`;

  return (
    <>
      <Head>
        <title>{blog?.metaTitle}</title>
        <meta name="description" content={blog?.metaDescription} />
        <meta property="og:url" content={`${BASE_URL}${blog.slug}`} />
        <meta property="og:title" content={blog?.metaTitle} />
        <meta property="og:description" content={blog?.metaDescription} />
        <meta property="og:image" content={`${BASE_URL}${blog.image}`} />
        <meta name="twitter:card" content={`${BASE_URL}${blog.image}`} />
        <meta property="twitter:domain" content="youtube-tool-frontend.vercel.app" />
        <meta property="twitter:url" content={`${BASE_URL}${blog.slug}`} />
        <meta name="twitter:title" content={blog?.metaTitle} />
        <meta name="twitter:description" content={blog?.metaDescription} />
        <meta name="twitter:image" content={`${BASE_URL}${blog.image}`} />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Breadcrumb blogTitle={blog.title} />
        <article>
          <header className="mb-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2">
                <h1 className="text-3xl md:text-6xl font-bold mb-2 mt-5">{blog.title}</h1>
                <div className="text-gray-500 mb-4 mt-4">
                  <span>By {blog.author} | </span>
                  <span>Published: {new Date(blog.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center ml-4">
                    <FaEye className="mr-1" /> {blog.viewCount} Views
                  </span>
                  <div className="flex space-x-4 mt-8">
                    <FacebookShareButton url={shareUrl} quote={blog.title}>
                      <FacebookIcon size={32} round />
                    </FacebookShareButton>
                    <TwitterShareButton url={shareUrl} title={blog.title}>
                      <TwitterIcon size={32} round />
                    </TwitterShareButton>
                    <LinkedinShareButton url={shareUrl} title={blog.title} summary={blog.description}>
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
              <div className="md:w-1/2">
                <Image width={800} height={560} src={blog.image} alt={blog.title} className="w-full h-auto object-cover" />
              </div>
            </div>
          </header>
          <section className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
          </section>
          <section className="comments mt-12">
            <h2 className="text-2xl font-bold mb-4">Comments</h2>
            {comments.map((comment) => (
              <div key={comment._id} className="mb-6">
                <div className="flex items-start mb-2">
                  <div className="flex-shrink-0 mr-3">
                    <Image
                      width={50}
                      height={50}
                      src={`data:image/jpeg;base64,${comment.authorProfile}`}
                      alt={comment.author}
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="text-sm font-semibold">{comment.author}</div>
                      <div className="text-sm text-gray-700 mt-2">{comment.content}</div>
                    </div>
                    <button
                      onClick={() => handleReplyToComment(comment._id)}
                      className="text-blue-500 hover:underline text-sm mt-2"
                    >
                      Reply
                    </button>
                    {replyTo === comment._id && (
                      <div className="mt-4">
                        <textarea
                          value={replyComment}
                          onChange={(e) => setReplyComment(e.target.value)}
                          className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2"
                          rows="3"
                        ></textarea>
                        <button
                          onClick={() => handleAddReply(comment._id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2"
                        >
                          Add Reply
                        </button>
                      </div>
                    )}
                    {comment.replies && comment.replies.map((reply) => (
                      <div key={reply._id} className="ml-10 mt-4">
                        <div className="flex items-start mb-2">
                          <div className="flex-shrink-0 mr-3">
                            <Image
                              width={50}
                              height={50}
                              src={`data:image/jpeg;base64,${reply.authorProfile}`}
                              alt={reply.author}
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="bg-gray-100 p-4 rounded-lg">
                              <div className="text-sm font-semibold">{reply.author}</div>
                              <div className="text-sm text-gray-700 mt-2">{reply.content}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Add a Comment</h3>
              {user ? (
                <>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2"
                    rows="5"
                  ></textarea>
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2"
                  >
                    Add Comment
                  </button>
                </>
              ) : (
                <p className="text-gray-600">You must be <Link href="/login"><span className="text-blue-500">logged in</span></Link> to add a comment.</p>
              )}
            </div>
          </section>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
