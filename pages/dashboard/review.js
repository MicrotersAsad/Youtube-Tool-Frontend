import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout';
import { FaSearch } from 'react-icons/fa';

const ReviewsTable = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, reviews]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('/api/reviews');
      const sortedReviews = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setReviews(sortedReviews);
      setFilteredReviews(sortedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      toast.error('Failed to fetch reviews.');
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredReviews(reviews);
    } else {
      const lowerCaseTerm = searchTerm.toLowerCase();
      const filtered = reviews.filter(
        (review) =>
          review.tool.toLowerCase().includes(lowerCaseTerm) ||
          review.rating.toString().includes(lowerCaseTerm) ||
          review.comment.toLowerCase().includes(lowerCaseTerm)
      );
      setFilteredReviews(filtered);
    }
    setCurrentPage(1);
  };

  const openModal = (id) => {
    setSelectedReviewId(id);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedReviewId(null);
    setShowModal(false);
  };

  const deleteReview = async () => {
    try {
      await axios.delete(`/api/reviews?id=${selectedReviewId}`);
      setReviews(reviews.filter((review) => review._id !== selectedReviewId));
      toast.success('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error.message);
      toast.error('Failed to delete review.');
    } finally {
      closeModal();
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastReview = currentPage * pageSize;
  const indexOfFirstReview = indexOfLastReview - pageSize;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

  const totalPages = Math.ceil(filteredReviews.length / pageSize);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <ToastContainer />
        <div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
            All Tools Reviews
          </h2>
          <div className="flex border border-gray-300 rounded-md overflow-hidden md:me-5 w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Tool, Rating, or Comment"
              className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
            />
            <button className="bg-[#071251] p-2 flex items-center justify-center">
              <FaSearch className="text-white" />
            </button>
          </div>
        </div>

        <table className="min-w-full bg-white border shadow p-4">
          <thead>
            <tr className="bg-[#071251] text-white">
              <th className="py-2 px-4 border-b">Tool Name</th>
              <th className="py-2 px-4 border-b">Rating</th>
              <th className="py-2 px-4 border-b">Comment</th>
              <th className="py-2 px-4 border-b">Created At</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentReviews.map((review) => (
              <tr key={review._id}>
                <td className="py-2 px-4 border-b">{review.tool}</td>
                <td className="py-2 px-4 border-b">{review.rating}</td>
                <td className="py-2 px-4 border-b">{review.comment}</td>
                <td className="py-2 px-4 border-b">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => openModal(review._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === index + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this review? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteReview}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReviewsTable;
