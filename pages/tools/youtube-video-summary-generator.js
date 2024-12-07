import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaThumbsUp, FaThumbsDown, FaBookmark, FaFlag,FaShareAlt,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTwitter,FaCopy } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClipLoader from "react-spinners/ClipLoader";
import Head from "next/head";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { i18n, useTranslation } from "next-i18next";
import Script from "next/script";
import dynamic from 'next/dynamic';
import { getContentProps } from "../../utils/getContentProps";

const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const VideoSummarizer = ({ meta, reviews, content, relatedTools, faqs,reactions,hreflangs})  => {
  const { user, updateUserProfile } = useAuth();
  const { t } = useTranslation('summary');
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState([]);
  const [activeTab, setActiveTab] = useState("Transcript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateCount, setGenerateCount] = useState(5);
  const [isUpdated, setIsUpdated] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [likes, setLikes] = useState(0);
  const [unlikes, setUnlikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(
          `/api/content?category=YouTube-Video-Summary-Generator&language=${language}`
        );
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
        setLikes(data.reactions.likes || 0);
        setUnlikes(data.reactions.unlikes || 0);
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
    
  }, [i18n.language, t]);
  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  const fetchSummary = async () => {
    if (user && user.paymentStatus !== "success" && generateCount <= 0) {
      toast.error(
        t("You have reached the limit. Please upgrade for unlimited use.")
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/summarize", { videoUrl });
      setVideoInfo(response.data.videoInfo);
      setTranscript(response.data.captions);
      setSummary(response.data.summaries);
      if (user && user.paymentStatus !== "success" && user.role !== "admin") {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      console.error("Error summarizing video:", error);
      setError(t("Failed to summarize video"));
      toast.error(t("Failed to summarize video"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(t("Copied to clipboard!"));
      })
      .catch((error) => {
        console.error("Error copying text:", error);
        toast.error(t("Failed to copy text"));
      });
  };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment) {
      toast.error(t("All fields are required."));
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "YouTube-Video-Summary-Generator",
          ...newReview,
          userProfile: user?.profileImage || "",
          userName: user?.username,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success(t("Review submitted successfully!"));
      setNewReview({ rating: 0, comment: "", userProfile: "", userName: "" });
      setShowReviewForm(false);
      fetchReviews('YouTube-Video-Summary-Generator');
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(t("Failed to submit review"));
    }
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter(
      (review) => review.rating === rating
    ).length;
    return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
  };

  const overallRating = (
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  ).toFixed(1);

  const handleShowMoreReviews = () => {
    setShowAllReviews(true);
  };

  const openReviewForm = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowReviewForm(true);
  };
  const closeReviewForm = () => {
    setShowReviewForm(false);
  };
  useEffect(() => {
    if (user) {
      const userAction = reactions.users?.[user.email];
      if (userAction === "like") {
        setHasLiked(true);
      } else if (userAction === "unlike") {
        setHasUnliked(true);
      } else if (userAction === "report") {
        setHasReported(true);
      }
  
      // Check if data is already saved using the current URL
      const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
      const isChannelSaved = savedChannels.some(channel => channel.toolUrl === window.location.href);
      setIsSaved(isChannelSaved);
    }
  }, [user, reactions.users]);
  

  const handleReaction = async (action) => {
    if (!user) {
      toast.error("Please log in to react.");
      return;
    }
  
    try {
      const response = await fetch('/api/reactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: "YouTube-Video-Summary-Generator",
          userId: user.email,
          action,
          reportText: action === 'report' ? reportText : null, 
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update reaction");
      }
  
      const updatedData = await response.json();
      setLikes(updatedData.reactions.likes || 0);
      setUnlikes(updatedData.reactions.unlikes || 0);
  
      if (action === 'like') {
        if (hasLiked) {
          toast.error('You have already liked this.');
        } else {
          setHasLiked(true);
          setHasUnliked(false);
          toast.success('You liked this content.');
        }
      } else if (action === 'unlike') {
        if (hasUnliked) {
          setHasUnliked(false);
          toast.success('You removed your dislike.');
        } else {
          setHasLiked(false);
          setHasUnliked(true);
          toast.success('You disliked this content.');
        }
      } else if (action === 'report') {
        if (hasReported) {
          toast.error('You have already reported this.');
        } else {
          setHasReported(true);
          toast.success('You have reported this content.');
        }
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      toast.error(error.message);
    }
  };
  
  
  const saveChannel = () => {
    const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    const currentTool = {
      toolName: "YouTube Video Data Viewer", // Name of the current tool
      toolUrl: window.location.href, // Current URL of the tool
    };
  
    const existingChannelIndex = savedChannels.findIndex(channel => channel.toolUrl === currentTool.toolUrl);
  
    if (existingChannelIndex === -1) {
      // If the tool is not already saved, save it
      savedChannels.push(currentTool);
      localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
      setIsSaved(true);
      toast.success("Tool saved successfully!");
    } else {
      // If the tool is already saved, remove it
      savedChannels.splice(existingChannelIndex, 1);
      localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
      setIsSaved(false);
      toast.success("Tool removed from saved list.");
    }
  };
  
  // বাটন রঙের লজিক
  const likeButtonColor = hasLiked ? "#4CAF50" : "#ccc"; // লাইক করা থাকলে সবুজ
  const unlikeButtonColor = hasUnliked ? "#F44336" : "#ccc"; // ডিসলাইক করা থাকলে লাল
  const reportButtonColor = hasReported ? "#FFD700" : "#ccc"; // রিপোর্ট করা থাকলে হলুদ
  const saveButtonColor = isSaved ? "#FFD700" : "#ccc";


  return (
    <>
      <div className="bg-box">
        <div>
          <Image className="shape1" src={announce} alt="announce" />
          <Image className="shape2" src={cloud} alt="cloud" />
          <Image className="shape3" src={cloud2} alt="cloud2" />
          <Image className="shape4" src={chart} alt="chart" />
        </div>

        <div className="max-w-7xl mx-auto p-4">
        <Head>
            {/* SEO Meta Tags */}
            <title>{meta?.title}</title>
            <meta name="description" content={meta?.description} />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <meta name="robots" content="index, follow" />

            {/* Canonical URL */}
            <link
              rel="canonical"
              href={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Video-Summary-Generator", "youtube-video-summary-generator")}`}
            />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Video-Summary-Generator", "youtube-video-summary-generator")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732967506904-youtubevideosummarizerb.png" />
            <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732967506904-youtubevideosummarizerb.png" />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:domain"
              content={meta?.url
                .replace("tools/YouTube-Video-Summary-Generator", "")}
            />
            <meta
              property="twitter:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Video-Summary-Generator", "youtube-video-summary-generator")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732967506904-youtubevideosummarizerb.png" />
            <meta name="twitter:site" content="@ytubetools" />
            <meta name="twitter:image:alt" content="youtube-video-summary-generator" />

            {/* Alternate hreflang Tags for SEO */}
            {hreflangs &&
              hreflangs.map((hreflang, index) => (
                <link
                  key={index}
                  rel={hreflang.rel}
                  hreflang={hreflang.hreflang}
                  href={`${hreflang.href
                    .toLowerCase()
                    .replace("YouTube-Video-Summary-Generator", "youtube-video-summary-generator")}`}
                />
              ))}
          </Head>
  {/* JSON-LD Structured Data */}
  <Script id="page-ld-json-webpage" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-video-summary-generator`,
    description: meta?.description,
    breadcrumb: {
      "@id": `${meta?.url}#breadcrumb`,
    },
    about: {
      "@type": "Thing",
      name: meta?.title,
    },
    isPartOf: {
      "@type": "WebSite",
      url: meta?.url,
    },
  })}
