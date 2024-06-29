import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaStar } from 'react-icons/fa';
import StarRating from './StarRating';
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";

const MonetizationChecker = () => {
    const { user, updateUserProfile } = useAuth();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [meta, setMeta] = useState({});
    const [isUpdated, setIsUpdated] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '', userProfile: '' });
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [quillContent, setQuillContent] = useState(''); // State to handle content from Quill editor
    const [existingContent, setExistingContent] = useState(''); // State to handle existing content
    const [modalVisible, setModalVisible] = useState(true);
    const [generateCount, setGenerateCount] = useState(0); // State to handle count of data generation
    const closeModals = () => {
        setModalVisible(false);
    };

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch('/api/content?category=monetization-checker');
                if (!response.ok) throw new Error('Failed to fetch content');
                const data = await response.json();
               
                setQuillContent(data[0]?.content || '');
                setExistingContent(data[0]?.content || '');
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
            const response = await fetch('/api/reviews?tool=monetization-checker');
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        }
    };

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

    const handleInputChange = (e) => {
        setError('');
        setUrl(e.target.value);
    };

    const handleFetchClick = async () => {
        if (!url.trim()) {
            toast.error('Please enter a valid URL.');
            return;
        }

        setLoading(true);
        setError('');
        setData(null);

        try {
            const response = await fetch('/api/monetization-checker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Failed to fetch data');
            }

            const data = await response.json();
            setData(data);
            toast.success('Data fetched successfully!');
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const convertDuration = (duration) => {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (parseInt(match[1], 10) || 0);
        const minutes = (parseInt(match[2], 10) || 0);
        const seconds = (parseInt(match[3], 10) || 0);

        return `${hours > 0 ? hours + ' hours, ' : ''}${minutes > 0 ? minutes + ' minutes, ' : ''}${seconds > 0 ? seconds + ' seconds' : ''}`.trim();
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
                    tool: 'monetization-checker',
                    ...newReview,
                    userProfile: user?.profileImage || '',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit review');
            }

            toast.success('Review submitted successfully!');
            setNewReview({ rating: 0, comment: '', userProfile: '' });
            fetchReviews();
        } catch (error) {
            toast.error('Failed to submit review');
        }
    };

    const calculateRatingPercentage = (rating) => {
        const totalReviews = reviews.length;
        const ratingCount = reviews.filter(review => review.rating === rating).length;
        return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
    };

    const sliderSettings = {
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
                },
            },
        ],
    };

    const closeModal = () => {
        setShowReviewForm(false);
    };

    return (
        <>
            <div className='bg-box'>
                <div>
                    <Image className='shape1' src={announce} alt="announce" />
                    <Image className='shape2' src={cloud} alt="announce" />
                    <Image className='shape3' src={cloud2} alt="announce" />
                    <Image className='shape4' src={chart} alt="announce" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
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
                    <h1 className="text-3xl font-bold text-center mb-6 text-white">YouTube Monetization Checker</h1>
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
                                                Congratulations! You can now check monetization unlimited times.
                                            </p>
                                        ) : (
                                            <p className="text-center p-3 alert-warning">
                                                You are not upgraded. You can check monetization {5 - generateCount}{" "}
                                                more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-center p-3 alert-warning">
                                            Please log in to check monetization.
                                        </p>
                                    )}
                                </div>
                                <button className="text-yellow-700 ml-auto" onClick={() => setModalVisible(false)}>×</button>
                            </div>
                        </div>
                    )}
                    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
                        <div className="mb-4">
                            <input
                                type="text"
                                className="form-control block w-full px-3 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                                placeholder="Enter YouTube Video or Channel URL..."
                                value={url}
                                onChange={handleInputChange}
                            />
                            <small className='text-muted'>Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s</small>
                        </div>
                        <button
                            className={`btn btn-danger w-full py-2 text-white font-bold rounded transition-colors duration-200 ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'} focus:outline-none focus:shadow-outline`}
                            onClick={handleFetchClick}
                            disabled={loading || !user}
                        >
                            {loading ? 'Loading...' : 'Check Monetization'}
                        </button>
                    </div>
                    {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
                </div>
            </div>
            <div className="max-w-7xl mx-auto p-4">
                {data && (
                    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                        {data.type === 'video' && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <Image
                                        src={data.thumbnails.high.url}
                                        alt="Video Thumbnail"
                                        width={300}
                                        height={300}
                                        className="rounded-lg"
                                    />
                                </div>
                                <table className="min-w-full bg-white">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 border">Property</th>
                                            <th className="px-4 py-2 border">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-4 py-2 border">Video URL</td>
                                            <td className="px-4 py-2 border"><a href={data.videoUrl} target="_blank" rel="noopener noreferrer">{data.videoUrl}</a></td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Channel URL</td>
                                            <td className="px-4 py-2 border"><a href={data.channelUrl} target="_blank" rel="noopener noreferrer">{data.channelUrl}</a></td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Title</td>
                                            <td className="px-4 py-2 border">{data.title}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Description</td>
                                            <td className="px-4 py-2 border">{data.description}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">View Count</td>
                                            <td className="px-4 py-2 border">{data.viewCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Like Count</td>
                                            <td className="px-4 py-2 border">{data.likeCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Dislike Count</td>
                                            <td className="px-4 py-2 border">{data.dislikeCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Comment Count</td>
                                            <td className="px-4 py-2 border">{data.commentCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Duration</td>
                                            <td className="px-4 py-2 border">{convertDuration(data.duration)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Published At</td>
                                            <td className="px-4 py-2 border">{data.publishedAt}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Channel Title</td>
                                            <td className="px-4 py-2 border">{data.channelTitle}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Monetization Status</td>
                                            <td className="px-4 py-2 border">{data.isMonetized}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </>
                        )}
                        {data.type === 'channel' && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <Image
                                        src={data.thumbnails.high.url}
                                        alt="Channel Thumbnail"
                                        width={300}
                                        height={300}
                                        className="rounded-lg"
                                    />
                                </div>
                                <table className="min-w-full bg-white">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 border">Property</th>
                                            <th className="px-4 py-2 border">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-4 py-2 border">Channel URL</td>
                                            <td className="px-4 py-2 border"><a href={data.channelUrl} target="_blank" rel="noopener noreferrer">{data.channelUrl}</a></td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Channel Title</td>
                                            <td className="px-4 py-2 border">{data.title}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Description</td>
                                            <td className="px-4 py-2 border">{data.description}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">View Count</td>
                                            <td className="px-4 py-2 border">{data.viewCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Subscriber Count</td>
                                            <td className="px-4 py-2 border">{data.subscriberCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Video Count</td>
                                            <td className="px-4 py-2 border">{data.videoCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 border">Monetization Status</td>
                                            <td className="px-4 py-2 border">{data.isMonetized}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}
                  <div className="content pt-6 pb-5">
                <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
            </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5 border p-5">
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
                {user && (
                    <div className="mt-8">
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                        >
                            {showReviewForm ? 'Hide Review Form' : 'Leave a Review'}
                        </button>
                        {showReviewForm && (
                            <div className="mt-4 review-card">
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
                    </div>
                )}
              
                <div className="review-card pb-5">
                    <Slider {...sliderSettings}>
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

export default MonetizationChecker;
