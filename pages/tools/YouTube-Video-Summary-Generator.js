// components/VideoSummarizer.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCopy, FaStar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClipLoader from 'react-spinners/ClipLoader';
import Slider from 'react-slick';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import StarRating from './StarRating'; // Assuming you have a StarRating component
import announce from "../../public/shape/announce.png"
import chart from "../../public/shape/chart (1).png"
import cloud from "../../public/shape/cloud.png"
import cloud2 from "../../public/shape/cloud2.png"
import Image from 'next/image';

const VideoSummarizer = () => {
  const { user, updateUserProfile, login, logout } = useAuth(); // Get the user object and auth functions from the AuthContext
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('Transcript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
  const [generateCount, setGenerateCount] = useState(2);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({}); // Ensure meta is an object
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true); // Modal visibility state
  const closeModal = () => {
    setModalVisible(false);
  };

  // Fetch content and reviews from API on component mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=YouTube-Video-Summary-Generator`);
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
      const response = await fetch("/api/reviews?tool=YouTube-Video-Summary-Generator");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleQuillChange = (newContent) => {
    setQuillContent(newContent);
  };

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && user.role !== "admin") {
      setGenerateCount(5);
    }
  }, [user]);

  const fetchSummary = async () => {
    if (user && user.paymentStatus !== "success" && generateCount <= 0) {
      toast.error(
        "You have reached the limit of generating tags. Please upgrade your plan for unlimited use."
      );
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/summarize', { videoUrl });
      console.log('API Response:', response.data); // Debugging log
      setVideoInfo(response.data.videoInfo);
      setTranscript(response.data.captions);
      setSummary(response.data.summaries);
    } catch (error) {
      console.error('Error summarizing video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch((error) => {
      console.error('Error copying text:', error);
      toast.error('Failed to copy text');
    });
  };

  // Handle review submission
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
          tool: 'YouTube-Video-Summary-Generator',
          ...newReview,
          userProfile: user?.profileImage || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setNewReview({ rating: 0, comment: '', userProfile: '' });
      fetchReviews(); // Refresh the reviews
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  // Calculate rating percentage
  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter(review => review.rating === rating).length;
    return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
  };

  // Slider settings
  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 2,
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

  // Handle login
  const handleLogin = () => {
    login().then(() => {
      toast.success('Logged in successfully!');
    }).catch((error) => {
      console.error('Login failed:', error);
      toast.error('Failed to log in');
    });
  };

  // Handle logout
  const handleLogout = () => {
    logout().then(() => {
      toast.success('Logged out successfully!');
    }).catch((error) => {
      console.error('Logout failed:', error);
      toast.error('Failed to log out');
    });
  };

  // Check if user is logged in on component mount
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <>
      <div className='bg-box'>
        <div>
          <Image className='shape1' src={announce} alt="announce" />
          <Image className='shape2' src={cloud} alt="announce" />
          <Image className='shape3' src={cloud2} alt="announce" />
          <Image className='shape4' src={chart} alt="announce" />
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <Head>
            <title>{meta.title}</title>
            <meta name="description" content={meta.description} />
            <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker" />
            <meta property="og:title" content={meta.title} />
            <meta property="og:description" content={meta.description} />
            <meta property="og:image" content={meta.image} />
            <meta name="twitter:card" content={meta.image} />
            <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
            <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker" />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={meta.description} />
            <meta name="twitter:image" content={meta.image} />
          </Head>
          {/* Toast container for notifications */}
          <ToastContainer />
          {/* Page title */}
          <h1 className="text-3xl font-bold text-center mb-6 text-white">YouTube Video Summarizer</h1>
          {/* Alert message for logged in/out users */}
          {modalVisible && (
            <div className=" bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3 z-50" role="alert">
              <div className="flex">
                <div className="py-1">
                  <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                </div>
                <div>
                  {user ? (
                    user.paymentStatus === 'success' || user.role === 'admin' ? (
                      <p className="text-center p-3 alert-warning">
                        Congratulations!! Now you can generate unlimited tags.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can generate Title {5 - generateCount}{" "}
                        more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      Please log in to use this tool.
                    </p>
                  )}
                </div>
                <button className="text-yellow-700 ml-auto" onClick={closeModal}>×</button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <input
              type="text"
              className="border rounded w-full sm:w-2/3 py-2 px-3 mt-12"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <button
              className="bg-red-500 text-white py-2 px-4 rounded mt-2"
              onClick={fetchSummary}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>
          <ToastContainer />
          {loading && (
            <div className="flex justify-center my-4">
              <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        {videoInfo && !loading && (
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
              <div className="border rounded pt-6 pb-14 pe-4 ps-4 ">
                <img src={videoInfo.thumbnail} alt="Video Thumbnail" className="mb-4" />
                <h2 className="text-xl font-bold mb-2">{videoInfo.title}</h2>
                <p className="mb-1">Author: {videoInfo.author}</p>
                <p className="mb-1">Video Duration: {videoInfo.duration}</p>
                <p className="mb-1">Video Published: {videoInfo.publishedAt}</p>
              </div>
            </div>
            <div className="w-full lg:w-2/3 lg:ml-4">
              <div className="border rounded p-4">
                <div className="mb-4">
                  <button
                    className={`py-2 px-4 rounded ${activeTab === 'Transcript' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveTab('Transcript')}
                  >
                    Transcript
                  </button>
                  <button
                    className={`py-2 px-4 rounded ml-2 ${activeTab === 'Summary' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveTab('Summary')}
                  >
                    Summary
                  </button>
                </div>
                {activeTab === 'Transcript' && (
                  <div className="overflow-y-auto max-h-96">
                    {transcript.map((segment, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-lg font-semibold text-sky-500"> {index + 1}:00</h6>
                          <FaCopy
                            className="cursor-pointer text-red-500 hover:text-gray-700"
                            onClick={() => handleCopy(segment.map(caption => caption.text).join(' '))}
                          />
                        </div>
                        <p>{segment.map(caption => caption.text).join(' ')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'Summary' && (
                  <div className="overflow-y-auto max-h-96">
                    {summary.map((sum, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-lg font-semibold text-sky-500"> {index + 1}:00</h6>
                          <FaCopy
                            className="cursor-pointer text-red-500 hover:text-gray-700"
                            onClick={() => handleCopy(sum)}
                          />
                        </div>
                        <p>{sum}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Render content from API */}
        <div className="content pt-6 pb-5">
          <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
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
    </>
  );
};

export default VideoSummarizer;
