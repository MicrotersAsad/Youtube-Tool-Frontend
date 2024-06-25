import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout';

const ReviewsTable = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await axios.delete(`/api/reviews?id=${id}`);
      setReviews(reviews.filter((review) => review._id !== id));
      toast.success('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error.message);
      toast.error('Failed to delete review.');
    }
  };

  return (
    <Layout>
    <div className="max-w-7xl mx-auto p-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4 text-center">All Reviews</h2>
      <table className="min-w-full bg-white border shadow p-4">
        <thead>
          <tr className='bg-gray-200'>
            <th className="py-2 px-4 border-b">Tool Name</th>
            <th className="py-2 px-4 border-b">Rating</th>
            <th className="py-2 px-4 border-b">Comment</th>
            <th className="py-2 px-4 border-b">Created At</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review._id}>
              <td className="py-2 px-4 border-b">{review.tool}</td>
              <td className="py-2 px-4 border-b">{review.rating}</td>
              <td className="py-2 px-4 border-b">{review.comment}</td>
              <td className="py-2 px-4 border-b">{new Date(review.createdAt).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => deleteReview(review._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </Layout>
  );
};

export default ReviewsTable;