</Script>

<Script id="page-ld-json-softwareapp" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-video-summary-generator`,
    applicationCategory: "Multimedia",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: overallRating,
      ratingCount: reviews?.length,
      reviewCount: reviews?.length,
    },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.userName,
      },
      datePublished: review.createdAt,
      reviewBody: review.comment,
      name: review.title,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
      },
    })),
  })}
</Script>

<Script id="page-ld-json-faq" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  })}
</Script>


          <ToastContainer />
          <h1 className="text-3xl font-bold text-center mb-3 text-white">
            {t("YouTube Video Summarizer")}
          </h1>
          <p className="text-white pb-3">
          The YouTube Video Summary Generator is a tool that automatically creates concise summaries of YouTube videos
          </p>
          {modalVisible && (
            <div
              className="bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3 z-50"
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
                    user.paymentStatus === "success" ||
                    user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        {t("Congratulations! You can generate unlimited summaries.")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You can generate {generateCount} more summaries. Upgrade", { generateCount })}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t("Upgrade")}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t("Please log in to use this tool.")}
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

<div className="border max-w-4xl mx-auto rounded-xl shadow bg-white">
  <div>
    <div className="w-full p-6">
    <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
    Enter Youtube Video URL <span className="text-red-500">*</span>
  </label>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded-md"
        placeholder="e.g. https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s"
        aria-label="YouTube Video URL"
        aria-describedby="button-addon2"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)} // Correct event handler
      />
      <small className="text-muted"> Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s</small>
    </div>
    <div className="flex items-center mt-4 md:mt-0 ps-6 pe-6">
    <button
  className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-purple-400"
  type="button"
  id="button-addon2"
  onClick={fetchSummary}
  disabled={loading}
>
  {loading ? (
    <>
     <span className="animate-spin mr-2">
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
  >
    <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
  </svg>
</span>

      Loading...
    </>
  ) : (
    <>
     <span className="animate-spin mr-2">
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
  >
    <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
  </svg>
</span>


      Extract Links
    </>
  )}
</button>


      
      <div className="ms-auto">
      <button
        className="flex items-center justify-center"
        onClick={saveChannel}
        style={{ color: saveButtonColor }}
      >
        <FaBookmark className={`text-lg ${isSaved ? 'text-purple-600' : 'text-red-500'}`} />
      </button>
      </div>
    </div>
  </div>

   {/* Reaction Bar */}
   <div className="w-full flex items-center justify-between mt-4 p-3 bg-gray-100 rounded-md">
    <div className="flex items-center space-x-4">
      <button
        onClick={() => handleReaction("like")}
        className="flex items-center space-x-1"
        style={{ color: likeButtonColor }}
      >
        <FaThumbsUp className="text-xl text-green-600" />
        <span className="text-black">{likes}</span>
      </button>
      <button
        onClick={() => handleReaction("unlike")}
        className="flex items-center space-x-1"
        style={{ color: unlikeButtonColor }}
      >
        <FaThumbsDown className="text-xl text-red-400" />
        <span className="text-black">{unlikes}</span>
      </button>
      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center space-x-1"
        style={{ color: reportButtonColor }}
      >
        <FaFlag className="text-xl text-red-500" />
        <span className="text-black">Report</span>
      </button>
    </div>
    <div className="text-center">
          <div className="flex justify-center items-center gap-2">
            <FaShareAlt className="text-red-500 text-xl" />
            
            <FaFacebook
              className="text-blue-600 text-xl cursor-pointer"
              onClick={() => shareOnSocialMedia("facebook")}
            />
            <FaInstagram
              className="text-pink-500 text-xl cursor-pointer"
              onClick={() => shareOnSocialMedia("instagram")}
            />
            <FaTwitter
              className="text-blue-400 text-xl cursor-pointer"
              onClick={() => shareOnSocialMedia("twitter")}
            />
            <FaLinkedin
              className="text-blue-700 text-xl cursor-pointer"
              onClick={() => shareOnSocialMedia("linkedin")}
            />
          </div>
        </div>
  </div>

  {showReportModal && (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">
          Report This Tool
        </h2>
        <textarea
          className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          placeholder="Describe your issue..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
        />
        <div className="mt-4 flex justify-end space-x-4">
          <button
            className="btn btn-secondary text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline"
            onClick={() => setShowReportModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
            onClick={() => handleReaction("report")}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )}
</div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        {videoInfo && !loading && (
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
              <div className="border rounded pt-6 pb-14 pe-4 ps-4 ">
                <Image
                  src={videoInfo.thumbnail}
                  alt="Video Thumbnail"
                  className="mb-4"
                  width={200}
                  height={200}
                />
                <h2 className="text-xl font-bold mb-2">{videoInfo.title}</h2>
                <p className="mb-1">{t("Author")}: {videoInfo.author}</p>
                <p className="mb-1">{t("Video Duration")}: {videoInfo.duration}</p>
                <p className="mb-1">{t("Video Published")}: {videoInfo.publishedAt}</p>
              </div>
            </div>
            <div className="w-full lg:w-2/3 lg:ml-4">
              <div className="border rounded p-4">
                <div className="mb-4">
                  <button
                    className={`py-2 px-4 rounded ${
                      activeTab === "Transcript"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200"
                    }`}
                    onClick={() => setActiveTab("Transcript")}
                  >
                    {t("Transcript")}
                  </button>
                  <button
                    className={`py-2 px-4 rounded ml-2 ${
                      activeTab === "Summary"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200"
                    }`}
                    onClick={() => setActiveTab("Summary")}
                  >
                    {t("Summary")}
                  </button>
                </div>
                {activeTab === "Transcript" && (
                  <div className="overflow-y-auto max-h-96">
                    {transcript.map((segment, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-lg font-semibold text-sky-500">
                            {" "}
                            {index + 1}:00
                          </h6>
                          <FaCopy
                            className="cursor-pointer text-red-500 hover:text-gray-700"
                            onClick={() =>
                              handleCopy(
                                segment.map((caption) => caption.text).join(" ")
                              )
                            }
                          />
                        </div>
                        <p>
                          {segment.map((caption) => caption.text).join(" ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "Summary" && (
                  <div className="overflow-y-auto max-h-96">
                    {summary.map((sum, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-lg font-semibold text-sky-500">
                            {" "}
                            {index + 1}:00
                          </h6>
                          <FaCopy
                            className="cursor-pointer text-red-500 hover:text-gray-700"
                            onClick={() => handleCopy(sum)}
                          />
                        </div>
                        <p>{sum}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      <div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>
        
        <div className="accordion p-5 shadow">
  <h2 className="faq-title">{t("Frequently Asked Questions")}</h2>
  <p className="faq-subtitle">
    {t("Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us")}
  </p>
  <div className="faq-grid">
    {faqs?.map((faq, index) => (
      <div key={index} className="faq-item">
        <span id={`accordion-${index}`} className="target-fix"></span>
        <a
          href={`#accordion-${index}`}
          id={`open-accordion-${index}`}
          className={`accordion-header ${openIndex === index ? 'active' : ''}`}
          onClick={() => toggleFAQ(index)}
        >
          {faq.question}
        </a>
        <a
          href={`#accordion-${index}`}
          id={`close-accordion-${index}`}
          className={`accordion-header ${openIndex === index ? 'active' : ''}`}
          onClick={() => toggleFAQ(index)}
        >
          {faq.question}
        </a>
        <div
          className={`accordion-content ${openIndex === index ? 'open' : ''}`}
        >
          <p>{faq.answer}</p>
        </div>
      </div>
    ))}
  </div>
