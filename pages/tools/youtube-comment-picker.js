import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart, FaComment, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import StarRating from './StarRating';
import Head from 'next/head';

const YouTubeCommentPicker = ({ meta }) => {
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
  const [reviews, setReviews] = useState([]);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

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
      const response = await fetch("/api/reviews?tool=youtube-comment-picker");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment) {
      toast.error("All fields are required.");
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "youtube-comment-picker",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 0, comment: "", userProfile: "", userName: "" });
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
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
    <>
      <div className="bg-box">
        <div>
          <Image className="shape1" src={announce} alt="announce" />
          <Image className="shape2" src={cloud} alt="cloud" />
          <Image className="shape3" src={cloud2} alt="cloud2" />
          <Image className="shape4" src={chart} alt="chart" />
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <Head>
            <title>{meta.title}</title>
            <meta name="description" content={meta.description} />
            <meta property="og:url" content={meta.url} />
            <meta property="og:title" content={meta.title} />
            <meta property="og:description" content={meta.description} />
            <meta property="og:image" content={meta.image} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="twitter:domain" content={meta.url} />
            <meta property="twitter:url" content={meta.url} />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={meta.description} />
            <meta name="twitter:image" content={meta.image} />
          </Head>

          <ToastContainer />
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h1 className='text-center'>YouTube Comment Picker</h1>
            {modalVisible && (
              <div
                className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 shadow-md mb-6 mt-3"
                role="alert"
              >
                <div className="flex">
                  <div className="mt-4">
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
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
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
        {/* Reviews Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5 border shadow p-5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center">
              <div className="w-12 text-right mr-4">{rating}-star</div>
              <div className="flex-1 h-4 bg-gray-200 rounded-full relative">
                <div
                  className="h-4 bg-yellow-500 rounded-full absolute top-0 left-0"
                  style={{ width: `${calculateRatingPercentage(rating)}%` }}
                ></div>
              </div>
              <div className="w-12 text-left ml-4">
                {calculateRatingPercentage(rating).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* Review Form Toggle */}
        {user && !showReviewForm && (
          <button
            className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
            onClick={() => setShowReviewForm(true)}
          >
            Add Review
          </button>
        )}

        {/* Review Form */}
        {user && showReviewForm && (
          <div className="mt-8 review-card">
            <h2 className="text-2xl font-semibold mb-4">Leave a Review</h2>
            <div className="mb-4">
              <StarRating
                rating={newReview.rating}
                setRating={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>
            <div className="mb-4">
              <textarea
                className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Your Review"
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
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

        <div className="review-card pb-5">
          <Slider {...settings}>
            {reviews.map((review, index) => (
              <div key={index} className="p-6 bg-white shadow-lg rounded-lg relative mt-5 max-w-sm mx-auto">
                <div className="flex justify-center">
                  <Image
                    src={`data:image/jpeg;base64,${review?.userProfile}`}
                    alt={review.name}
                    className="w-16 h-16 rounded-full -mt-12 border-2 border-white"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="mt-6 text-center">
                  <p className="text-lg italic text-gray-700 mb-4">
                    “{review.comment}”
                  </p>
                  <h3 className="text-xl font-bold text-gray-800">{review.name}</h3>
                  <p className="text-sm text-gray-500">User</p>
                  <div className="flex justify-center mt-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        size={24}
                        color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold mt-2">{review.rating.toFixed(1)}</span>
                </div>
                <div className="absolute top-2 left-2 text-red-600 text-7xl">“</div>
                <div className="absolute bottom-2 right-2 text-red-600 text-7xl">”</div>
              </div>
            ))}
          </Slider>
        </div>

      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const { req } = context;
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const apiUrl = `${protocol}://${host}`;

  const response = await fetch(`${apiUrl}/api/content?category=youtube-comment-picker`);
  const data = await response.json();

  const meta = {
    title: data[0]?.title || "",
    description: data[0]?.description || "",
    image: data[0]?.image || "",
    url: `${apiUrl}/tools/youtube-comment-picker`,
  };

  return {
    props: {
      meta,
    },
  };
}

export default YouTubeCommentPicker;
