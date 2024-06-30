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
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Head from "next/head";
const YtThumbnailDw = () => {
  const { isLoggedIn, user, updateUserProfile, logout } = useAuth(); // Added logout
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [thumbnails, setThumbnails] = useState(null);
  const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState("");
  const [generateCount, setGenerateCount] = useState(0);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=Youtube-Thumbnails-Generator`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || "");
        setExistingContent(data[0]?.content || "");
        setMeta(data[0]);
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem("generateCount"), 10) || 0;
      setGenerateCount(count);
    }
  }, []);

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
          tool: "yt-thumbnail-downloader",
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

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const fetchYouTubeData = async () => {
    if (generateCount <= 0) {
      toast.error("You have reached the limit of generating titles. Please upgrade your plan for unlimited use.");
      return;
    }
    if (!videoUrl) {
      toast.error("Please enter a valid YouTube video URL.");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error("Failed to fetch API tokens");
  
      const tokens = await tokensResponse.json();
      const videoId = extractVideoId(videoUrl);
      let dataFetched = false;
  
      for (const { token } of tokens) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${token}`
          );
  
          if (response.data.items && response.data.items.length > 0) {
            const { thumbnails } = response.data.items[0].snippet;
            console.log(thumbnails);
            setThumbnails(thumbnails);
            dataFetched = true;
            break; // Exit loop on success
          } else {
            console.error("No video data found for the provided URL.");
          }
        } catch (error) {
          console.error(`Error fetching data with token ${token}:`, error.response?.data || error.message);
        }
      }
  
      if (!dataFetched) {
        throw new Error("All API tokens exhausted or failed to fetch data.");
      }
    } catch (error) {
      setError("Failed to fetch YouTube data. Please check the video URL.");
      console.error("Error:", error);
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

  const downloadThumbnail = (url) => {
    if (!url) {
      toast.error("No thumbnail URL selected.");
      return;
    }

    window.location.href = url;
  };
  
  
  
  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter(
      (review) => review.rating === rating
    ).length;
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
      <h2 className="text-3xl pt-5 text-white">YouTube Thumbnails Generator</h2>
      <ToastContainer />
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
                        Congratulations! Now you can generate unlimited Titles.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can generate titles{" "}
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
              {loading ? "Loading..." : "Fetch Thumbnail"}
            </button>
          </div>
          <small className="text-white">
            Example: https://www.youtube.com/watch?v=j6X9tH9y_cs
          </small>
          <br />
          <div className="ms-5">
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
          </div>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          </div>
          </div>
          </div>
          <div className="max-w-7xl mx-auto p-4">
          <div className="d-flex flex-wrap justify-content-center">
            {thumbnails &&
              Object.entries(thumbnails).map(([resolution, { url }]) => (
                <div
                  key={resolution}
                  className={`p-2 ${
                    url === selectedThumbnailUrl ? "selected" : ""
                  }`}
                  onClick={() => setSelectedThumbnailUrl(url)}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${resolution}`}
                    width={200}
                    height={150}
                    className="img-thumbnail"
                    style={{
                      border:
                        url === selectedThumbnailUrl
                          ? "3px solid blue"
                          : "none",
                      cursor: "pointer",
                    }}
                  />
                  <p className="text-center">{resolution}</p>
                </div>
              ))}
          </div>
        <div className="text-center mt-4">  
          {selectedThumbnailUrl && (
             <button className="btn btn-danger">
          <Link  target="_blank" href={selectedThumbnailUrl} download="YouTube_thumbnail.jpg">
         
            <FaDownload  className="text-white"/>
          
        </Link>
        </button>
        
         
          )}
          </div>
    
        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>
        <div>
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
    </>
  );
};

export default YtThumbnailDw;
