import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart, FaComment, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StarRating from './StarRating';
import Slider from 'react-slick';

const YouTubeCommentPicker = () => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [includeReplies, setIncludeReplies] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [comments, setComments] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [meta, setMeta] = useState({ // Meta information for the page
    title: 'YouTube Channel Logo Downloader',
    description: "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
    image: 'https://yourwebsite.com/og-image.png',
});
const [reviews, setReviews] = useState([]);
const [quillContent, setQuillContent] = useState("");
const [existingContent, setExistingContent] = useState("");
const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
useEffect(() => {
  const fetchContent = async () => {
      try {
          const response = await fetch(`/api/content?category=youtube-comment-picker`);
          if (!response.ok) {
              throw new Error("Failed to fetch content");
          }
          const data = await response.json();
          setQuillContent(data[0]?.content || ""); // Ensure content is not undefined
          setExistingContent(data[0]?.content || ""); // Ensure existing content is not undefined
          setMeta(data[0]);
      } catch (error) {
          toast.error("Error fetching content");
      }
  };

  fetchContent();
  fetchReviews();
}, []);

const fetchReviews = async () => {
  try {
      const response = await fetch('/api/reviews?tool=youtube-comment-picker');
      const data = await response.json();
      setReviews(data);
  } catch (error) {
      console.error('Failed to fetch reviews:', error);
  }
};
const handleReviewSubmit = async () => {
  if (!newReview.rating || !newReview.comment) {
      toast.error('All fields are required.');
      return;
  }

  try {
      const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              tool: 'youtube-comment-picker',
              ...newReview,
          }),
      });

      if (!response.ok) {
          throw new Error('Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setNewReview({ rating: 0, comment: '' });
      fetchReviews(); // Refresh the reviews
  } catch (error) {
      toast.error('Failed to submit review');
  }
};

const calculateRatingPercentage = (rating) => {
  const totalReviews = reviews.length;
  const ratingCount = reviews.filter(review => review.rating === rating).length;
  return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
};