</div>

    
        <hr className="mt-4 mb-2" />
        <div className="row pt-3">
          <div className="col-md-4">
            <div className=" text-3xl font-bold mb-2">{t("Customer reviews")}</div>
            <div className="flex items-center mb-2">
              <div className="text-3xl font-bold mr-2">{overallRating}</div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    color={
                      i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"
                    }
                  />
                ))}
              </div>
              <div className="ml-2 text-sm text-gray-500">
                {reviews.length} {t("global ratings")}
              </div>
            </div>
            <div>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center mb-1">
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
            <hr />
            <div className="pt-3">
              <h4>{t("Review This Tool")}</h4>
              <p>{t("Share Your Thoughts With Other Customers")}</p>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
                onClick={openReviewForm}
              >
                {t("Write a customer review")}
              </button>
            </div>
          </div>

          <div className="col-md-8">
            {reviews?.slice(0, 5).map((review, index) => (
              <div key={index} className="border p-6 m-5 bg-white">
                <div className="flex items-center mb-4">
                  <Image
                    src={review?.userProfile}
                    alt={review.name}
                    className="w-12 h-12 rounded-full"
                    width={48}
                    height={48}
                  />
                  <div className="ml-4">
                    <div className="font-bold">{review?.userName}</div>
                    <div className="text-gray-500 text-sm">
                      {t("Verified Purchase")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      size={20}
                      color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                    />
                  ))}
                  <div>
                    <span className="fw-bold mt-2 ms-2">{review?.title}</span>
                  </div>
                </div>

                <div className="text-gray-500 text-sm mb-4">
                  {t("Reviewed On")} {review.createdAt}
                </div>
                <div className="text-lg mb-4">{review.comment}</div>
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="btn btn-primary mt-4 mb-5"
                onClick={handleShowMoreReviews}
              >
                {t("See More Reviews")}
              </button>
            )}
            {showAllReviews &&
              reviews?.slice(5).map((review, index) => (
                <div key={index} className="border p-6 m-5 bg-white">
                  <div className="flex items-center mb-4">
                    <Image
                     src={review?.userProfile}
                      alt={review.name}
                      className="w-12 h-12 rounded-full"
                      width={48}
                      height={48}
                    />
                    <div className="ml-4">
                      <div className="font-bold">{review?.userName}</div>
                      <div className="text-gray-500 text-sm">
                        {t("Verified Purchase")}
                      </div>
                      <p className="text-muted">
                        {t("Reviewed On")} {review?.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{review.title}</div>
                  <div className="text-gray-500 mb-4">{review.date}</div>
                  <div className="text-lg mb-4">{review.comment}</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        size={20}
                        color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {showReviewForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full">
              <h2 className="text-2xl font-semibold mb-4">{t("Leave a Review")}</h2>
              <div className="mb-4">
                <StarRating
                  rating={newReview.rating}
                  setRating={(rating) => setNewReview({ ...newReview, rating })}
                />
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder={t("Title")}
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview({ ...newReview, title: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <textarea
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder={t("Your Review")}
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })}
                />
              </div>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                onClick={handleReviewSubmit}
              >
                {t("Submit Review")}
              </button>
              <button
                className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
                onClick={closeReviewForm}
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        )}
           {/* Related Tools Section */}
           <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-5 text-center">Related Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedTools?.map((tool, index) => (
          <a
            key={index}
            href={tool.link}
            className="flex items-center border  rounded-lg p-4 bg-gray-100 transition"
          >
            <Image
              src={tool?.logo?.src}
              alt={`${tool.name} Icon`}
              width={64}
              height={64}
              className="mr-4"
              
            />
            <span className="text-blue-600 font-medium">{tool.name}</span>
          </a>
        ))}
      </div>
    </div>
        {/* End of Related Tools Section */}
         
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps("YouTube-Video-Summary-Generator", context.locale, context.req);
}

export default VideoSummarizer;
