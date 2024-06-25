import React, { useState, useEffect } from "react";
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
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import Head from "next/head";
import StarRating from "./StarRating"; // Import StarRating component
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const YtChannelDw = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [content, setContent] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [meta, setMeta] = useState({
    title: "YouTube Channel Banner Downloader",
    description:
      "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
    image: "https://yourwebsite.com/og-image.png",
  });
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisable,setModalVisable]=useState(true)
  const closeModal=()=>{
    setModalVisable(false)
  }
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=YouTube-Channel-Banner-Downloader`
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
  }, [meta.description, meta.image]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        "/api/reviews?tool=yt-channel-banner-downloader"
      );
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

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

  const handleUrlChange = (e) => {
    setChannelUrl(e.target.value);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const fetchYouTubeData = async () => {
    try {
      if (
        user &&
        user.paymentStatus !== "success" &&
        user.role !== "admin" &&
        generateCount <= 0
      ) {
        toast.error(
          "You have reached the limit of generating tags. Please upgrade your plan for unlimited use."
        );
        return;
      }
      setLoading(true);
      setError("");
      const channelId = extractChannelId(channelUrl);
      if (!channelId) {
        throw new Error(
          "Invalid YouTube channel URL. Please enter a valid URL."
        );
      }
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=${channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );
      const brandingSettings = response.data?.items[0]?.brandingSettings;
      if (!brandingSettings) {
        throw new Error("Brand settings not found for this channel.");
      }
      const image = brandingSettings.image;
      if (!image) {
        throw new Error("Image settings not found for this channel.");
      }
      const bannerUrl = image.bannerExternalUrl;
      if (!bannerUrl) {
        throw new Error("Banner image URL not found for this channel.");
      }
      setBannerUrl(bannerUrl);
    } catch (error) {
      setError(
        error.message ||
          "Failed to fetch YouTube data. Please check the channel URL."
      );
      setBannerUrl("");
    } finally {
      setLoading(false);
    }
  };

  const extractChannelId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/){1,2}|(?:youtube\.com\/)?(?:channel|c)\/)([^/?]+)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const downloadChannelBanner = () => {
    if (!bannerUrl) return;

    const fileName = "YouTube_Channel_Banner.jpg";

    // Fetch the image data
    fetch(bannerUrl)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a temporary URL for the image blob
        const url = window.URL.createObjectURL(new Blob([blob]));

        // Create a temporary anchor element to trigger the download
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
      })
      .catch((error) => {
        toast.error("Error downloading image:", error);
      });
  };

  // Function to share on social media
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
          tool: "yt-channel-banner-downloader",
          ...newReview,
          userProfile: user?.profileImage || "", // Assuming user has a profileImage property
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 0, comment: "", userProfile: "" });
      fetchReviews(); // Refresh the reviews
    } catch (error) {
      toast.error("Failed to submit review");
    }
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
    slidesToScroll: 2,
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
        <meta name="twitter:image" content={meta.image} />
      </Head>
      <ToastContainer />
      <h2 className="text-3xl pt-5">YouTube Channel Banner Downloader</h2>
      {
        modalVisable && (  <div
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
                  Please log in to use this tool.
                </p>
              )}
            </div>
            <button className="ml-auto text-yellow-700" onClick={closeModal}>×</button>
          </div>
        </div>)
      }
    
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
              onClick={fetchYouTubeData}
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch Banner"}
            </button>
          </div>
          <small className="text-muted">
            Example: https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw
          </small>
          <br />
          <div className="ms-5">
            <button
              className="btn btn-danger ms-5 mt-2"
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
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {bannerUrl && (
            <div className="text-center mt-3">
              <Image
                src={bannerUrl}
                alt="Channel Banner"
                width={1200}
                height={300}
              />
              <button
                className="btn btn-danger mt-3"
                onClick={downloadChannelBanner}
              >
                <FaDownload /> Download Channel Banner
              </button>
            </div>
          )}
        </div>
        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>
      </div>
      {/* Review Form */}
      {user && (
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
      {/* Reviews Section */}
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
      <style jsx>{`
        .keywords-input-container {
          border: 2px solid #ccc;
          padding: 10px;
          border-radius: 10px;
          display: flex;
          align-items: flex-start;
          flex-wrap: wrap;
          min-height: 100px;
          margin: auto;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          background-color: #fff;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .tag {
          display: flex;
          align-items: center;
          color: #fff;
          background-color: #0d6efd;
          border-radius: 6px;
          padding: 5px 10px;
          margin-right: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .remove-btn {
          margin-left: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .input-box {
          flex: 1;
          border: none;
          height: 40px;
          font-size: 16px;
          padding: 8px;
          border-radius: 6px;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          margin-top: 8px;
        }

        .input-box::placeholder {
          color: #aaa;
        }

        @media (max-width: 600px) {
          .keywords-input-container {
            width: 100%;
            padding: 8px;
          }

          .input-box {
            height: 35px;
            font-size: 14px;
            padding: 6px;
          }
        }

        .generated-tags-display {
          background-color: #f2f2f2;
          border-radius: 8px;
          padding: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default YtChannelDw;
