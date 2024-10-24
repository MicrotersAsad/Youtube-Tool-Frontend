import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaDownload,
  FaThumbsUp, 
  FaThumbsDown ,
  FaFlag ,
  FaBookmark, 
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaTwitter,
  FaStar,
} from "react-icons/fa";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getContentProps } from '../../utils/getContentProps';
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import Head from "next/head";
import { i18n, useTranslation } from "next-i18next";
import Script from "next/script";
import { fetchReviews } from "../../contexts/ContentContext";
import "react-toastify/dist/ReactToastify.css";
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });
const Banner = dynamic(() => import("../../components/Banner"), { ssr: false });


const YtChannelDw =  ({ meta, reviews, content, relatedTools, faqs,reactions,translations}) => {
  const { t } = useTranslation('banner');
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [likes, setLikes] = useState(reactions.likes || 0);
  const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const closeModal = () => setModalVisible(false);
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(`/api/content?category=YouTube-Channel-Banner-Downloader&language=${language}`);
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
    if (!user) {
      toast.error("Please log in to fetch YouTube data.");
      setModalVisible(true);
      return;
    }

    if (!channelUrl.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    if (
      generateCount >= 3 &&
      user?.paymentStatus !== "success" &&
      user.role !== "admin"
    ) {
      toast.error("Fetch limit exceeded. Please upgrade for unlimited access.");
      return;
    }

    try {
      if (
        user &&
        user.paymentStatus !== "success" &&
        user.role !== "admin" &&
        generateCount <= 0
      ) {
        toast.error(
          "You have reached the limit of generating banners. Please upgrade your plan for unlimited use."
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

      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error("Failed to fetch API tokens");

      const tokens = await tokensResponse.json();
      let dataFetched = false;

      for (const { token } of tokens) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=${channelId}&key=${token}`
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
          dataFetched = true;
          break;
        } catch (error) {
          console.error(`Error fetching data with token ${token}:`, error);
        }
      }

      if (!dataFetched) {
        throw new Error("All API tokens exhausted or failed to fetch data.");
      }

      const newGenerateCount = generateCount + 1;
      setGenerateCount(newGenerateCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("generateCount", newGenerateCount);
      }
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
          tool: "YouTube-Channel-Banner-Downloader",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted successfully!");
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        userProfile: "",
        userName: "",
      });
      setShowReviewForm(false);
      fetchReviews('YouTube-Channel-Banner-Downloader');
    } catch (error) {
      console.error("Failed to submit review:", error);
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
          category: "YouTube-Channel-Banner-Downloader",
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
      toolName: "YouTube Channel Banner Downloader", // Name of the current tool
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
        <Banner/>

        <div className="max-w-7xl mx-auto p-4">
        <Head>
  <title>{meta?.title}</title>
  <meta name="description" content={meta?.description} />
  
  {/* Open Graph Tags */}
  <meta property="og:url" content={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-channel-banner-downloader`} />
  <meta property="og:title" content={meta?.title} />
  <meta property="og:description" content={meta?.description} />
  <meta property="og:image" content={meta?.image || ""} />
  
  {/* Twitter Card Tags */}
  <meta name="twitter:card" content={meta?.image || ""} />
  <meta property="twitter:domain" content={meta?.url} />
  <meta property="twitter:url" content={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-channel-banner-downloader`} />
  <meta name="twitter:title" content={meta?.title} />
  <meta name="twitter:description" content={meta?.description} />
  <meta name="twitter:image" content={meta?.image || ""} />
  
  {/* hreflang and Alternate Language Links */}
  <link rel="alternate" href={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-channel-banner-downloader`}  hrefLang="x-default" />
  <link rel="alternate" href={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-channel-banner-downloader`}  hrefLang="en" />
  {translations && Object.keys(translations).map(lang => (
    lang !== 'en' && (
      <link
        key={lang}
        rel="alternate"
        hrefLang={lang}
        href={`${meta?.url}/${lang}/tools/youtube-channel-banner-downloader`}
      />
    )
  ))}
</Head> 
  {/* JSON-LD Structured Data */}
  <Script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: meta?.title,
      url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-channel-banner-downloader`,
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
  
  <Script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta?.title,
      url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-channel-banner-downloader`,
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
  
  <Script type="application/ld+json">
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


          <h2 className="text-3xl pt-5 text-white">
            {t('YouTube Channel Banner Download')}
          </h2>
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
                        {t('Congratulations! Now you can download unlimited Banner.')}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t('You are not upgraded. You can generate banner {{remainingGenerations}} more times.', { remainingGenerations: 5 - generateCount })}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t('Upgrade')}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t('Please log in to fetch channel data.')}
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
    Enter Youtube Channel URL <span className="text-red-500">*</span>
  </label>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded-md"
        placeholder="e.g. https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw"
        aria-label="YouTube Channel URL"
        aria-describedby="button-addon2"
        value={channelUrl}
        onChange={handleUrlChange}
      />
    </div>
    <div className="flex items-center mt-4 md:mt-0 ps-6 pe-6">
    <button
  className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-purple-400"
  type="button"
  id="button-addon2"
  onClick={fetchYouTubeData}
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


      Fetch Banner
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
        <div className="text-center">
          <div className="flex gap-2">
            <FaShareAlt className="text-danger fs-3" />
            <span>{t('Share On Social Media')}</span>
            <FaFacebook
              className="facebook-icon fs-3"
              onClick={() => shareOnSocialMedia("facebook")}
            />
            <FaInstagram
              className="instagram-icon fs-3"
              onClick={() => shareOnSocialMedia("instagram")}
            />
            <FaTwitter
              className="twitter-icon fs-3"
              onClick={() => shareOnSocialMedia("twitter")}
            />
            <FaLinkedin
              className="linkedin-icon fs-3"
              onClick={() => shareOnSocialMedia("linkedin")}
            />
          </div>
        </div>
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
              <FaDownload />
            </button>
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
            <h2 className="faq-title">{t('Frequently Asked Questions')}</h2>
            <p className="faq-subtitle">
              {t('Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us')}
            </p>
            <div className="faq-grid">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <span id={`accordion-${index}`} className="target-fix"></span>
                  <a
                    href={`#accordion-${index}`}
                    id={`open-accordion-${index}`}
                    className="accordion-header"
                    onClick={() => toggleFAQ(index)}
                  >
                    {faq.question}
                  </a>
                  <a
                    href={`#accordion-${index}`}
                    id={`close-accordion-${index}`}
                    className="accordion-header"
                    onClick={() => toggleFAQ(index)}
                  >
                    {faq.question}
                  </a>
                  <div
                    className={`accordion-content ${
                      openIndex === index ? "open" : ""
                    }`}
                  >
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
            <div className=" text-3xl font-bold mb-2">{t('Customer reviews')}</div>
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
                {reviews.length} {t('global ratings')}
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
              <h4>{t('Review This Tool')}</h4>
              <p>{t('Share Your Thoughts With Other Customers')}</p>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
                onClick={openReviewForm}
              >
                {t('Write a customer review')}
              </button>
            </div>
          </div>

          <div className="col-md-8">
            {reviews.slice(0, 5).map((review, index) => (
              <div key={index} className="border p-6 m-5 bg-white">
                <div className="flex items-center mb-4">
                  <Image
                    src={`data:image/jpeg;base64,${review?.userProfile}`}
                    alt={review.name}
                    className="w-12 h-12 rounded-full"
                    width={48}
                    height={48}
                  />
                  <div className="ml-4">
                    <div className="font-bold">{review?.userName}</div>
                    <div className="text-gray-500 text-sm">
                      {t('Verified Purchase')}
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
                  {t('Reviewed On')} {review.createdAt}
                </div>
                <div className="text-lg mb-4">{review.comment}</div>
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="btn btn-primary mt-4 mb-5"
                onClick={handleShowMoreReviews}
              >
                {t('See More Reviews')}
              </button>
            )}
            {showAllReviews &&
              reviews.slice(5).map((review, index) => (
                <div key={index} className="border p-6 m-5 bg-white">
                  <div className="flex items-center mb-4">
                    <Image
                      src={`data:image/jpeg;base64,${review?.userProfile}`}
                      alt={review.name}
                      className="w-12 h-12 rounded-full"
                      width={48}
                      height={48}
                    />
                    <div className="ml-4">
                      <div className="font-bold">{review?.userName}</div>
                      <div className="text-gray-500 text-sm">
                        {t('Verified Purchase')}
                      </div>
                      <p className="text-muted">
                        {t('Reviewed On')} {review?.createdAt}
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
              <h2 className="text-2xl font-semibold mb-4">{t('Leave a Review')}</h2>
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
                  placeholder={t('Title')}
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview({ ...newReview, title: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <textarea
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder={t('Your Review')}
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })}
                />
              </div>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                onClick={handleReviewSubmit}
              >
                {t('Submit Review')}
              </button>
              <button
                className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
                onClick={closeReviewForm}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        )}
           {/* Related Tools Section */}
           <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-5 text-center">Related Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedTools.map((tool, index) => (
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
        <style>{`
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
    </>
  );
};
export async function getServerSideProps(context) {
  return getContentProps('YouTube-Channel-Banner-Downloader', context.locale, context.req);
}

export default YtChannelDw;
