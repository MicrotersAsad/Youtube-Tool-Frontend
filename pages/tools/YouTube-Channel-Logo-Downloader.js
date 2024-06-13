/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter, FaStar } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';
import Head from 'next/head';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import StarRating from './StarRating'; // Assuming StarRating is a custom component

const YouTubeChannelLogoDownloader = () => {
    const { isLoggedIn } = useAuth(); // Destructure authentication state from context
    const [loading, setLoading] = useState(false); // Loading state for API requests
    const [error, setError] = useState(''); // Error state
    const [channelUrl, setChannelUrl] = useState(''); // State for input URL
    const [logoUrl, setLogoUrl] = useState(''); // State for fetched logo URL
    const [showShareIcons, setShowShareIcons] = useState(false); // State to toggle share icons visibility
    const [generateCount, setGenerateCount] = useState(5); // Count for how many times data is fetched
    const [content, setContent] = useState(''); // Content state for fetched HTML content
    const [meta, setMeta] = useState({ // Meta information for the page
        title: 'YouTube Channel Logo Downloader',
        description: "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
        image: 'https://yourwebsite.com/og-image.png',
    });
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=YouTube-Channel-Logo-Downloader`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
                const data = await response.json();
                console.log(data);
                if (data && data.length > 0 && data[0].content) {
                    const sanitizedContent = sanitizeHtml(data[0].content, {
                        allowedTags: ['h2', 'h3', 'p', 'li', 'a'],
                        allowedAttributes: {
                            'a': ['href']
                        }
                    });
                    setContent(sanitizedContent);
                    setMeta({
                        title: data[0].title || 'YouTube Channel Logo Downloader',
                        description: data[0].description || meta.description,
                        image: data[0].image || meta.image
                    });
                } else {
                    toast.error("Content data is invalid");
                }
            } catch (error) {
                toast.error("Error fetching content");
            }
        };

        fetchContent();
        fetchReviews();
    }, [meta.description, meta.image]);

    const fetchReviews = async () => {
        try {
            const response = await fetch('/api/reviews?tool=youtube-channel-logo-downloader');
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        }
    };

    const handleUrlChange = (e) => {
        setChannelUrl(e.target.value);
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    const extractChannelId = (link) => {
        const match = link.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/)?([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const fetchChannelLogo = async () => {
        if (!channelUrl) {
            setError('Please enter a YouTube channel URL.');
            return;
        }

        const channelId = extractChannelId(channelUrl);
        if (!channelId) {
            setError('Invalid YouTube channel link.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`);
            const logoUrl = response.data.items[0].snippet.thumbnails.default.url;
            setLogoUrl(logoUrl);
        } catch (error) {
            toast.error('Failed to fetch channel logo:', error);
            setError('Failed to fetch data. Check console for more details.');
        } finally {
            setLoading(false);
        }
    };

    const downloadLogo = () => {
        if (!logoUrl) {
            setError('No logo to download.');
            return;
        }

        const fileName = 'YouTube_Channel_Logo.jpg';
        fetch(logoUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName;
                document.body.appendChild(anchor);
                anchor.click();

                window.URL.revokeObjectURL(url);
                document.body.removeChild(anchor);
            })
            .catch(error => {
                console.error('Error downloading image:', error);
                setError('Error downloading image. Check console for more details.');
            });
    };

    const shareOnSocialMedia = (socialNetwork) => {
        const url = encodeURIComponent(window.location.href);
        const socialMediaUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}`,
            instagram: "You can share this page on Instagram through the Instagram app on your mobile device.",
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        };

        if (socialNetwork === 'instagram') {
            alert(socialMediaUrls[socialNetwork]);
        } else {
            window.open(socialMediaUrls[socialNetwork], "_blank");
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
                    tool: 'youtube-channel-logo-downloader',
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:image" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
                <meta name="twitter:card" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
                <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
                <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
            </Head>
            <ToastContainer />
            <h2 className='text-3xl pt-5'>YouTube Channel Logo Downloader</h2>
            <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                    </div>
                    <div>
                        {isLoggedIn ? (
                            <p className="text-center p-3 alert-warning">
                                You are logged in and can generate unlimited tags.
                            </p>
                        ) : (
                            <p className="text-center p-3 alert-warning">
                                You are not logged in. You can generate tags {5 - generateCount}{" "}
                                more times.<Link href="/register" className="btn btn-warning ms-3">Registration</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="row justify-content-center pt-5">
                <div className="col-md-6">
                    <div className="input-group mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter YouTube Channel URL..."
                            aria-label="YouTube Channel URL"
                            value={channelUrl}
                            onChange={handleUrlChange}
                        />
                        <button
                            className="btn btn-danger"
                            type="button"
                            onClick={fetchChannelLogo}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Fetch Logo'}
                        </button>
                    </div>
                    <small className="text-muted">
                        Example:  https://www.youtube.com/channel/UCnUe75Y9iRieacBvWvn61fA
                    </small>
                    {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                    {logoUrl && (
                        <div className="text-center mt-3">
                            <Image src={logoUrl} alt="Channel Logo" width={100} height={100} />
                            <button className="btn btn-danger mt-3" onClick={downloadLogo}>
                                <FaDownload /> Download Logo
                            </button>
                        </div>
                    )}
                    <br />
                    <button className="btn btn-danger mt-2" onClick={handleShareClick}>
                        <FaShareAlt />
                    </button>
                    {showShareIcons && (
                        <div className="share-icons ms-2">
                            <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                            <FaInstagram
                                className="instagram-icon"
                                onClick={() => shareOnSocialMedia('instagram')}
                            />
                            <FaTwitter className="twitter-icon" onClick={() => shareOnSocialMedia('twitter')} />
                            <FaLinkedin className="linkedin-icon" onClick={() => shareOnSocialMedia('linkedin')} />
                        </div>
                    )}
                </div>
                <div className="content pt-6 pb-5">
                    <div dangerouslySetInnerHTML={{ __html: content }}></div>
                </div>
            </div>
            {/* Review Section */}
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
            {/* Reviews Section */}
            <div className="mt-8 review-card">
                <h2 className="text-2xl font-semibold mb-4">User Reviews</h2>
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
                            <p className="text-gray-600">- {user?.username}</p>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
};

export default YouTubeChannelLogoDownloader;
