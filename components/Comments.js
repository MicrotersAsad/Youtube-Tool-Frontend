import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Comment = ({ comment, slug, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`/api/comments/${slug}`, {
        content: replyContent,
        parentId: comment._id,
      });
      onReply(response.data.comment);
      setShowReplyForm(false);
      setReplyContent('');
      toast.info('Waiting for admin approval');
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  return (
    <div className={`mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm ${comment.approved ? '' : 'opacity-50'}`}>
      <div className="flex items-start">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 mr-4">
          {comment.authorProfile ? (
            <img src={comment.authorProfile} alt={comment.author} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-300" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">{comment.author}</p>
            <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
          </div>
          <p className="text-gray-700 mb-4">{comment.content}</p>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-blue-500 hover:underline text-sm"
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                rows="2"
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
              >
                Post Reply
              </button>
            </form>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 ml-4 sm:ml-8 border-l-2 border-gray-200 pl-4">
              {comment.replies.map((reply) => (
                <Comment key={reply._id} comment={reply} slug={slug} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Comments = ({ slug }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/${slug}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments.');
    }
  };

  useEffect(() => {
    if (slug) {
      fetchComments();
    }
  }, [slug]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/comments/${slug}`, { content: newComment });
      setComments([...comments, response.data.comment]);
      setNewComment('');
      toast.info('Waiting for admin approval');
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (reply) => {
    const updateComments = (comments) => {
      return comments.map((comment) => {
        if (comment._id === reply.parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        } else if (comment.replies) {
          return {
            ...comment,
            replies: updateComments(comment.replies),
          };
        }
        return comment;
      });
    };

    setComments(updateComments(comments));
  };

  return (
    <div className="mt-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <h2 className="text-3xl font-bold mb-6">Comments</h2>
      <form onSubmit={handleCommentSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          rows="4"
        />
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div>
        {comments.map((comment) => (
          <Comment key={comment._id} comment={comment} slug={slug} onReply={handleReply} />
        ))}
      </div>
    </div>
  );
};

export default Comments;