const settings = {
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  responsive: [
      {
          breakpoint: 1024,
          settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              infinite: true,
          }
      }
  ]
};


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem('generateCount'), 10) || 0;
      setGenerateCount(count);
    }
  }, []);

  useEffect(() => {
    if (user && user.paymentStatus !== 'success' && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (user && user.paymentStatus !== 'success' && user.role !== 'admin') {
      setGenerateCount(5);
    }
  }, [user]);

  const handlePickWinner = async () => {
    if (!user) {
      toast.error('Please log in to use this tool.');
      return;
    }

    if (
      generateCount >= 5 &&
      user?.paymentStatus !== 'success' &&
      user?.role !== 'admin'
    ) {
      toast.error('You have reached the limit of generating winners. Please upgrade your plan for unlimited use.');
      return;
    }

    setLoading(true);
    try {
      const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
      const response = await axios.get('/api/commentswinner', {
        params: { videoId, includeReplies },
      });
      let allComments = response.data;

      if (filterDuplicates) {
        const uniqueUsers = new Set();
        allComments = allComments.filter((comment) => {
          if (uniqueUsers.has(comment.user)) return false;
          uniqueUsers.add(comment.user);
          return true;
        });
      }

      if (filterText) {
        allComments = allComments.filter((comment) =>
          comment.text.includes(filterText)
        );
      }

      if (allComments.length > 0) {
        const randomIndex = Math.floor(Math.random() * allComments.length);
        setWinner(allComments[randomIndex]);
        setGenerateCount((prevCount) => {
          const newCount = prevCount + 1;
          localStorage.setItem('generateCount', newCount);
          return newCount;
        });
      } else {
        setWinner(null);
      }
    } catch (error) {
      console.error('Error fetching comments:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <ToastContainer />
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className='text-center'>YouTube Comment Picker</h1>
        {modalVisible && (
          <div
            className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3"
            role="alert"
          >
            <div className="flex">
              <div>
                {user ? (
                  user.paymentStatus === 'success' || user.role === 'admin' ? (
                    <p className="text-center p-3 alert-warning">
                      Congratulations!! Now you can pick unlimited winners.
                    </p>
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      You are not upgraded. You can pick winners {5 - generateCount} more times.{' '}
                      <Link href="/pricing" className="btn btn-warning ms-3">
                        Upgrade
                      </Link>
                    </p>
                  )
                ) : (
                  <p className="text-center p-3 alert-warning">
                    Please log in to use this tool.
                  </p>
                )}
              </div>
              <button className="ml-auto text-yellow-700" onClick={closeModal}>
                ×
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=example"
            className="border p-2 rounded sm:w-2/3"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <button
            onClick={handlePickWinner}
            className="bg-red-500 text-white p-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Pick a Winner'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-bold mb-2">YouTube Comment Options:</h3>
            <div className="flex items-center space-x-2 mb-2">
              <label>Include replies to comments</label>
              <input
                type="checkbox"
                checked={includeReplies}
                onChange={() => setIncludeReplies(!includeReplies)}
              />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <label>Filter duplicate users/names</label>
              <input
                type="checkbox"
                checked={filterDuplicates}
                onChange={() => setFilterDuplicates(!filterDuplicates)}
              />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <label>Filter comments on specific text</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">YouTube Raffle Options:</h3>
            <div className="flex items-center space-x-2 mb-2">
              <label>No. of winners:</label>
              <select
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(parseInt(e.target.value))}
                className="border p-2 rounded"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {winner && (
        <div className="bg-white p-4 rounded-lg sm:w-1/3 w center shadow-md mt-5 winner-card">
          <h3 className="text-xl font-bold text-center mb-4">Winner</h3>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-4">
              <img src={winner.avatar} alt={winner.user} className="w-full h-full rounded-full object-cover" />
            </div>
            <p className="text-lg font-bold">
              <Link target='_blank' href={winner.channelUrl}>
                @{winner.user}
              </Link>
            </p>
            <p className="text-gray-600">{winner.text}</p>
            <div className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-1 text-red-500">
                <FaHeart />
                <span>{winner.likes}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-500">
                <FaComment />
                <span>{winner.replies}</span>
              </div>
            </div>
          </div>
        </div>
      )}
       <div className="content pt-6 pb-5">
                    <div
                        dangerouslySetInnerHTML={{ __html: existingContent }}
                        style={{ listStyleType: "none" }}
                    ></div>
                </div>
                {/* Review Form */}
            {user && (
                <div className="mt-8 review-card">
                    <h2 className="text-2xl font-semibold mb-4">Leave a Review</h2>
                    <div className="mb-4">
                        <StarRating rating={newReview.rating} setRating={(rating) => setNewReview({ ...newReview, rating })} />
                    </div>
                    <div className="mb-4">
                        <textarea
                            className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                            placeholder="Your Review"
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        />
                    </div>
                    <button
                        className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                        onClick={handleReviewSubmit}
                    >
                        Submit Review
                    </button>
                </div>
            )}
            {/* Reviews Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5">
                {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                        <div className="w-12 text-right mr-4">{rating}-star</div>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full relative">
                            <div className="h-4 bg-yellow-500 rounded-full absolute top-0 left-0" style={{ width: `${calculateRatingPercentage(rating)}%` }}></div>
                        </div>
                        <div className="w-12 text-left ml-4">{calculateRatingPercentage(rating).toFixed(1)}%</div>
                    </div>
                ))}
            </div>
            <div className="review-card pb-5">
                <Slider {...settings}>
                    {reviews.map((review, index) => (
                        <div key={index} className="p-4 bg-white shadow rounded-lg mt-5">
                            <div className="flex items-center mb-2">
                                {[...Array(5)].map((star, i) => (
                                    <FaStar
                                        key={i}
                                        size={24}
                                        color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                                    />
                                ))}
                                <span className="ml-2 text-xl font-bold">{review.rating.toFixed(1)}</span>
                            </div>
                            <div>
                                <p className="text-gray-600 text-right me-auto">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                            <p className="text-lg font-semibold">{review.comment}</p>
                            <p className="text-gray-600">- {review.name}</p>
                            {review.userProfile && (
                                <img
                                    src={review.userProfile}
                                    alt="User Profile"
                                    className="w-12 h-12 rounded-full mt-2"
                                />
                            )}
                        </div>
                    ))}
                </Slider>

            </div>

    </div>
    
  );
};

export default YouTubeCommentPicker;