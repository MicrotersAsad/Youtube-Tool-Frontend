import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '../../contexts/AuthContext';
import Slider from "react-slick";
import { FaStar } from 'react-icons/fa';
import StarRating from "./StarRating"; // Assuming StarRating is a custom component
import announce from "../../public/shape/announce.png"
import chart from "../../public/shape/chart (1).png"
import cloud from "../../public/shape/cloud.png"
import cloud2 from "../../public/shape/cloud2.png"
import Image from 'next/image';
import Head from 'next/head';

const ChannelIdFinder = () => {
    const { user, updateUserProfile } = useAuth(); // Custom hook for user authentication
    const [modalVisible, setModalVisible] = useState(true); // State to control modal visibility
    const [videoUrl, setVideoUrl] = useState(''); // State to hold the YouTube video URL
    const [loading, setLoading] = useState(false); // State to handle loading status
    const [channelData, setChannelData] = useState(null); // State to hold the fetched channel data
    const [error, setError] = useState(''); // State to handle errors
    const [content, setContent] = useState(''); // State to handle additional content
    const [meta, setMeta] = useState(''); // State to handle meta data for the page
    const [isUpdated, setIsUpdated] = useState(false); // State to handle user profile update status
    const [generateCount, setGenerateCount] = useState(0); // State to handle count of data generation
    const [quillContent, setQuillContent] = useState(''); // State to handle content from Quill editor
    const [existingContent, setExistingContent] = useState(''); // State to handle existing content
    const [reviews, setReviews] = useState([]); // State to handle reviews
    const [newReview, setNewReview] = useState({ name: '', rating: 0, comment: '', details: '', userProfile: '' }); // State to handle new review input

    // Function to close the modal
    const closeModal = () => {
        setModalVisible(false);
    };

    // Fetch content and reviews on component mount
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=channel-id-finder`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
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

    // Fetch reviews from the API
    const fetchReviews = async () => {
        try {
            const response = await fetch('/api/reviews?tool=channel-id-finder');
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        }
    };

    // Handle Quill editor content change
    const handleQuillChange = useCallback((newContent) => {
        setQuillContent(newContent);
    }, []);

    // Update user profile if payment status is not success and profile is not updated
    useEffect(() => {
        if (user && user.paymentStatus !== 'success' && !isUpdated) {
            updateUserProfile().then(() => setIsUpdated(true));
        }
    }, [user, updateUserProfile, isUpdated]);

    // Set generate count if user payment status is not success and role is not admin
    useEffect(() => {
        if (user && user.paymentStatus !== 'success' && user.role !== 'admin') {
            const storedCount = localStorage.getItem("generateCount");
            if (storedCount) {
                setGenerateCount(parseInt(storedCount));
            } else {
                setGenerateCount(3);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && (user.paymentStatus === 'success' || user.role === 'admin')) {
            localStorage.removeItem("generateCount");
        }
    }, [user]);

    // Fetch channel data from the API
    const fetchVideoData = async (videoUrl) => {
        try {
            const response = await fetch('/api/fetch-channel-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch channel data');
            }
            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Unknown error occurred');
        }
    };

    // Handle the fetch button click
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

    // Handle the review submission
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
                    tool: 'channel-id-finder',
                    ...newReview,
                    userProfile: user?.profileImage || '',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit review');
            }

            toast.success('Review submitted successfully!');
            setNewReview({ name: '', rating: 0, comment: '', details: '', userProfile: '' });
            fetchReviews(); // Refresh the reviews
        } catch (error) {
            toast.error('Failed to submit review');
        }
    };

    // Calculate the percentage of each rating
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

    return (
        <>
        <div className='bg-box'>
              <div>
                  <Image className='shape1' src={announce} alt="announce"/>
             
                  <Image className='shape2' src={cloud} alt="announce"/>
                  <Image className='shape3' src={cloud2} alt="announce"/>
                  <Image className='shape4' src={chart} alt="announce"/>
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
                <div className="fixed-modal bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                    <div className="flex">
                        <div className="py-1">
                            <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                        </div>
                        <div>
                            {!user ? (
                                <p className="text-center p-3 alert-warning">
                                    Please log in to fetch channel data.
                                </p>
                            ) : user?.paymentStatus === 'success' || user?.role === 'admin' ? (
                                <p className="text-center p-3 alert-warning">
                                    You are upgraded and can get unlimited channel details.
                                </p>
                            ) : (
                                <p className="text-center p-3 alert-warning">
                                    You are not upgraded. You can fetch data {3 - generateCount} more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link> for unlimited access.
                                </p>
                            )}
                        </div>
                        <button className="text-yellow-700 ml-auto" onClick={closeModal}>×</button>
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
                    <small className=' text-white'>Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s</small>
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
                        <img src={channelData.channelBannerImage} alt="Channel Banner" className="w-full rounded-lg" />
                    </div>
                </div>
            )}
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

export default ChannelIdFinder;
