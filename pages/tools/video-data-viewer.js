import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import {
  FaClock,
  FaEye,
  FaThumbsUp,
  FaThumbsDown,
  FaComments,
  FaLanguage,
  FaCalendarAlt,
  FaVideo,
  FaTags,
  FaInfoCircle,
  FaShareAlt,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";
import StarRating from "./StarRating"; // Import StarRating component
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";

const VideoDataViewer = () => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState("");
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [generateCount, setGenerateCount] = useState(0);
  const [meta, setMeta] = useState({
    title: "YouTube Video Data Viewer",
    description:
      "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
    image: "https://yourwebsite.com/og-image.png",
  });
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);

  const closeModal = () => {
    setModalVisible(false);
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      setGenerateCount(Number(localStorage.getItem("generateCount")) || 0);
    }

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
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=video-data-viewer`);
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

  const handleInputChange = (e) => {
    setError("");
    setVideoUrl(e.target.value);
  };

  const handleFetchClick = async () => {
    if (!user) {
      toast.error("Please log in to fetch video data.");
      setModalVisible(true);
      return;
    }

    if (!videoUrl.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    if (
      generateCount >= 3 &&
      user?.paymentStatus !== "success" &&
      user.role !== "admin"
    ) {
      setFetchLimitExceeded(true);
      toast.error("Fetch limit exceeded. Please upgrade for unlimited access.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/video-data-viewer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          hasUnlimitedAccess: user?.paymentStatus === "success",
          role: user?.role,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to fetch data");
      }

      const data = await response.json();
      setVideoData(data);
      const newGenerateCount = generateCount + 1;
      setGenerateCount(newGenerateCount);
      localStorage.setItem("generateCount", newGenerateCount);
      toast.success("Data fetched successfully!");
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=video-data-viewer");
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
          tool: "video-data-viewer",
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

  const shareOnSocialMedia = (socialNetwork) => {
    const url = encodeURIComponent(window.location.href);
    const socialMediaUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      instagram:
        "You can share this page on Instagram through the Instagram app on your mobile device.",
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    if (socialNetwork === "instagram") {
      alert(socialMediaUrls[socialNetwork]);
    } else {
      window.open(socialMediaUrls[socialNetwork], "_blank");
    }
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const formatDuration = (isoDuration) => {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match?.[1] ?? 0, 10);
    const minutes = parseInt(match?.[2] ?? 0, 10);
    const seconds = parseInt(match?.[3] ?? 0, 10);

    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`;
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter(
      (review) => review.rating === rating
    ).length;
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
              content="https://youtube-tool-frontend.vercel.app/tools/video-data-viewer"
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
              content="https://youtube-tool-frontend.vercel.app/tools/video-data-viewer"
            />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={meta.description} />
            <meta name="twitter:image" content={meta.image} />
          </Head>
          <h2 className="text-3xl pt-5 text-white">YouTube Video Data Viewer </h2>
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
                        Congratulations! Now you can View unlimited video Data.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can View video Data{" "}
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

          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <input
                type="text"
                className="form-control block w-full px-3 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter YouTube Video URL..."
                value={videoUrl}
                onChange={handleInputChange}
              />
              <small className="text-muted">
                Example:https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s
              </small>
            </div>
            <button
              className={`btn btn-danger w-full py-2 text-white font-bold rounded transition-colors duration-200 ${
                loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-700"
              } focus:outline-none focus:shadow-outline whitespace-nowrap`}
              onClick={handleFetchClick}
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch Data"}
            </button>
            <button
              className="btn btn-danger mt-5 ms-5 text-center"
              onClick={handleShareClick}
            >
              <FaShareAlt />
            </button>
            {showShareIcons && (
              <div className="share-icons ms-2">
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
            <div className="alert alert-danger text-red-500 text-center mt-4">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {videoData && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-center mb-4">
              <Image
                src={videoData.thumbnail || ""}
                alt="Video Cover"
                width={880}
                height={420}
                layout="intrinsic"
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
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaVideo className="mr-2" /> Category
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.category}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaClock className="mr-2" /> Duration
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.duration}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaEye className="mr-2" /> View Count
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.views}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaThumbsUp className="mr-2" />{" "}
                      <FaThumbsDown className="ml-2" /> Like/Dislike Count
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    {videoData.likes} / {videoData.dislikes}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaComments className="mr-2" /> Comment Count
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.commentCount}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaLanguage className="mr-2" /> Audio Language
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.audioLanguage}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2" /> Published At
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.uploadDate}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaVideo className="mr-2" /> Is Embeddable
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.isEmbeddable}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaTags className="mr-2" /> Video Tags
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    {Array.isArray(videoData.videoTags)
                      ? videoData.videoTags.join(", ")
                      : videoData.videoTags}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaInfoCircle className="mr-2" /> Description
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.description}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
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

export default VideoDataViewer;

