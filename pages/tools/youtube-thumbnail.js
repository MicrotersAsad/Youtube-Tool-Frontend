/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter, FaStar } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { ToastContainer, toast } from 'react-toastify';
import Head from 'next/head';
import sanitizeHtml from 'sanitize-html';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component

const YtThumbnailDw = () => {
    const { isLoggedIn, user, updateUserProfile } = useAuth(); // Added user and updateUserProfile
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [thumbnails, setThumbnails] = useState(null);
    const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState('');
    const [generateCount, setGenerateCount] = useState(0);
    const [showShareIcons, setShowShareIcons] = useState(false);
    const [content, setContent] = useState("");
    const [meta, setMeta] = useState("");
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
    const [quillContent, setQuillContent] = useState('');
    const [existingContent, setExistingContent] = useState('');
    const [isUpdated, setIsUpdated] = useState(false);
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=Youtube-Thumbnails-Generator`);
                if (!response.ok) {
                    throw new Error("Failed to fetch content");
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

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await fetch("/api/reviews?tool=yt-thumbnail-downloader");
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        }
    };

    const handleReviewSubmit = async () => {
        if (!newReview.rating || !newReview.comment) {
            toast.error("Please fill in both rating and comment.");
            return;
        }

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tool: "yt-thumbnail-downloader",
                    rating: newReview.rating,
                    comment: newReview.comment,
                    user: user.id,
                }),
            });

            if (response.ok) {
                toast.success("Review submitted successfully!");
                setNewReview({ rating: 0, comment: "" });
                fetchReviews();
            } else {
                toast.error("Failed to submit review.");
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast.error("Failed to submit review.");
        }
    };

    const handleUrlChange = (e) => {
        setVideoUrl(e.target.value);
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    const fetchYouTubeData = async () => {
        if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount <= 0) {
            toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
            return;
        }
        try {
            setLoading(true);
            setError('');
            const videoId = extractVideoId(videoUrl);

            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`);

            const thumbnailData = response.data.items[0].snippet.thumbnails;

            setThumbnails(thumbnailData);
        } catch (error) {
            console.error('Error fetching YouTube data:', error); // Log error
            setError('Failed to fetch YouTube data. Please check the video URL.');
            setThumbnails(null);
            setSelectedThumbnailUrl('');
        } finally {
            setLoading(false);
        }
    };

    const extractVideoId = (url) => {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
        const match = url.match(regex);
        return match ? match[2] : null;
    };

    const downloadThumbnail = () => {
        if (!selectedThumbnailUrl) return;

        const fileName = 'YouTube_thumbnail.jpg';

        // Fetch the thumbnail image data
        fetch(selectedThumbnailUrl)
            .then(response => response.blob())
            .then(blob => {
                // Create a temporary URL for the image blob
                const url = window.URL.createObjectURL(new Blob([blob]));

                // Create a temporary anchor element to trigger the download
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName;
                document.body.appendChild(anchor);
                anchor.click();

                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(anchor);
            })
            .catch(error => {
                console.error('Error downloading thumbnail:', error);
                // Handle error
            });
    };

    const calculateRatingPercentage = (rating) => {
        const totalReviews = reviews.length;
        const ratingCount = reviews.filter((review) => review.rating === rating).length;
        return (ratingCount / totalReviews) * 100;
    };

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:image" content={meta.image} />
                <meta name="twitter:card" content={meta.image} />
                <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
                <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content={meta.image} />
            </Head>
            <h2 className='text-3xl pt-5'>YouTube Thumbnails Generator</h2>
            <ToastContainer />
            <div className="text-center pt-4 pb-4">
                <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
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
                                Please payment in to use this tool.
                            </p>
                        )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="row justify-content-center pt-5">
                <div className="col-md-6">
                    <div className="input-group mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter YouTube Video URL..."
                            aria-label="YouTube Video URL"
                            value={videoUrl}
                            onChange={handleUrlChange}
                        />
                        <button
                            className="btn btn-danger"
                            type="button"
                            onClick={fetchYouTubeData}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Fetch Thumbnail'}
                        </button>
                    </div>
                    <small className="text-muted">
                        Example: https://www.youtube.com/watch?v=j6X9tH9y_cs
                    </small>
                    <br />
                    <div className='ms-5'>
                        <button className="btn btn-danger mt-3" onClick={handleShareClick}>
                            <FaShareAlt />
                        </button>
                        {showShareIcons && (
                            <div className="share-icons mt-3">
                                <FaFacebook className="facebook-icon" />
                                <FaInstagram className="instagram-icon" />
                                <FaTwitter className="twitter-icon" />
                                <FaLinkedin className="linkedin-icon" />
                            </div>
                        )}
                    </div>
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    <div className="d-flex flex-wrap justify-content-center">
                        {thumbnails && Object.entries(thumbnails).map(([resolution, { url }]) => (
                            <div key={resolution} className={`p-2 ${url === selectedThumbnailUrl ? 'selected' : ''}`} onClick={() => setSelectedThumbnailUrl(url)}>
                                <Image
                                    src={url}
                                    alt={`Thumbnail ${resolution}`}
                                    className="img-thumbnail"
                                    style={{ border: url === selectedThumbnailUrl ? '3px solid blue' : 'none', cursor: 'pointer' }}
                                />
                                <p className="text-center">{resolution}</p>
                            </div>
                        ))}
                    </div>
                    {selectedThumbnailUrl && (
                        <button className="btn btn-danger mt-3" onClick={downloadThumbnail}>
                            <FaDownload />
                        </button>
                    )}
                </div>
                <div className="content pt-6 pb-5">
                    <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
                </div>
                <div>
                    <div className="review-card">
                        <h3 className="text-xl font-bold mb-4">Add a Review</h3>
                        <div className="mb-3">
                        <StarRating rating={newReview.rating} setRating={(rating) => setNewReview({ ...newReview, rating })} />
                        </div>
                        <textarea
                            className="form-control mb-3"
                            placeholder="Add your review..."
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        ></textarea>
                        <button className="btn btn-primary" onClick={handleReviewSubmit}>
                            Submit Review
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5">
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
                                        <span className="ml-2 text-xl font-bold">
                                            {review.rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-right me-auto">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-lg font-semibold">{review.comment}</p>
                                    <p className="text-gray-600">- {user?.username}</p>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .selected {
                    border: 3px solid blue;
                }
                .img-thumbnail {
                    cursor: pointer;
                }
                .review-card {
                    margin-top: 20px;
                    padding: 20px;
                    background-color: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                }
                .share-icons {
                    display: flex;
                    justify-content: space-between;
                    width: 150px;
                }
            `}</style>
        </div>
    );
};

export default YtThumbnailDw;
