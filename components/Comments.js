// components/Comments.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      <form onSubmit={handleCommentSubmit} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 border border-gray-300 rounded-md"
          rows="4"
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        {comments.map((comment) => (
          <div key={comment._id} className="mb-4 p-4 border border-gray-200 rounded-md">
            <p className="text-gray-600">{comment.author}</p>
            <p>{comment.content}</p>
            <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
