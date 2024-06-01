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
import { useAuth } from '../../contexts/AuthContext';

const BlogPost = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);
  const [toc, setToc] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyComment, setReplyComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (id) {
      fetchBlog();
      fetchComments();
    }
  }, [id]);

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

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/${id}`);
      if (response.status === 200) {
        setComments(response.data);
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!user) {
      alert('You must be logged in to add a comment.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);

      if (!token) {
        throw new Error('No token found');
      }

      const headers = { Authorization: `Bearer ${token}` };
      console.log('Headers:', headers);

      const response = await axios.post(
        `/api/comments/${id}`,
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
      if (error.response) {
        console.error('Response:', error.response);
      }
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
      console.log('Token:', token);

      if (!token) {
        throw new Error('No token found');
      }

      const headers = { Authorization: `Bearer ${token}` };
      console.log('Headers:', headers);

      const response = await axios.post(
        `/api/comments/${id}`,
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
      if (error.response) {
        console.error('Response:', error.response);
      }
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
          
          <section className="flex justify-center items-center p-20">
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
