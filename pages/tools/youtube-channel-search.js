import React, { useState, useEffect, useTransition } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";
import {
  FaStar,
  FaFlag,
  FaBookmark,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import Image from "next/image";

import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { i18n, useTranslation } from "next-i18next";
import { getContentProps } from "../../utils/getContentProps";
import Script from "next/script";
import dynamic from "next/dynamic";
import ReCAPTCHA from "react-google-recaptcha";
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });
const YouTubeChannelScraper = ({
  meta,
  reviews,
  content,
  relatedTools,
  faqs,
  reactions = { likes: 0, unlikes: 0 }, // Provide a default value here
  hreflangs,
}) => {
  const { user, updateUserProfile, logout } = useAuth();
  const { t } = useTranslation("search");
  const [keyword, setKeyword] = useState("");
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [siteKey,setSiteKey]=useState()
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [minSubscriber, setMinSubscriber] = useState(0);
  const [maxSubscriber, setMaxSubscriber] = useState(Infinity);
  const [page, setPage] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [generateCount, setGenerateCount] = useState(
    typeof window !== "undefined"
      ? Number(localStorage.getItem("generateCount")) || 0
      : 0
  );
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
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
        const response = await fetch(
          `/api/content?category=YouTube-Channel-Search&language=${language}`
        );
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();

        setLikes(data.reactions?.likes || 0);
        setUnlikes(data.reactions?.unlikes || 0);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchContent();
  }, [i18n.language]);

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
          tool: "YouTube-Channel-Search",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error(t("Failed to submit review"));

      toast.success(t("Review submitted successfully!"));
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        userProfile: "",
        userName: "",
      });
      setShowReviewForm(false);
      fetchReviews("YouTube-Channel-Search");
    } catch (error) {
      console.error(t("Failed to submit review:"), error);
      toast.error(t("Failed to submit review."));
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
   const VALID_PAYMENT_STATUSES = ['COMPLETED', 'paid', 'completed'];
  
    const isFreePlan = !user || (
      user.plan === 'free' ||
      !VALID_PAYMENT_STATUSES.includes(user.paymentDetails?.paymentStatus) ||
      (user.paymentDetails?.createdAt &&
        (() => {
          const createdAt = new Date(user.paymentDetails.createdAt);
          const validityDays = user.plan === 'yearly_premium' ? 365 : user.plan === 'monthly_premium' ? 30 : 0;
          const validUntil = new Date(createdAt.setDate(createdAt.getDate() + validityDays));
          return validUntil < new Date();
        })())
    );
    useEffect(() => {
      if (isFreePlan) {
        const storedCount = parseInt(localStorage.getItem('generateCount') || '0', 10);
        setGenerateCount(storedCount);
      }
    }, [isFreePlan]);

  const handleSearchClick = async (e) => {
    e.preventDefault();
  
    // Check if user is logged in
    if (!user) {
      toast.error(t("Please log in to fetch channel data."));
      return;
    }
  
    // Check if CAPTCHA is verified
    if (!captchaVerified) {
      toast.error(t("Please complete the captcha"));
      return;
    }
  
    // Check the limit for non-logged in users (3 fetch limit)
    if (isFreePlan && generateCount >= 5) {
               toast.error(t("Free users are limited to 5 YouTube Channel Search  in their lifetime. Upgrade to premium for unlimited access."));
               return;
             }
  
    setLoading(true);
    setChannels([]);
    setFilteredChannels([]);
    setError("");
  
    // Check the generate count for non-premium users
    if (
      user &&
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount >= 5
    ) {
      toast.error(
        t(
          "You have reached the limit of generating tags. Please upgrade your plan for unlimited use."
        )
      );
      setLoading(false);
      return;
    }
  
    try {
      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error(t("Failed to fetch API tokens"));
  
      const tokens = await tokensResponse.json();
      let nextPageToken = "";
      let totalChannelsData = [];
      let tokenIndex = 0;
  
      while (
        totalChannelsData.length < 200 &&
        nextPageToken !== null &&
        tokenIndex < tokens.length
      ) {
        const apiKey = tokens[tokenIndex].token;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(
          keyword
        )}&key=${apiKey}&pageToken=${nextPageToken}`;
        const searchResponse = await fetch(searchUrl);
  
        if (!searchResponse.ok) {
          if (searchResponse.status === 403) {
            // Quota exceeded or invalid API key
            tokenIndex++;
            continue; // Try the next token
          } else {
            throw new Error(`HTTP error! status: ${searchResponse.status}`);
          }
        }
  
        const searchData = await searchResponse.json();
        const channelIds = searchData.items.map(
          (item) => item.snippet.channelId
        );
        const uniqueChannelIds = [...new Set(channelIds)];
        const channelsData = await getChannelsData(uniqueChannelIds, apiKey);
        totalChannelsData = totalChannelsData.concat(channelsData);
        nextPageToken = searchData.nextPageToken || null;
      }
  
      const filtered = filterChannels(totalChannelsData);
      setFilteredChannels(filtered);
      setChannels(filtered.slice(0, 50));
  
      // If the user is not logged in or doesn't have unlimited access, increment the generate count
      if (isFreePlan) {
        const newCount = generateCount + 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount);
        console.log(`Free user generation: ${newCount}/5`);
      }
  
    } catch (error) {
      console.error("Error:", error);
      setError(
        `${t("An error occurred while fetching channel data:")} ${
          error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };
  

  const filterChannels = (channels) => {
    return channels.filter((channel) => {
      const subscribers = parseInt(channel.statistics.subscriberCount);
      return subscribers >= minSubscriber && subscribers <= maxSubscriber;
    });
  };

  const getChannelsData = async (channelIds, apiKey) => {
    const detailsPromises = channelIds.map(async (channelId) => {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${apiKey}`;
      const response = await fetch(detailsUrl);
      if (!response.ok) {
        if (response.status === 403) {
          // quota exceeded or invalid API key
          throw new Error(`Quota exceeded for key: ${apiKey}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      const data = await response.json();
      return data.items[0];
    });

    return Promise.all(detailsPromises);
  };

  const handlePagination = (pageIndex) => {
    const startIdx = pageIndex * 50;
    const endIdx = startIdx + 50;
    const currentPageChannels = filteredChannels.slice(startIdx, endIdx);
    setChannels(currentPageChannels);
    setPage(pageIndex);
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
      const savedChannels = JSON.parse(
        localStorage.getItem("savedChannels") || "[]"
      );
      const isChannelSaved = savedChannels.some(
        (channel) => channel.toolUrl === window.location.href
      );
      setIsSaved(isChannelSaved);
    }
  }, [user, reactions.users]);

  const handleReaction = async (action) => {
    if (!user) {
      toast.error("Please log in to react.");
      return;
    }

    try {
      const response = await fetch("/api/reactions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "YouTube-Channel-Search",
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
    const savedChannels = JSON.parse(
      localStorage.getItem("savedChannels") || "[]"
    );
    const currentTool = {
      toolName: "YouTube Channel Search", // Name of the current tool
      toolUrl: window.location.href, // Current URL of the tool
    };

    const existingChannelIndex = savedChannels.findIndex(
      (channel) => channel.toolUrl === currentTool.toolUrl
    );

    if (existingChannelIndex === -1) {
      // If the tool is not already saved, save it
      savedChannels.push(currentTool);
      localStorage.setItem("savedChannels", JSON.stringify(savedChannels));
      setIsSaved(true);
      toast.success("Tool saved successfully!");
    } else {
      // If the tool is already saved, remove it
      savedChannels.splice(existingChannelIndex, 1);
      localStorage.setItem("savedChannels", JSON.stringify(savedChannels));
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
            <link
              rel="canonical"
              href={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Channel-Search", "youtube-channel-search")}`}
            />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Channel-Search", "youtube-channel-search")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732964967955-youtubechannelsearchb.png" />
            <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732964967955-youtubechannelsearchb.png" />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:domain"
              content={meta?.url
                .replace("tools/YouTube-Channel-Search", "")}
            />
            <meta
              property="twitter:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Channel-Search", "youtube-channel-search")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732964967955-youtubechannelsearchb.png" />
            <meta name="twitter:site" content="@ytubetools" />
            <meta name="twitter:image:alt" content="youtube-channel-search"/>

            {/* Alternate hreflang Tags for SEO */}
            {hreflangs &&
              hreflangs.map((hreflang, index) => (
                <link
                  key={index}
                  rel={hreflang.rel}
                  hreflang={hreflang.hreflang}
                  href={`${hreflang.href
                    .toLowerCase()
                    .replace("YouTube-Channel-Search", "youtube-channel-search")}`}
                />
              ))}
          </Head>
            {/* JSON-LD Structured Data */}
            <Script id="webpage-structured-data" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== "en" ? `/${i18n.language}` : ""}/tools/youtube-channel-search`,
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

<Script id="software-structured-data" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== "en" ? `/${i18n.language}` : ""}/tools/youtube-channel-search`,
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

       
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            {t("YouTube Channel Search")}
          </h1>
          <p className="text-white pb-3">
          YouTube Channel Search is a tool that helps you discover and explore YouTube channels based on keywords, niches, or topics.
          </p>
        
           {modalVisible && (
  <div
    className="bg-yellow-100 max-w-4xl mx-auto border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 shadow-md mb-6 mt-3"
    role="alert"
  >
    <div className="flex">
      <div>
        {isFreePlan ? (
          <p className="text-center p-3 alert-warning">
            {t(
              "You have {{remaining}} of 5 lifetime YouTube Channel Search  left. Upgrade to premium for unlimited access.",
              { remaining: 5 - generateCount }
            )}
            <Link href="/pricing" className="btn btn-warning ms-3">
              {t("Upgrade")}
            </Link>
          </p>
        ) : (
          <p className="text-center p-3 alert-warning">
            {t(`Hey ${user?.username}, you have unlimited YouTube Channel Search  as a ${user.plan}  user until your subscription expires.`)}
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
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
            <form className="max-w-sm mx-auto" onSubmit={handleSearchClick}>
              <div className="mb-3">
                <label
                  htmlFor="text"
                  className="block mb-2 text-sm font-medium "
                >
                  {t("Enter Keyword")}
                </label>
                <input
                  type="text"
                  id="text"
                  className="shadow-sm bg-gray-50 border border-gray-300 text-whitetext-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                  placeholder={t("Enter Keyword")}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label
                  htmlFor="number"
                  className="block mb-2 text-sm font-medium "
                >
                  {t("Min Subscriber")}
                </label>
                <input
                  type="number"
                  id="number"
                  className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                  placeholder={t("Min Subscriber")}
                  value={minSubscriber}
                  onChange={(e) => setMinSubscriber(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label
                  htmlFor="repeat-number"
                  className="block mb-2 text-sm font-medium "
                >
                  {t("Max Subscriber")}
                </label>
                <input
                  type="number"
                  id="repeat-number"
                  className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                  placeholder={t("Max Subscriber")}
                  value={maxSubscriber}
                  onChange={(e) => setMaxSubscriber(e.target.value)}
                  required
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
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                {t("Search")}
              </button>
            </form>
            <div className="reaction-bar flex items-center justify-between mt-4 p-3">
              <div className="flex items-center space-x-2 ps-5">
                <button
                  onClick={() => handleReaction("like")}
                  className="flex items-center space-x-1"
                  style={{ color: likeButtonColor }}
                >
                  <FaThumbsUp className="text-purple-600" />
                  <span>{likes} |</span>
                </button>

                <button
                  onClick={() => handleReaction("unlike")}
                  className="flex items-center space-x-1"
                  style={{ color: unlikeButtonColor }}
                >
                  <FaThumbsDown className="text-red-400" />
                  <span>{unlikes} |</span>
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center space-x-1"
                  style={{ color: reportButtonColor }}
                >
                  <FaFlag className="text-red-500" />
                  <span className="text-red-500">Report</span>
                </button>
              </div>

              <div className="flex items-center">
                <button
                  onClick={saveChannel}
                  className="flex items-center space-x-1"
                  style={{ color: saveButtonColor }}
                >
                  {isSaved ? (
                    <FaBookmark className="text-yellow-300" />
                  ) : (
                    <FaBookmark className="text-yellow-300" />
                  )}
                </button>
              </div>
            </div>

            {showReportModal && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="fixed inset-0 bg-black opacity-50"></div>
                <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("Report This Tool")}
                  </h2>
                  <textarea
                    className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                    placeholder={t("Describe your issue...")}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />
                  <div className="mt-4 flex justify-end space-x-4">
                    <button
                      className="btn btn-secondary text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline"
                      onClick={() => setShowReportModal(false)}
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      className="btn btn-primary text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                      onClick={() => handleReaction("report")}
                    >
                      {t("Submit Report")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>{" "}
          {loading && <div className="loader mt-4 mx-auto"></div>}
          {error && (
            <div className="text-red-500 text-center mt-4">{error}</div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div
          id="channelList"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 channels-grid"
        >
          {channels.map((channel, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg p-4 channel-card"
            >
              <Image
                src={channel.snippet.thumbnails.high.url}
                alt={channel.snippet.title}
                className="w-full h-auto rounded-md mb-4"
                width={300}
                height={300}
              />
              <div className="channel-info">
                <Link
                  href={`https://www.youtube.com/channel/${channel.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 font-bold text-xl"
                >
                  {channel.snippet.title}
                </Link>
                <p className="text-gray-700">
                  {t("Subscribers:")} {channel.statistics.subscriberCount}
                </p>
                <p className="text-gray-700">
                  {t("Total Views:")} {channel.statistics.viewCount}
                </p>
                <p className="text-gray-700">
                  {t("Videos:")} {channel.statistics.videoCount}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div id="pagination" className="text-center mt-3">
          {[...Array(Math.ceil(filteredChannels.length / 50)).keys()].map(
            (_, i) => (
              <button
                key={i}
                className={`btn btn-sm btn-outline-primary me-2 ${
                  page === i ? "active" : ""
                }`}
                onClick={() => handlePagination(i)}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
        <div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>

        <div className="p-5 shadow">
          <div className="accordion">
            <h2 className="faq-title">{t("Frequently Asked Questions")}</h2>
            <p className="faq-subtitle">
              {t(
                "Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us"
              )}
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
            <div className=" text-3xl font-bold mb-2">
              {t("Customer reviews")}
            </div>
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
              <h2 className="text-2xl font-semibold mb-4">
                {t("Leave a Review")}
              </h2>
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
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
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
                                                    alt={tool?.name}
                                                    className="rounded-full"
                                                    src={tool?.logo}
                                                    height={28}
                                                    width={28} // Add width for proper optimization
                                                    quality={50} // reduce quality if needed
                                      loading="lazy" // lazy load
                                                  />
          </div>
          <span className="ml-4 text-base font-medium text-gray-900 hover:text-indigo-600">{tool.name}</span>
        </div>
      </Link>
    </li>
  ))}
</ul>

</div>    
        {/* End of Related Tools Section */}
    

      <ToastContainer />
    </>
  );
};
export async function getServerSideProps(context) {
  return getContentProps("YouTube-Channel-Search", context.locale, context.req);
}

export default YouTubeChannelScraper;
