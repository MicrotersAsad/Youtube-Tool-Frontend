import React, { useState, useEffect } from "react";
import {
  FaCopy,
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaStar,
  FaTimes,
  FaTwitter,
} from "react-icons/fa";
import { FaGrip } from "react-icons/fa6";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import sanitizeHtml from "sanitize-html";
import Head from "next/head";
import StarRating from "./StarRating";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";

const TagExtractor = () => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState("");
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=tagExtractor`);
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

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=tag-extractor");
      const data = await response.json();
      // Update reviews state to include user details
      const updatedReviews = data.map(review => ({
        ...review,
        name: review.userName , // Assuming user has a name field
        userProfile: review.userProfile, // Use userProfile from review or empty string
      }));
      setReviews(updatedReviews);
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
      const storedCount = localStorage.getItem("generateCount");
      if (storedCount) {
        setGenerateCount(parseInt(storedCount));
      } else {
        setGenerateCount(5);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.paymentStatus === "success" || user.role === "admin")) {
      localStorage.removeItem("generateCount");
    }
  }, [user]);

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const copyAllTagsToClipboard = () => {
    const textToCopy = tags.join(", ");
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        toast.success("Tags copied to clipboard!");
      },
      (err) => {
        toast.error("Failed to copy tags:", err);
      }
    );
  };

  const fetchTags = async () => {
    if (!videoUrl) {
      setError("Please enter a valid YouTube URL");
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    if (!user) {
      toast.error("You need to be logged in to generate tags.");
      return;
    }

    if (user && user.paymentStatus !== "success" && generateCount <= 0) {
      toast.error(
        "You have reached the limit of generating tags. Please upgrade your plan for unlimited use."
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/fetch-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setFetchLimitExceeded(true);
          setError(
            "Fetch limit exceeded. Please try again later or register for unlimited access."
          );
          toast.error(
            "Fetch limit exceeded. Please try again later or register for unlimited access."
          );
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch tags");
        }
        return;
      }

      const data = await response.json();
      setTags(data.tags || []);
      if (user && user.paymentStatus !== "success") {
        const newCount = generateCount - 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount);
      }
    } catch (err) {
      setError(err.message);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (tag) => {
    navigator.clipboard.writeText(tag).then(
      () => {
        toast.success(`Copied: "${tag}"`);
      },
      (err) => {
        toast.error("Failed to copy text:", err);
      }
    );
  };

  const downloadTags = () => {
    const element = document.createElement("a");
    const file = new Blob([tags.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "YouTubeTags.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
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

  useEffect(() => {
    if (user && user.paymentStatus === "success") {
      setFetchLimitExceeded(false);
    }
  }, [user]);

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
          tool: "tag-extractor",
          ...newReview,
          userProfile: user?.profileImage, // Assuming user has a profileImage property
          userName:user?.username
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 0, comment: "", userProfile: "",userName:"" });
      setShowReviewForm(false);
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

  const closeModal = () => {
    setModalVisible(false);
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
          <h2 className="text-3xl text-white">YouTube Tag Extractor</h2>
          <ToastContainer/>
          {modalVisible && (
            <div
              className=" bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4  shadow-md mb-6 mt-3 fixed-modal"
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
                <div className="mt-4">
                  {!user ? (
                    <p className="text-center p-3 alert-warning">
                      Please sign in to use this tool.
                    </p>
                  ) : user.paymentStatus === "success" || user.role === "admin" ? (
                    <p className="text-center p-3 alert-warning">
                      Congratulations!! Now you can generate unlimited tags.
                    </p>
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      You are not upgraded. You can get tag {5 - generateCount} more times.{" "}
                      <Link href="/pricing" className="btn btn-warning ms-3">
                        Upgrade
                      </Link>
                    </p>
                  )}
                </div>
                <button
                  className="text-yellow-700 ml-auto"
                  onClick={closeModal}
                >
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
                  aria-describedby="button-addon2"
                  value={videoUrl}
                  onChange={handleUrlChange}
                />
                <button
                  className="btn btn-danger"
                  type="button"
                  id="button-addon2"
                  onClick={fetchTags}
                  disabled={loading || fetchLimitExceeded}
                >
                  {loading ? "Loading..." : "Generate Tags"}
                </button>
              </div>
              <small className="text-white">
                Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s
              </small>
              <br />

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-end">
          <button className="btn btn-danger mt-3" onClick={handleShareClick}>
            <FaShareAlt />
          </button>
          {showShareIcons && (
            <div className="share-icons text-center mt-3">
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
        {tags.length > 0 && (
          <div>
            <h3>Tags:</h3>
            <div className="d-flex flex-wrap">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-light m-1 p-2 rounded-pill d-flex align-items-center extract"
                >
                  <FaGrip className="text-muted" />
                  <span
                    onClick={() => copyToClipboard(tag)}
                    style={{ cursor: "pointer" }}
                  >
                    {tag}
                  </span>
                  <FaTimes
                    className="ms-2 text-danger"
                    onClick={() => removeTag(index)}
                  />
                </div>
              ))}
            </div>
            <button className="btn btn-danger mt-3" onClick={downloadTags}>
              Download <FaDownload />
            </button>
            <button
              className="btn btn-danger mt-3 ms-2"
              onClick={copyAllTagsToClipboard}
            >
              Copy <FaCopy />
            </button>
          </div>
        )}

        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5 border p-5">
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
       
       {/* Review Form */}
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
    </>
  );
};

export default TagExtractor;
