import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import { getContentProps } from "../../utils/getContentProps";
import {
  FaThumbsUp, 
  FaThumbsDown ,
  FaFlag ,
  FaBookmark ,
  FaCopy,
  FaDownload,
  FaStar,
  FaShareAlt ,
  FaTools,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import Head from "next/head";
import Script from "next/script";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { i18n } from "next-i18next";
import ReCAPTCHA from "react-google-recaptcha";

const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const TagExtractor = ({ meta, reviews, content, relatedTools, faqs,reactions,hreflangs }) => {
  const { user, updateUserProfile } = useAuth();
  const [likes, setLikes] = useState(reactions.likes || 0);
  const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("tagextractor");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siteKey,setSiteKey]=useState()
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false); // State for reCAPTCHA
  const [newReview, setNewReview] = useState({
    name: "",
    title: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

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

const isGenerateButtonActive = () => {
  return captchaVerified && fetchLimitExceeded 
};

useEffect(() => {
  const fetchContent = async () => {
    try {
      const language = i18n.language || "en";
      const response = await fetch(
        `/api/content?category=tagExtractor&language=${language}`
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


  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    if (user && !user.name) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile]);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && user.role !== "admin") {
      const storedCount = localStorage.getItem("generateCount");
      setGenerateCount(storedCount ? parseInt(storedCount) : 5);
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.paymentStatus === "success" || user.role === "admin")) {
      localStorage.removeItem("generateCount");
    }
  }, [user]);

  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setGeneratedTitles(
      generatedTitles.map((title) => ({
        ...title,
        selected: newSelection,
      }))
    );
  };

  const toggleTitleSelect = (index) => {
    const newTitles = [...generatedTitles];
    newTitles[index].selected = !newTitles[index].selected;
    setGeneratedTitles(newTitles);
    setSelectAll(newTitles.every((title) => title.selected));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(t("copied", { text })),
      (err) => toast.error(t("failedToCopy"))
    );
  };

  const copySelectedTitles = () => {
    const selectedTitlesText = generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, "")) // Remove leading numbers and dots
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  const downloadSelectedTitles = () => {
    const selectedTitlesText = generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, "")) // Remove leading numbers and dots
      .join("\n");
    const element = document.createElement("a");
    const file = new Blob([selectedTitlesText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "selected_titles.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

      const titlesWithSelection = data.tags.map((tag) => ({
        text: tag,
        selected: false,
      }));

      setGeneratedTitles(titlesWithSelection);
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

  const handleReviewSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!newReview.rating || !newReview.comment) {
      toast.error(t("allFieldsRequired"));
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "tagExtractor",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t("reviewSubmitted"));
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        title: "", // Reset title field
        userProfile: "",
      });
      setShowReviewForm(false);
      fetchReviews("tagExtractor");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(t("reviewSubmitFailed"));
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
    setModalVisible(true);
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
    }

    // Check if data is already saved
    const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    const isChannelSaved = savedChannels.some(channel => channel.videoUrl === videoUrl);
    setIsSaved(isChannelSaved);
  }, [user, reactions.users, videoUrl]);


  const handleReaction = async (action) => {
    if (!user) {
      toast.error('Please log in to react.');
      return;
    }

    try {
      const response = await fetch('/api/reactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'tagExtractor', // Replace with appropriate category
          userId: user.email,
          action,
          reportText: action === 'report' ? reportText : null, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update reaction');
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
      toolName: "Youtube Tag Extractor", // Name of the current tool
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
                .replace("tagExtractor", "tag-extractor")}`}
            />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .replace("tagExtractor", "tag-extractor")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content={meta?.image} />
            <meta property="og:image:secure_url" content={meta?.image} />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta
  name="twitter:domain"
  content={meta?.url.replace("tools/tagExtractor", "")}
/>

            <meta
              property="twitter:url"
              content={`${meta?.url
                .replace("tagExtractor", "tag-extractor")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content={meta?.image} />
            <meta name="twitter:site" content="@ytubetools" />
            <meta name="twitter:image:alt" content={meta?.imageAlt} />

            {/* Alternate hreflang Tags for SEO */}
            {hreflangs &&
              hreflangs.map((hreflang, index) => (
                <link
                  key={index}
                  rel={hreflang.rel}
                  hreflang={hreflang.hreflang}
                  href={`${hreflang.href
                    .replace("tagExtractor", "tag-extractor")}`}
                />
              ))}
          </Head>
  {/* JSON-LD Structured Data */}
  <Script id="webpage-tag-extractor" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/tag-extractor`,
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

<Script id="software-application-tag-extractor" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/tag-extractor`,
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

<Script id="faq-tag-extractor" type="application/ld+json">
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

        <div className="max-w-7xl mx-auto p-4">
          <h1 className="text-3xl text-white">{t("YouTube Tag Extractor")}</h1>
          <ToastContainer />
          {modalVisible && (
            <div
              className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3"
              role="alert"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg
                    className="fill-current h-6 w-6 text-yellow-500 mr-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    {/* SVG content can go here */}
                  </svg>
                  <div className="mt-4">
                    {!user ? (
                      <p className="text-center p-3 alert-warning">
                        {t("loginToGenerateTags")}
                      </p>
                    ) : user.paymentStatus === "success" ||
                      user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        {t("generateUnlimitedTags")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("notUpgraded")} {5 - generateCount} {t("moreTimes")}.{" "}
                        <Link className="btn btn-warning ms-3" href="/pricing">
                          {t("upgrade")}
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-yellow-700" onClick={closeModal}>
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
        placeholder="e.g. www.youtube.com/channel/xxxxxx or www.youtube.com/watch?v=xxxxxxx"
        aria-label="YouTube Video URL"
        aria-describedby="button-addon2"
        value={videoUrl}
        onChange={handleUrlChange}
      />
    </div>
    <div className="ms-5">
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
  onClick={fetchTags}
  disabled={!isGenerateButtonActive()}
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
        {tags.length > 0 ? (
          <ul className="tags-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedTitles.map((title, index) => (
              <li
                key={index}
                className="tag-item flex items-center p-2 border rounded-md"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={title.selected}
                  onChange={() => toggleTitleSelect(index)}
                />
                {title.text.replace(/^\d+\.\s*/, "")}
                <FaCopy
                  className="ml-2 cursor-pointer"
                  onClick={() =>
                    copyToClipboard(title.text.replace(/^\d+\.\s*/, ""))
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p></p>
        )}
        <div className="text-center my-4">
          {generatedTitles.length > 0 && (
            <div className="inline-block p-2 rounded-md bg-gray-200">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="mr-2"
              />
              <span>{t("selectAll")}</span>
            </div>
          )}
        </div>
        <div className="flex justify-center my-4">
          {generatedTitles.some((title) => title.selected) && (
            <>
              <FaCopy
                onClick={copySelectedTitles}
                className="text-red-500 cursor-pointer mx-2 text-2xl"
              />
              <FaDownload
                onClick={downloadSelectedTitles}
                className="text-red-500 cursor-pointer mx-2 text-2xl"
              />
            </>
          )}
        </div>

        <div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>

        <div className="accordion shadow p-5">
          <h2 className="faq-title">{t("frequentlyAskedQuestions")}</h2>
          <p className="faq-subtitle">{t("answeredAllFAQs")}</p>
          <div className="faq-grid">
            {faqs?.map((faq, index) => (
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

        <hr className="mt-4 mb-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="p-4 bg-white shadow-md rounded-md">
            <div className="text-xl font-bold mb-2">{t("customerReviews")}</div>
            <div className="flex items-center mb-2">
              <div className="text-xl font-bold mr-2">
                {overallRating || "0"}
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    color={
                      i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"
                    }
                    size={18}
                  />
                ))}
              </div>
              <div className="ml-2 text-sm text-gray-500">
                {reviews.length} {t("globalRatings")}
              </div>
            </div>
            <div>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center mb-2">
                  <div className="w-16 text-right mr-2">{rating}-star</div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full relative">
                    <div
                      className="h-3 bg-yellow-500 rounded-full absolute top-0 left-0"
                      style={{ width: `${calculateRatingPercentage(rating)}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-left ml-2">
                    {calculateRatingPercentage(rating).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            <hr className="my-4" />
            <div>
              <h4 className="text-lg font-semibold">{t("reviewThisTool")}</h4>
              <p className="text-sm text-gray-600">{t("shareYourThoughts")}</p>
              <button
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 w-full"
                onClick={openReviewForm}
              >
                {t("writeReview")}
              </button>
            </div>
          </div>

          <div className="p-4 bg-white shadow-md rounded-md col-span-1 md:col-span-1">
            {reviews?.slice(0, 5).map((review, index) => (
              <div
                key={index}
                className="border p-4 mb-4 bg-gray-50 rounded-md shadow-sm"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={review?.userProfile}
                      alt={review.name}
                      width={40}
                      height={40}
                      layout="intrinsic"
                      priority
                    />
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-sm">
                      {review?.userName}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {t("verifiedPurchase")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      size={18}
                      color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                    />
                  ))}
                </div>
                <div className="text-sm mb-2">{review.comment}</div>
                <div className="text-gray-500 text-xs">
                  {t("reviewedOn")} {review.createdAt}
                </div>
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 w-full"
                onClick={handleShowMoreReviews}
              >
                {t("seeMoreReviews")}
              </button>
            )}
            {showAllReviews &&
              reviews?.slice(5).map((review, index) => (
                <div
                  key={index}
                  className="border p-4 mb-4 bg-gray-50 rounded-md shadow-sm"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={review?.userProfile}
                        alt={review.name}
                        width={40}
                        height={40}
                        layout="intrinsic"
                        priority
                      />
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-sm">
                        {review?.userName}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {t("verifiedPurchase")}
                      </div>
                      <p className="text-gray-400 text-xs">
                        {t("reviewedOn")} {review?.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold mb-2">
                    {review.title}
                  </div>
                  <div className="text-sm mb-2">{review.comment}</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        size={18}
                        color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {modalVisible && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="fixed inset-0 bg-black opacity-50"></div>
              <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                  {t("leaveReview")}
                </h2>
                <div className="mb-4">
                  <StarRating
                    rating={newReview.rating}
                    setRating={(rating) =>
                      setNewReview({ ...newReview, rating })
                    }
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder={t("reviewTitle")}
                    value={newReview.title}
                    onChange={(e) =>
                      setNewReview({ ...newReview, title: e.target.value })
                    }
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    className="w-full p-2 border rounded-md"
                    placeholder={t("yourReview")}
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                  />
                </div>
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline w-full"
                  onClick={handleReviewSubmit}
                >
                  {t("submitReview")}
                </button>
                <button
                  className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2 w-full"
                  onClick={() => setModalVisible(false)}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-5 text-center">
            {t("Related Tools")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools?.map((tool, index) => (
              <a
                key={index}
                href={tool.link}
                className="flex items-center border rounded-lg p-4 bg-gray-100 transition"
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
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps("tagExtractor", context.locale, context.req);
}

export default TagExtractor;
