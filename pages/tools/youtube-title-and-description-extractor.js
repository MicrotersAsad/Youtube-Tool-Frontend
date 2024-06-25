/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaShareAlt,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaCopy,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component

const TitleDescriptionExtractor = () => {
  const { isLoggedIn, user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generateCount, setGenerateCount] = useState(5); // Set initial count to 5
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [modalVisable,setModalVisable]=useState(true)
  const closeModal=()=>{
    setModalVisable(false)
  }
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=youtube-title-and-description-extractor`
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
    fetchReviews();
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
      const response = await fetch(
        "/api/reviews?tool=title-description-extractor"
      );
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
          tool: "title-description-extractor",
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

  const fetchYouTubeData = async () => {
    if (generateCount <= 0) {
      toast.error(
        "You have reached the limit of generating titles. Please upgrade your plan for unlimited use."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      const videoId = extractVideoId(videoUrl);
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );
      const { title, description } = response.data.items[0].snippet;
      setTitle(title);
      setDescription(description);

      if (user && user.paymentStatus !== "success") {
        setGenerateCount(generateCount - 1); // Decrease count if not paid
      }
    } catch (error) {
      setError("Failed to fetch YouTube data. Please check the video URL.");
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error("Invalid YouTube video URL");
    }
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copied to clipboard!");
      },
      (err) => {
        toast.error("Failed to copy:", err);
      }
    );
  };

  const downloadText = (text, filename) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <h2 className="text-3xl pt-5">Youtube Tile & Description Extractor</h2>
      <ToastContainer />
      {
        modalVisable && (
          <div className="text-center pt-4 pb-4">
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
                  user.paymentStatus === "success" || user.role === "admin" ? (
                    <p className="text-center p-3 alert-warning">
                      Congratulations!! Now you can generate unlimited tags.
                    </p>
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      You are not upgraded. You can generate Title{" "}
                      {5 - generateCount} more times.{" "}
                      <Link href="/pricing" className="btn btn-warning ms-3">
                        Upgrade
                      </Link>
                    </p>
                  )
                ) : (
                  <p className="text-center p-3 alert-warning">
                    Please payment in to use this tool.
                  </p>
                )}
              </div>
              <button className="ml-auto text-yellow-700" onClick={closeModal}>×</button>
            </div>
          </div>
        </div>
        )
      }
     
      <div className="row justify-content-center pt-5">
        <div className="col-md-6">
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter YouTube Video URL..."
              aria-label="YouTube Video URL"
              aria-describedby="button-addon2"
              value={videoUrl}
              onChange={handleUrlChange}
            />
            <button
              className="btn btn-danger"
              type="button"
              id="button-addon2"
              onClick={fetchYouTubeData}
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch YouTube Data"}
            </button>
          </div>
          <small className="text-muted">
            Example: https://www.youtube.com/watch?v=SMoeVy9g3a8
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
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {title && (
            <div className="mt-3">
              <h6 className="pt-3 fw-bold">Title Found:</h6>
              <h3 className="border p-3">{title}</h3>
              <div className="pt-3">
                <button
                  className="btn btn-danger me-2"
                  onClick={() => copyToClipboard(title)}
                >
                  <FaCopy />
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => downloadText(title, "title.txt")}
                >
                  <FaDownload />
                </button>
              </div>
            </div>
          )}
          {description && (
            <div className="mt-3">
              <h6 className="pt-3 fw-bold">Description Found:</h6>
              <p>{description}</p>
              <div className="pt-3">
                <button
                  className="btn btn-danger me-2"
                  onClick={() => copyToClipboard(description)}
                >
                  <FaCopy />
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => downloadText(description, "description.txt")}
                >
                  <FaDownload />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>
        <div>
          <div className="review-card">
            <h3 className="text-xl font-bold mb-4">Add a Review</h3>
            <div className="mb-3">
              <StarRating
                rating={newReview.rating}
                setRating={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>
            <textarea
              className="form-control mb-3"
              placeholder="Add your review..."
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
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
                <div
                  key={index}
                  className="p-4 bg-white shadow rounded-lg mt-5"
                >
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
    </div>
  );
};

export default TitleDescriptionExtractor;
