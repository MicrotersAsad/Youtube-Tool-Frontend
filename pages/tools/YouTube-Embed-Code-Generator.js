/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaTwitter,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component

const YtEmbedCode = () => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateCount, setGenerateCount] = useState(2);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [quillContent, setQuillContent] = useState('');
    const [existingContent, setExistingContent] = useState('');
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=YouTube-Embed-Code-Generator`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        console.log(data);
        if (data && data.length > 0 && data[0].content) {
          const sanitizedContent = sanitizeHtml(data[0].content, {
            allowedTags: ["h2", "h3", "p", "li", "a"],
            allowedAttributes: {
              a: ["href"],
            },
          });
          setContent(sanitizedContent);
          setMeta({
            title: data[0].title || "Youtube Embed Code Generator",
            description:
              data[0].description ||
              "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
            image: data[0].image || "https://yourwebsite.com/og-image.png",
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

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        "/api/reviews?tool=youtube-embed-code-generator"
      );
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const fetchYouTubeData = async () => {
    if (!videoUrl) {
      setError("Please enter a valid YouTube URL");
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount <= 0) {
      toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
      return;
  }
    s

    try {
      setLoading(true);
      setError("");
      const videoId = extractVideoId(videoUrl);
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );

      setEmbedCode(
        `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      );

      if (user && user.paymentStatus !== "success") {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      setError("Failed to fetch YouTube data. Please check the video URL.");
      setEmbedCode("");
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    const match = url.match(regex);
    return match ? match[2] : null;
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
          tool: "youtube-embed-code-generator",
          ...newReview,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setNewReview({ rating: 0, comment: "" });
      fetchReviews(); // Refresh the reviews
    } catch (error) {
      toast.error("Failed to submit review");
    }
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter((review) => review.rating === rating)
      .length;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta
          property="og:image"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
        <meta
          name="twitter:card"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
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
        <meta
          name="twitter:image"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
      </Head>
      <ToastContainer />
      <h2 className="text-3xl pt-5">Youtube Embed Code Generator</h2>
      <div
        className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3"
        role="alert"
      >
        <div className="flex">
          <div className="py-1">
            <svg
              className="fill-current h-6 w-6 text-yellow-500 mr-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            ></svg>
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
              {loading ? "Loading..." : "Fetch Video"}
            </button>
          </div>
          <small className="text-muted">
            Example: https://youtu.be/eUDKzw0gLg
          </small>
          <br />
          <div className="ms-5">
            <button className="btn btn-danger mt-3" onClick={handleShareClick}>
              <FaShareAlt />
            </button>
            {showShareIcons && (
              <div className="share-icons mt-3">
                <FaFacebook
                  className="facebook-icon"
                  onClick={() => shareOnSocialMedia("facebook")}
                />
                <FaInstagram
                  className="instagram-icon"
                  onClick={() => shareOnSocialMedia("instagram")}
                />
                <FaTwitter
                  className="twitter-icon"
                  onClick={() => shareOnSocialMedia("twitter")}
                />
                <FaLinkedin
                  className="linkedin-icon"
                  onClick={() => shareOnSocialMedia("linkedin")}
                />
              </div>
            )}
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {embedCode && (
            <div>
              <div
                dangerouslySetInnerHTML={{ __html: embedCode }}
                className="embed-code-preview"
              ></div>
              <h4 className="mt-4">Embed Code:</h4>
              <textarea
                className="form-control"
                rows="3"
                readOnly
                value={embedCode}
              ></textarea>
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
  );
};

export default YtEmbedCode;
