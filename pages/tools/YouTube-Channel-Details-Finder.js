import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import StarRating from './StarRating'; // Import StarRating component
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaStar } from 'react-icons/fa';
import Image from 'next/image';
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
const YouTubeChannelScraper = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [minSubscriber, setMinSubscriber] = useState(0);
  const [maxSubscriber, setMaxSubscriber] = useState(Infinity);
  const [page, setPage] = useState(0);
  const [meta, setMeta] = useState({ title: '', description: '', image: '' });
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const [generateCount, setGenerateCount] = useState(
    typeof window !== 'undefined' ? Number(localStorage.getItem('generateCount')) || 0 : 0
  );
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=YouTube-Channel-finder`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || ''); // Ensure content is not undefined
        setExistingContent(data[0]?.content || ''); // Ensure existing content is not undefined
        setMeta(data[0]);
      } catch (error) {
        toast.error('Error fetching content');
      }
    };

    fetchContent();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=YouTube-Channel-Details-Finder");
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
          tool: "YouTube-Channel-Details-Finder",
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

  const handleSearchClick = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to fetch channel data.');
      return;
    }
    setLoading(true);
    setChannels([]);
    setFilteredChannels([]);
    setError('');
    if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount >= 5) {
      toast.error('You have reached the limit of generating tags. Please upgrade your plan for unlimited use.');
      setLoading(false);
      return;
    }
  
    try {
      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error("Failed to fetch API tokens");
  
      const tokens = await tokensResponse.json();
      let nextPageToken = '';
      let totalChannelsData = [];
      let tokenIndex = 0;
  
      while (totalChannelsData.length < 200 && nextPageToken !== null && tokenIndex < tokens.length) {
        const apiKey = tokens[tokenIndex].token;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(
          keyword
        )}&key=${apiKey}&pageToken=${nextPageToken}`;
        const searchResponse = await fetch(searchUrl);
  
        if (!searchResponse.ok) {
          if (searchResponse.status === 403) { // quota exceeded or invalid API key
            tokenIndex++;
            continue; // try the next token
          } else {
            throw new Error(`HTTP error! status: ${searchResponse.status}`);
          }
        }
  
        const searchData = await searchResponse.json();
        const channelIds = searchData.items.map((item) => item.snippet.channelId);
        const uniqueChannelIds = [...new Set(channelIds)];
        const channelsData = await getChannelsData(uniqueChannelIds, apiKey);
        totalChannelsData = totalChannelsData.concat(channelsData);
        nextPageToken = searchData.nextPageToken || null;
      }
  
      const filtered = filterChannels(totalChannelsData);
      setFilteredChannels(filtered);
      setChannels(filtered.slice(0, 50));
      setGenerateCount(generateCount + 1);
      localStorage.setItem('generateCount', generateCount + 1);
    } catch (error) {
      console.error('Error:', error);
      setError(`An error occurred while fetching channel data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const filterChannels = (channels) => {
    return channels.filter((channel) => {
      const subscribers = parseInt(channel.statistics.subscriberCount);
      return subscribers >= minSubscriber && subscribers <= maxSubscriber;
    });
  };
  
  const getChannelsData = async (channelIds, apiKey) => {
    const detailsPromises = channelIds.map(async (channelId) => {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${apiKey}`;
      const response = await fetch(detailsUrl);
      if (!response.ok) {
        if (response.status === 403) { // quota exceeded or invalid API key
          throw new Error(`Quota exceeded for key: ${apiKey}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      const data = await response.json();
      return data.items[0];
    });
  
    return Promise.all(detailsPromises);
  };
  

  const handlePagination = (pageIndex) => {
    const startIdx = pageIndex * 50;
    const endIdx = startIdx + 50;
    const currentPageChannels = filteredChannels.slice(startIdx, endIdx);
    setChannels(currentPageChannels);
    setPage(pageIndex);
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter((review) => review.rating === rating).length;
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
        },
      },
    ],
  };

  return (
    <>
    <div className="bg-box">
      <div>
        <Image className="shape1" src={announce} alt="announce" />
        <Image className="shape2" src={cloud} alt="announce" />
        <Image className="shape3" src={cloud2} alt="announce" />
        <Image className="shape4" src={chart} alt="announce" />
      </div>

      <div className="max-w-7xl mx-auto p-4">
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content={meta.image} />
        <meta
          property="twitter:domain"
          content="https://youtube-tool-frontend.vercel.app/"
        />
        <meta
          property="twitter:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Head>
      <h1 className="text-center text-white text-2xl font-bold mb-4">YouTube Channel Details Finder</h1>
      {modalVisible && (
            <div
              className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 shadow-md mb-6 mt-3"
              role="alert"
            >
              <div className="flex">
              <div className="mt-4">
                  {user ? (
                    user.paymentStatus === "success" ||
                    user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        Congratulations! Now you can get unlimited Channel Details.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can get  Channel Details{" "}
                        {5 - generateCount} more times.{" "}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          Upgrade
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      Please log in to fetch channel data.
                    </p>
                  )}
                </div>
                <button className="text-yellow-700 ml-auto" onClick={closeModal}>
                  ×
                </button>
              </div>
            </div>
          )}

      <form className="max-w-sm mx-auto" onSubmit={handleSearchClick}>
        <div className="mb-3">
          <label htmlFor="text" className="block mb-2 text-sm font-medium text-white dark:text-white">Enter Keyword</label>
          <input
            type="text"
            id="text"
            className="shadow-sm bg-gray-50 border border-gray-300 text-whitetext-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Enter Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="number" className="block mb-2 text-sm font-medium text-white dark:text-white">Min Subscriber</label>
          <input
            type="number"
            id="number"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Min Subscriber"
            value={minSubscriber}
            onChange={(e) => setMinSubscriber(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="repeat-number" className="block mb-2 text-sm font-medium text-white dark:text-white">Max Subscriber</label>
          <input
            type="number"
            id="repeat-number"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Max Subscriber"
            value={maxSubscriber}
            onChange={(e) => setMaxSubscriber(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Search
        </button>
      </form>

      {loading && <div className="loader mt-4 mx-auto"></div>}
      {error && <div className="text-red-500 text-center mt-4">{error}</div>}
      </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
      <div id="channelList" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 channels-grid">
        {channels.map((channel, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-4 channel-card">
            <img src={channel.snippet.thumbnails.high.url} alt={channel.snippet.title} className="w-full h-auto rounded-md mb-4" />
            <div className="channel-info">
              <Link href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold text-xl">
                {channel.snippet.title}
              </Link>
              <p className="text-gray-700">Subscribers: {channel.statistics.subscriberCount}</p>
              <p className="text-gray-700">Total Views: {channel.statistics.viewCount}</p>
              <p className="text-gray-700">Videos: {channel.statistics.videoCount}</p>
            </div>
          </div>
        ))}
      </div>
      <div id="pagination" className="text-center mt-3">
        {[...Array(Math.ceil(filteredChannels.length / 50)).keys()].map((_, i) => (
          <button key={i} className={`btn btn-sm btn-outline-primary me-2 ${page === i ? 'active' : ''}`} onClick={() => handlePagination(i)}>
            {i + 1}
          </button>
        ))}
      </div>
      <div className="content pt-6 pb-5">
        <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
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
      <ToastContainer />
    </div>
    </>
  );
};

export default YouTubeChannelScraper;
