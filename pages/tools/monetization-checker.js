import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import Head from "next/head";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaStar, FaThumbsUp, FaThumbsDown, FaBookmark, FaFlag } from "react-icons/fa";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { format } from "date-fns";
import { i18n, useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { getContentProps } from "../../utils/getContentProps";
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const MonetizationChecker = ({ meta, reviews, content, relatedTools, faqs,reactions,translations}) => {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const { t } = useTranslation("monetization");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(0);
  const [unlikes, setUnlikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [generateCount, setGenerateCount] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);


  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(
          `/api/content?category=monetization-checker&language=${language}`
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
    fetchReviews();
  }, [i18n.language, t]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=monetization-checker");
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"),
      }));
      setReviews(formattedData);
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
      setGenerateCount(storedCount ? parseInt(storedCount) : 3);
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.paymentStatus === "success" || user.role === "admin")) {
      localStorage.removeItem("generateCount");
    }
  }, [user]);

  const handleInputChange = (e) => {
    setError("");
    setUrl(e.target.value);
  };

  const handleFetchClick = async () => {
    if (!url.trim()) {
      toast.error(t("Please enter a valid URL."));
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch("/api/monetization-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || t("Failed to fetch data"));
      }

      const data = await response.json();
      
      setData(data);
      toast.success(t("Data fetched successfully!"));
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
    
    setIsSaved(savedChannels.some(channel => channel.toolUrl === window.location.href));
  }, [user, reactions.users]);
  const handleReaction = async (action) => {
    if (!user) {
      toast.error(t("Please log in to react."));
      return;
    }

    try {
      const response = await fetch("/api/content", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "monetization-checker",
          userId: user.email,
          action,
          report: action === "report" ? reportText : undefined,
        }),
      });

      if (!response.ok) throw new Error(t("Failed to update reaction"));

      const updatedData = await response.json();
      setLikes(updatedData.reactions.likes || 0);
      setUnlikes(updatedData.reactions.unlikes || 0);

      if (action === "like") {
        setHasLiked(!hasLiked); // Toggle the liked state
        setHasUnliked(false);   // Reset dislike
      } else if (action === "unlike") {
        setHasUnliked(!hasUnliked); // Toggle the disliked state
        setHasLiked(false);         // Reset like
      } else if (action === "report") {
        setHasReported(!hasReported); // Toggle the reported state
        setShowReportModal(false);
        setReportText("");
        toast.success(t("Report submitted successfully."));
      }
    } catch (error) {
      toast.error(t("Failed to update reaction"));
    }
  };

  const saveChannel = () => {
    const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    const currentTool = {
      toolName: "YouTube Moniotization Checker", // Name of the current tool
      toolUrl: window.location.href, // Current URL of the tool
    };
    
    if (!isSaved) {
      savedChannels.push(currentTool);
      localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
      setIsSaved(true);
      toast.success("Tool saved successfully!");
    } else {
      const updatedChannels = savedChannels.filter(channel => channel.toolUrl !== currentTool.toolUrl);
      localStorage.setItem('savedChannels', JSON.stringify(updatedChannels));
      setIsSaved(false);
      toast.success("Tool removed from saved list.");
    }
  };
  const saveButtonColor = isSaved ? "#FFD700" : "#ccc";
  const convertDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    const seconds = parseInt(match[3], 10) || 0;

    return `${hours > 0 ? hours + " hours, " : ""}${
      minutes > 0 ? minutes + " minutes, " : ""
    }${seconds > 0 ? seconds + " seconds" : ""}`.trim();
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
          tool: "monetization-checker",
          ...newReview,
          userProfile: user?.profileImage || "",
          userName: user?.username,
        }),
      });

      if (!response.ok) {
        throw new Error(t("Failed to submit review"));
      }

      toast.success(t("Review submitted successfully!"));
      setNewReview({ rating: 0, comment: "", userProfile: "" });
      fetchReviews();
    } catch (error) {
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

  return (
    <>
      <div className="bg-box">
        <div>
          <Image className="shape1" src={announce} alt="announce" />
          <Image className="shape2" src={cloud} alt="cloud" />
          <Image className="shape3" src={cloud2} alt="cloud2" />
          <Image className="shape4" src={chart} alt="chart" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
        <Head>
  <title>{meta?.title}</title>
  <meta name="description" content={meta?.description} />
  
  {/* Open Graph Tags */}
  <meta property="og:url" content={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/monetization-checker`} />
  <meta property="og:title" content={meta?.title} />
  <meta property="og:description" content={meta?.description} />
  <meta property="og:image" content={meta?.image || ""} />
  
  {/* Twitter Card Tags */}
  <meta name="twitter:card" content={meta?.image || ""} />
  <meta property="twitter:domain" content={meta?.url} />
  <meta property="twitter:url" content={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/monetization-checker`} />
  <meta name="twitter:title" content={meta?.title} />
  <meta name="twitter:description" content={meta?.description} />
  <meta name="twitter:image" content={meta?.image || ""} />
  
  {/* hreflang and Alternate Language Links */}
  <link rel="alternate" href={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/monetization-checker`}  hrefLang="x-default" />
  <link rel="alternate" href={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/monetization-checker`}  hrefLang="en" />
  {translations && Object.keys(translations).map(lang => (
    lang !== 'en' && (
      <link
        key={lang}
        rel="alternate"
        hrefLang={lang}
        href={`${meta?.url}/${lang}/tools/monetization-checker`}
      />
    )
  ))}
  
  {/* JSON-LD Structured Data */}
  <Script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: meta?.title,
      url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/monetization-checker`,
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
      url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/monetization-checker`,
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
</Head>
          <ToastContainer />
          <h1 className="text-3xl font-bold text-center mb-6 text-white">
            {t("YouTube Monetization Checker")}
          </h1>
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
                        {t(
                          "Congratulations! You can now check monetization unlimited times."
                        )}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You are not upgraded. You can check monetization")}{" "}
                        {5 - generateCount} {t("more times.")}{" "}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t("Upgrade")}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t("Please log in to check monetization.")}
                    </p>
                  )}
                </div>
                <button
                  className="text-yellow-700 ml-auto"
                  onClick={() => setModalVisible(false)}
                >
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
                placeholder={t("Enter YouTube Video or Channel URL...")}
                value={url}
                onChange={handleInputChange}
              />
              <small className="text-muted">
                {t("Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s")}
              </small>
            </div>
            <button
              className={`btn btn-danger w-full py-2 text-white font-bold rounded transition-colors duration-200 ${
                loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-700"
              } focus:outline-none focus:shadow-outline`}
              onClick={handleFetchClick}
              disabled={loading || !user}
            >
              {loading ? t("Loading...") : t("Check Monetization")}
            </button>
            <div className="reaction-bar  flex items-center justify-between mt-4 p-2">
           <div className="flex items-center space-x-2 ps-5 mx-auto">
              <button
                onClick={() => handleReaction("like")}
                className="flex items-center space-x-1"
                
              >
                <FaThumbsUp className="text-blue-600"/>
                <span>{likes}</span>
              </button>
              <button
                onClick={() => handleReaction("unlike")}
                className="flex items-center space-x-1"
                
              >
                <FaThumbsDown className="text-red-400"/>
                <span>{unlikes}</span>
              </button>
            
              
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1"
                
              >
                <FaFlag className="text-red-500"/>
                <span className="text-red-500">Report</span>
              </button>
              <button
                  onClick={saveChannel}
                  className="flex items-center space-x-1"
                  style={{ color: saveButtonColor }}
                >
                  {isSaved ? <FaBookmark /> : <FaBookmark />}
                </button>
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
            </div>
          </div>
          {error && (
            <div className="alert alert-danger text-red-500 text-center mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        {data && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            {data.type === "video" && (
              <>
                <div className="flex justify-center mb-4">
                  <Image
                    src={data.thumbnails.high.url}
                    alt="Video Thumbnail"
                    width={300}
                    height={300}
                    className="rounded-lg"
                  />
                </div>
                <h2 className="text-center font-semibold text-lg">
      <span className="text-gray-700">{t("Monetization Status")}:</span>{" "}
      <span className={`${
        data.isMonetized ? "text-green-500" : "text-red-500"
      } font-bold`}>
        {data.isMonetized ? t("Monetized") : t("Not Monetized")}
      </span>
    </h2>
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border">{t("Property")}</th>
                      <th className="px-4 py-2 border">{t("Value")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border">{t("Video URL")}</td>
                      <td className="px-4 py-2 border">
                        <a
                          href={data.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {data.videoUrl}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Channel URL")}</td>
                      <td className="px-4 py-2 border">
                        <a
                          href={data.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {data.channelUrl}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Title")}</td>
                      <td className="px-4 py-2 border">{data.title}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Description")}</td>
                      <td className="px-4 py-2 border">{data.description}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("View Count")}</td>
                      <td className="px-4 py-2 border">{data.viewCount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Like Count")}</td>
                      <td className="px-4 py-2 border">{data.likeCount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Dislike Count")}</td>
                      <td className="px-4 py-2 border">{data.dislikeCount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Comment Count")}</td>
                      <td className="px-4 py-2 border">{data.commentCount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Duration")}</td>
                      <td className="px-4 py-2 border">
                        {convertDuration(data.duration)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Published At")}</td>
                      <td className="px-4 py-2 border">{data.publishedAt}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Channel Title")}</td>
                      <td className="px-4 py-2 border">{data.channelTitle}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border">{t("Monetization Status")}</td>
                      <td className="px-4 py-2 border">{data.isMonetized}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
           {data.type === "channel" && (
  <>
    <div className="flex justify-center mb-4">
      <Image
        src={data.thumbnails.high.url}
        alt="Channel Thumbnail"
        width={300}
        height={300}
        className="rounded-lg"
      />
    </div>
    <h2 className="text-center font-semibold text-lg">
      <span className="text-gray-700">{t("Monetization Status")}:</span>{" "}
      <span className={`${
        data.isMonetized ? "text-green-500" : "text-red-500"
      } font-bold`}>
        {data.isMonetized ? t("Monetized") : t("Not Monetized")}
      </span>
    </h2>
    <table className="min-w-full bg-white mt-4">
      <thead>
        <tr>
          <th className="px-4 py-2 border">{t("Property")}</th>
          <th className="px-4 py-2 border">{t("Value")}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">{t("Channel URL")}</td>
          <td className="px-4 py-2 border">
            <a
              href={data.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.channelUrl}
            </a>
          </td>
        </tr>
        <tr>
          <td className="px-4 py-2 border">{t("Channel Title")}</td>
          <td className="px-4 py-2 border">{data.title}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 border">{t("Description")}</td>
          <td className="px-4 py-2 border">{data.description}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 border">{t("View Count")}</td>
          <td className="px-4 py-2 border">{data.viewCount}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 border">{t("Subscriber Count")}</td>
          <td className="px-4 py-2 border">
            {data.subscriberCount}
          </td>
        </tr>
        <tr>
          <td className="px-4 py-2 border">{t("Video Count")}</td>
          <td className="px-4 py-2 border">{data.videoCount}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 border">{t("Monetization Status")}</td>
          <td className="px-4 py-2 border">{data.isMonetized}</td>
        </tr>
      </tbody>
    </table>
  </>
)}

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
                      src={`data:image/jpeg;base64,${review?.userProfile}`}
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
          <h2 className="text-2xl font-bold mb-5 text-center">{t("Related Tools")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools.map((tool, index) => (
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
                  className="w-14 h-14 mr-4"
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

// export async function getServerSideProps({ req, locale }) {
//   const host = req.headers.host;
//   const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
//   const apiUrl = `${protocol}://${host}/api/content?category=monetization-checker&language=${locale}`;

//   try {
//     const contentResponse = await fetch(apiUrl);

//     if (!contentResponse.ok) {
//       throw new Error(`Failed to fetch content: ${contentResponse.statusText}`);
//     }

//     const contentData = await contentResponse.json();

//     if (!contentData.translations || !contentData.translations[locale]) {
//       throw new Error("Invalid content data format");
//     }

//     const meta = {
//       title: contentData.translations[locale]?.title || "",
//       description: contentData.translations[locale]?.description || "",
//       image: contentData.translations[locale]?.image || "",
//       url: `${protocol}://${host}`,
//     };
//     const reactions = contentData.translations[locale]?.reactions || { likes: 0, unlikes: 0, reports: [], users: {} };
//     return {
//       props: {
//         meta,
//         faqs: contentData.translations[locale]?.faqs || [],
//         relatedTools: contentData.translations[locale]?.relatedTools || [],
//         existingContent: contentData.translations[locale]?.content || "",
//         reactions,
//         ...(await serverSideTranslations(locale, [
//           "common",
//           "tagextractor",
//           "navbar",
//           "footer",
//           "monetization",
//         ])),
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching data:", error);

//     return {
//       props: {
//         meta: {},
//         faqs: [],
//         relatedTools: [],
//         existingContent: "",
//         reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
//         ...(await serverSideTranslations(locale, [
//           "common",
//           "tagextractor",
//           "navbar",
//           "footer",
//           "monetization",
//         ])),
//       },
//     };
//   }
// }
export async function getServerSideProps(context) {
  return getContentProps("monetization-checker", context.locale, context.req);
}
export default MonetizationChecker;
