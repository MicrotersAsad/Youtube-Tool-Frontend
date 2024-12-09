import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import {
  FaClock,
  FaEye,
  FaFlag ,
  FaBookmark, 
  FaThumbsUp,
  FaThumbsDown,
  FaComments,
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
import { i18n, useTranslation } from "next-i18next";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { getContentProps } from '../../utils/getContentProps';
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import ReCAPTCHA from "react-google-recaptcha";
// Dynamically import heavy components
const StarRating = lazy(() => import("./StarRating"));

const VideoDataViewer =  ({ meta, reviews, content, relatedTools, faqs,reactions,hreflangs}) => {
  const { t } = useTranslation(['videoDataViewer']);
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [siteKey,setSiteKey]=useState()
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false); 
  const [generateCount, setGenerateCount] = useState(0);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
    userName: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [likes, setLikes] = useState(reactions.likes || 0);
  const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const closeModal = () => setModalVisible(false);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
// Check if running on localhost
const isLocalHost = typeof window !== "undefined" && 
(window.location.hostname === "localhost" || 
 window.location.hostname === "127.0.0.1" || 
 window.location.hostname === "::1");
 const handleCaptchaChange = (value) => {
  // This is the callback from the reCAPTCHA widget
  if (value) {
    setCaptchaVerified(true); // Set captchaVerified to true when the user completes reCAPTCHA
  }
};
useEffect(() => {
  const fetchConfigs = async () => {
    try {
      const protocol = window.location.protocol === "https:" ? "https" : "http";
      const host = window.location.host;
      
      // Retrieve the JWT token from localStorage (or other storage mechanisms)
      const token ='AZ-fc905a5a5ae08609ba38b046ecc8ef00';  // Replace 'authToken' with your key if different
      
        
      if (!token) {
        console.error('No authentication token found!');
        return;
      }

      // Make the API call with the Authorization header containing the JWT token
      const response = await fetch(`${protocol}://${host}/api/extensions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the header
        },
      });

      const result = await response.json();


      if (result.success) {
        // reCAPTCHA configuration
        const captchaExtension = result.data.find(
          (ext) => ext.key === "google_recaptcha_2" && ext.status === "Enabled"
        );
        if (captchaExtension && captchaExtension.config.siteKey) {
          setSiteKey(captchaExtension.config.siteKey);
        } else {
          console.error("ReCAPTCHA configuration not found or disabled.");
        }
      } else {
        console.error('Error fetching extensions:', result.message);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false); // Data has been loaded
    }
  };

  fetchConfigs();
}, []);
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(`/api/content?category=video-data-viewer&language=${language}`);
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
        setLikes(data.reactions.likes || 0);
        setUnlikes(data.reactions.unlikes || 0);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchContent();
   
  }, [i18n.language]);
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

  const handleInputChange = (e) => {
    setError("");
    setVideoUrl(e.target.value);
  };

  const handleFetchClick = async () => {
    if (!user) {
      toast.error(t("Please log in to fetch channel data."));
      setModalVisible(true);
      return;
    }

    if (!videoUrl.trim()) {
      toast.error(t("Please enter a valid URL."));
      return;
    }
    if (!captchaVerified) {
      toast.error(t("Pls Complete this capctha"));
      return;
    }
    if (generateCount >= 3 && user?.paymentStatus !== "success" && user.role !== "admin") {
      setFetchLimitExceeded(true);
      toast.error(t("Fetch limit exceeded. Please upgrade for unlimited access."));
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
      toast.success(t("Data fetched successfully!"));
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
          tool: "video-data-viewer",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error(t("Failed to submit review."));

      toast.success(t("Review submitted successfully!"));
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        userProfile: "",
        userName: "",
      });
      setShowReviewForm(false);
      fetchReviews('video-data-viewer');
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(t("Failed to submit review."));
    }
  };

  const shareOnSocialMedia = (socialNetwork) => {
    const url = encodeURIComponent(window.location.href);
    const socialMediaUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      instagram: "You can share this page on Instagram through the Instagram app on your mobile device.",
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
    const ratingCount = reviews.filter((review) => review.rating === rating).length;
    return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
  };

  const overallRating = useMemo(() => (
    (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
  ), [reviews]);

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
          category: "video-data-viewer",
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
          <Image className="shape2" src={cloud} alt="announce" />
          <Image className="shape3" src={cloud2} alt="announce" />
          <Image className="shape4" src={chart} alt="announce" />
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
          <link rel="canonical" href={`${meta?.url}`} />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:url"  content={`${meta?.url}`}/>
          <meta property="og:title" content={meta?.title} />
          <meta property="og:description" content={meta?.description} />
          <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732962125278-youtubevideodataviewerb.png" />
          <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732962125278-youtubevideodataviewerb.png" />
          <meta property="og:site_name" content="Ytubetools" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta
              name="twitter:domain"
              content={meta?.url
                .replace("tools/video-data-viewer", "")}
            />
          <meta property="twitter:url" content={`${meta?.url}`}/>
          <meta name="twitter:title" content={meta?.title} />
          <meta name="twitter:description" content={meta?.description} />
          <meta name="twitter:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732962125278-youtubevideodataviewerb.png" />
          <meta name="twitter:site" content="@ytubetools" />
          <meta name="twitter:image:alt" content="video-data-viewer" />

          {/* Alternate hreflang Tags for SEO */}
          {hreflangs &&
            hreflangs.map((hreflang, index) => (
              <link
                key={index}
                rel={hreflang.rel}
                hreflang={hreflang.hreflang}
                href={`${hreflang.href}`}
              />
            ))}
          {/* <link
            rel="alternate"
            hreflang="en"
            href={meta?.url?.replace(/\/$/, "").replace(/\/$/, "")}
          /> */}
        </Head>
  {/* JSON-LD Structured Data */}
  <Script id="webpage-structured-data" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/video-data-viewer`,
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

<Script id="software-application-structured-data" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/video-data-viewer`,
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

<Script id="faq-structured-data" type="application/ld+json">
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


          <h1 className="text-3xl pt-5 text-white">{t("YouTube Video Data Viewer")}</h1>
          <p className="text-white pb-3">The YouTube Video Data Viewer is a tool designed to provide detailed insights and analytics for YouTube videos</p>
          <ToastContainer />
          {modalVisible && (
            <div
              className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 shadow-md mb-6 mt-3"
              role="alert"
            >
              <div className="flex">
                <div className="mt-4">
                  {user ? (
                    user.paymentStatus === "success" || user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        {t("Congratulations! Now you can get unlimited Video Data View.")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You are not upgraded. You can get Video Data View { remainingGenerations: 5 - generateCount } more times")}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t("Upgrade")}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t("Please log in to fetch channel data.")}
                    </p>
                  )}
                </div>
                <button className="text-yellow-700 ml-auto" onClick={closeModal}>
                  ×
                </button>
              </div>
            </div>
          )}

<div className="border max-w-4xl mx-auto rounded-xl shadow bg-white">
  <div>
    <div className="w-full p-6">
      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
        Enter YouTube Video URL <span className="text-red-500">*</span>
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
    </div>
    <div className="ms-4">
  {/* reCAPTCHA Section */}
{!isLocalHost && siteKey && (
  <ReCAPTCHA
    sitekey={siteKey} // সঠিকভাবে `sitekey` পাঠানো
    onChange={handleCaptchaChange}
  />
)}
</div>

    <div className="flex items-center mt-4 md:mt-0 ps-6 pe-6">
      <button
        className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-purple-400"
        type="button"
        id="button-addon2"
        onClick={handleFetchClick}
        disabled={loading} // Button disabled when loading
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
            <span className="mr-2">
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
            Fetch Data
          </>
        )}
      </button>

      <div className="ms-auto">
        <button
          className="flex items-center justify-center"
          onClick={saveChannel}
          style={{ color: saveButtonColor }}
        >
          <FaBookmark
            className={`text-lg ${isSaved ? "text-purple-600" : "text-red-500"}`}
          />
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

  {/* Report Modal */}
  {showReportModal && (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Report This Tool</h2>
        <textarea
          className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          placeholder="Describe your issue..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)} // Handle text change
        />
        <div className="mt-4 flex justify-end space-x-4">
          <button
            className="btn btn-secondary text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline"
            onClick={() => setShowReportModal(false)} // Close modal
          >
            Cancel
          </button>
          <button
            className="btn btn-primary text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
            onClick={() => {
              handleReaction("report");
              setShowReportModal(false); // Submit report and close modal
            }}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )}
</div>

          {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
          
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
                  <th className="px-4 py-2 border">{t("Property")}</th>
                  <th className="px-4 py-2 border">{t("Value")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaClock className="mr-2" /> {t("Duration")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{formatDuration(videoData.duration) || "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaEye className="mr-2" /> {t("View Count")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.viewCount || "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaThumbsUp className="mr-2" /> <FaThumbsDown className="ml-2" /> {t("Like/Dislike Count")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    {videoData.likeCount || "N/A"} / {videoData.dislikeCount || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaComments className="mr-2" /> {t("Comment Count")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.commentCount || "N/A"}</td>
                </tr>

                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2" /> {t("Published At")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.publishedAt || "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaVideo className="mr-2" /> {t("Is Embeddable")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.isEmbeddable ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaTags className="mr-2" /> {t("Video Tags")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{Array.isArray(videoData.tags) ? videoData.tags.join(", ") : "N/A"}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">
                    <div className="flex items-center">
                      <FaInfoCircle className="mr-2" /> {t("Description")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">{videoData.description || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

<div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>

        <div className="p-5 shadow">
          <div className="accordion">
            <h2 className="faq-title">{t("Frequently Asked Questions")}</h2>
            <p className="faq-subtitle">{t("Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us")}</p>
            <div className="faq-grid">
              {faqs?.map((faq, index) => (
                <div key={index} className="faq-item">
                  <span id={`accordion-${index}`} className="target-fix"></span>
                  <a href={`#accordion-${index}`} id={`open-accordion-${index}`} className="accordion-header" onClick={() => toggleFAQ(index)}>
                    {faq.question}
                  </a>
                  <a href={`#accordion-${index}`} id={`close-accordion-${index}`} className="accordion-header" onClick={() => toggleFAQ(index)}>
                    {faq.question}
                  </a>
                  <div className={`accordion-content ${openIndex === index ? "open" : ""}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
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
                  <FaStar key={i} color={i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"} />
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
                    <div className="h-4 bg-yellow-500 rounded-full absolute top-0 left-0" style={{ width: `${calculateRatingPercentage(rating)}%` }}></div>
                  </div>
                  <div className="w-12 text-left ml-4">{calculateRatingPercentage(rating).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <hr />
            <div className="pt-3">
              <h4>{t("Review This Tool")}</h4>
              <p>{t("Share Your Thoughts With Other Customers")}</p>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
                onClick={() => setShowReviewForm(true)}
              >
                {t("Write a customer review")}
              </button>
            </div>
          </div>

          <div className="col-md-8">
            {reviews.slice(0, 5).map((review, index) => (
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
                    <div className="text-gray-500 text-sm">{t("Verified Purchase")}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} size={20} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />
                  ))}
                  <div>
                    <span className="fw-bold mt-2 ms-2">{review?.title}</span>
                  </div>
                </div>

                <div className="text-gray-500 text-sm mb-4">{t("Reviewed On")} {review.createdAt}</div>
                <div className="text-lg mb-4">{review.comment}</div>
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button className="btn btn-primary mt-4 mb-5" onClick={handleShowMoreReviews}>
                {t("See More Reviews")}
              </button>
            )}
            {showAllReviews &&
              reviews.slice(5).map((review, index) => (
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
                      <div className="text-gray-500 text-sm">{t("Verified Purchase")}</div>
                      <p className="text-muted">{t("Reviewed On")} {review?.createdAt}</p>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{review.title}</div>
                  <div className="text-gray-500 mb-4">{review.date}</div>
                  <div className="text-lg mb-4">{review.comment}</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} size={20} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {showReviewForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">{t("Leave a Review")}</h2>
              <div className="mb-4">
                <Suspense fallback={<div>Loading...</div>}>
                  <StarRating rating={newReview.rating} setRating={(rating) => setNewReview({ ...newReview, rating })} />
                </Suspense>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder={t("Title")}
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <textarea
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder={t("Your Review")}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
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
    
      </div>
      {/* Related Tools Section */}
      <div className="bg-indigo-50 p-5">
          <h2 className="text-2xl font-bold mb-5 pt-5 text-center">
            {t("Related Tools")}
          </h2>
  
          <ul role="list" className="mx-auto gap-3 grid max-w-7xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
  {relatedTools.map((tool, index) => (
    <li key={index} className="cursor-pointer bg-white rounded-xl list-none p-4 shadow transition duration-200 ease-in-out hover:scale-[101%] hover:bg-gray-50 hover:shadow-lg hover:ring-1 hover:ring-indigo-500">
                  <Link
                key={index}
                href={tool.link}
                className="flex items-center transition"
              >
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border hover:shadow lg:h-12 lg:w-12">
            <Image 
              alt="AI Story Generator icon" 
              loading="lazy" 
              width={24} 
              height={24} 
              decoding="async" 
              className="h-6 w-6 rounded-full" 
              src={tool?.logo?.src || '/default-image.png'}  // Default fallback image
            />
          </div>
          <span className="ml-4 text-base font-medium text-gray-900 hover:text-indigo-600">{tool.name}</span>
        </div>
      </Link>
    </li>
  ))}
</ul>

   
        {/* End of Related Tools Section */}
    </div>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps('video-data-viewer', context.locale, context.req);
}

export default VideoDataViewer;
