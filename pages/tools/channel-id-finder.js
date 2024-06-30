import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '../../contexts/AuthContext';
import Slider from "react-slick";
import { FaStar } from 'react-icons/fa';
import StarRating from "./StarRating";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from 'next/image';
import Head from 'next/head';

const ChannelIdFinder = () => {
    const { user, updateUserProfile } = useAuth();
    const [modalVisible, setModalVisible] = useState(true);
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [channelData, setChannelData] = useState(null);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    const [meta, setMeta] = useState('');
    const [isUpdated, setIsUpdated] = useState(false);
    const [generateCount, setGenerateCount] = useState(0);
    const [quillContent, setQuillContent] = useState('');
    const [existingContent, setExistingContent] = useState('');
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ name: '', rating: 0, comment: '', userProfile: '' });
    const [showReviewForm, setShowReviewForm] = useState(false);

    const closeModal = () => setModalVisible(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=channel-id-finder`);
                if (!response.ok) throw new Error('Failed to fetch content');
                const data = await response.json();
                setQuillContent(data[0]?.content || '');
                setExistingContent(data[0]?.content || '');
                setMeta(data[0]);
            } catch (error) {
                toast.error("Error fetching content");
            }
        };

        fetchContent();
        fetchReviews();
    }, []);

   

    const handleQuillChange = useCallback((newContent) => {
        setQuillContent(newContent);
    }, []);

    useEffect(() => {
        if (user && user.paymentStatus !== 'success' && !isUpdated) {
            updateUserProfile().then(() => setIsUpdated(true));
        }
    }, [user, updateUserProfile, isUpdated]);

    useEffect(() => {
        if (user && user.paymentStatus !== 'success' && user.role !== 'admin') {
            const storedCount = localStorage.getItem("generateCount");
            setGenerateCount(storedCount ? parseInt(storedCount) : 3);
        }
    }, [user]);

    useEffect(() => {
        if (user && (user.paymentStatus === 'success' || user.role === 'admin')) {
            localStorage.removeItem("generateCount");
        }
    }, [user]);

    const fetchVideoData = async (videoUrl) => {
        try {
            const response = await fetch('/api/fetch-channel-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });
            if (!response.ok) throw new Error('Failed to fetch channel data');
            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Unknown error occurred');
        }
    };

    const handleFetch = async () => {
        if (!user) {
            toast.error('Please log in to fetch channel data.');
            return;
        }

        if (!videoUrl) {
            toast.error('Please enter a YouTube video URL.');
            return;
        }

        if (generateCount >= 3 && user.paymentStatus !== 'success' && user.role !== 'admin') {
            toast.error('Fetch limit exceeded. Please upgrade for unlimited access.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data = await fetchVideoData(videoUrl);
            setChannelData(data);
            toast.success('Channel data fetched successfully!');
            if (user && user.paymentStatus !== 'success' && user.role !== 'admin') {
                const newCount = generateCount + 1;
                setGenerateCount(newCount);
                localStorage.setItem("generateCount", newCount);
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };
    const fetchReviews = async () => {
        try {
          const response = await fetch("/api/reviews?tool=channel-id-finder");
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
              tool: "channel-id-finder",
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

    return (
        <>
            <div className='bg-box'>
                <div>
                    <Image className='shape1' src={announce} alt="announce" />
                    <Image className='shape2' src={cloud} alt="cloud" />
                    <Image className='shape3' src={cloud2} alt="cloud2" />
                    <Image className='shape4' src={chart} alt="chart" />
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
                    <ToastContainer />
                    <h1 className="text-3xl font-bold text-center text-white mb-6">YouTube Channel Data Fetcher</h1>
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
                        Congratulations! Now you can get  unlimited Channel Data.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can get Channel Data{" "}
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
                    <div className="max-w-md mx-auto">
                        <div className="input-group mb-4">
                            <input
                                type="text"
                                className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                                placeholder="Enter YouTube Video URL..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                onKeyPress={(event) => {
                                    if (event.key === 'Enter') handleFetch();
                                }}
                            />
                            <small className='text-white'>Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s</small>
                        </div>
                        <button
                            className={`btn btn-danger w-full text-white font-bold py-2 px-4 rounded hover:bg-red-700 focus:outline-none focus:shadow-outline ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
                            onClick={handleFetch}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Fetch Data'}
                        </button>
                    </div>
                    {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
                </div>
            </div>
            <div className="max-w-7xl mx-auto p-4">
                {channelData && (
                    <div className="mt-8">
                        <p><strong>Channel ID:</strong> {channelData.channelId}</p>
                        <p className="text-2xl font-semibold"><strong>Channel Name:</strong> {channelData.channelName}</p>
                        <p><strong>Channel URL:</strong> <a href={channelData.channelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">{channelData.channelUrl}</a></p>
                        <p><strong>Description:</strong> {channelData.channelDescription}</p>
                        <p><strong>Subscribers:</strong> {channelData.subscribers}</p>
                        <p><strong>Total Views:</strong> {channelData.totalViews}</p>
                        <p><strong>Video Count:</strong> {channelData.videoCount}</p>
                        <p><strong>Tags:</strong> {channelData.channelTags}</p>
                        <div className="flex flex-wrap justify-center mt-4">
                            <img src={channelData.channelProfileImage} alt="Channel Profile" className="w-24 h-24 rounded-full mx-2" />
                         
                            
                        </div>
                       <div className='flex flex-wrap justify-center mt-4'>
                       <a href={channelData.channelProfileImage} download>
                                <button className="btn btn-primary mt-2">Download Profile Image</button>
                            </a>
                    </div>
                       </div>
                       
                )}
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

                {/* Reviews Slider */}
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

export default ChannelIdFinder;
