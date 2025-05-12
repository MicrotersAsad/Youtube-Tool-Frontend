/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from "react";
import {
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaTwitter,
  FaStar,
  FaBookmark,
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
} from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Head from "next/head";
import { i18n, useTranslation } from "next-i18next";
import { getContentProps } from "../../utils/getContentProps";
import Script from "next/script";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import ReCAPTCHA from "react-google-recaptcha";

const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const YtThumbnailDw = ({
  meta,
  reviews,
  content,
  relatedTools,
  faqs,
  reactions,
  hreflangs,
}) => {
  const { isLoggedIn, user, updateUserProfile } = useAuth();
  const [t] = useTranslation("thumbnail");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteKey, setSiteKey] = useState();
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [thumbnails, setThumbnails] = useState(null);
  const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState("");
  const [generateCount, setGenerateCount] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "", title: "" });
  const [isUpdated, setIsUpdated] = useState(false);
  const [modalVisible, setModalVisible] = useState(true); // Controls alert modal
  const [showReviewForm, setShowReviewForm] = useState(false); // Controls review modal
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
  const router = useRouter();

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const closeModal = () => setModalVisible(false);

  // Check if running on localhost
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1");

  const handleCaptchaChange = (value) => {
    if (value) {
      setCaptchaVerified(true);
    }
  };

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const protocol = window.location.protocol === "https:" ? "https" : "http";
        const host = window.location.host;
        const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00';

        if (!token) {
          console.error('No authentication token found!');
          return;
        }

        const response = await fetch(`${protocol}://${host}/api/extensions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success) {
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
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(
          `/api/content?category=Youtube-Thumbnails-Generator&language=${language}`
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem("generateCount"), 10) || 0;
      setGenerateCount(count);
    }
  }, []);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

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

  const fetchYouTubeData = async () => {
    if (!captchaVerified && !isLocalHost) {
      toast.error("Please complete the CAPTCHA verification.");
      return;
    }

    if (isFreePlan && generateCount >= 5) {
      toast.error(t("Free users are limited to 5 thumbnail generations in their lifetime. Upgrade to premium for unlimited access."));
      return;
    }

    if (!videoUrl) {
      toast.error("Please enter a valid YouTube video URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error("Invalid video URL.");
      }

      const thumbnails = generateThumbnailUrls(videoId);
      if (thumbnails) {
        setThumbnails(thumbnails);
        if (isFreePlan) {
          const newCount = generateCount + 1;
          setGenerateCount(newCount);
          localStorage.setItem('generateCount', newCount.toString());
        }
      } else {
        setError("No thumbnails found for this video.");
      }
    } catch (error) {
      setError("Failed to fetch YouTube data. Please check the video URL.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    const match = url.match(regex);
    return match ? match[2] : null;
  };

  const generateThumbnailUrls = (videoId) => {
    const resolutions = ['sddefault', 'mqdefault', 'hqdefault', 'maxresdefault'];
    const thumbnails = {};

    resolutions.forEach((resolution) => {
      thumbnails[resolution] = {
        url: `https://img.youtube.com/vi/${videoId}/${resolution}.jpg`,
      };
    });

    return thumbnails;
  };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment || !newReview.title) {
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
          tool: "Youtube-Thumbnails-Generator",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted successfully!");
      setNewReview({
        rating: 0,
        comment: "",
        title: "",
      });
      setShowReviewForm(false); // Close review modal after submission
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
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length || 0
  ).toFixed(1);

  const openReviewForm = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowReviewForm(true); // Open review modal
  };

  const handleShowMoreReviews = () => {
    setShowAllReviews(true);
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
          category: "Youtube-Thumbnails-Generator",
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
      toolName: "YouTube Thumbnail Downloader",
      toolUrl: window.location.href,
    };

    const existingChannelIndex = savedChannels.findIndex(
      (channel) => channel.toolUrl === currentTool.toolUrl
    );

    if (existingChannelIndex === -1) {
      savedChannels.push(currentTool);
      localStorage.setItem("savedChannels", JSON.stringify(savedChannels));
      setIsSaved(true);
      toast.success("Tool saved successfully!");
    } else {
      savedChannels.splice(existingChannelIndex, 1);
      localStorage.setItem("savedChannels", JSON.stringify(savedChannels));
      setIsSaved(false);
      toast.success("Tool removed from saved list.");
    }
  };

  const likeButtonColor = hasLiked ? "#4CAF50" : "#ccc";
  const unlikeButtonColor = hasUnliked ? "#F44336" : "#ccc";
  const reportButtonColor = hasReported ? "#FFD700" : "#ccc";
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
            <title>{meta?.title}</title>
            <meta name="description" content={meta?.description} />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content="index, follow" />
            <link
              rel="canonical"
              href={`${meta?.url
                .toLowerCase()
                .replace("Youtube-Thumbnails-Generator", "youtube-thumbnail")}`}
            />
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("Youtube-Thumbnails-Generator", "youtube-thumbnail")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732960462873-youtubethumbnailsdownloaderb.png" />
            <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732960462873-youtubethumbnailsdownloaderb.png" />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:domain"
              content={meta?.url.replace("tools/Youtube-Thumbnails-Generator", "")}
            />
            <meta
              property="twitter:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("Youtube-Thumbnails-Generator", "youtube-thumbnail")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732960462873-youtubethumbnailsdownloaderb.png" />
            <meta name="twitter:site" content="@ytubetools" />
            <meta name="twitter:image:alt" content="youtube-thumbnail" />
            {hreflangs &&
              hreflangs.map((hreflang, index) => (
                <link
                  key={index}
                  rel={hreflang.rel}
                  hreflang={hreflang.hreflang}
                  href={`${hreflang.href
                    .toLowerCase()
                    .replace("Youtube-Thumbnails-Generator", "youtube-thumbnail")}`}
                />
              ))}
          </Head>

          <Script id="webpage-structured-data" type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: meta?.title,
              url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-thumbnail`,
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
              url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-thumbnail`,
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

          <h1 className="text-3xl pt-5 text-white">
            {t("YouTube Thumbnails Downloader")}
          </h1>
          <p className="pb-3 text-white">
            YouTube Thumbnails Download is a user-friendly tool that allows you to save high-quality thumbnails from any YouTube video
          </p>
          <ToastContainer />

          {/* Alert Modal for Free/Premium Users */}
        
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
              "You have {{remaining}} of 5 lifetime download thumbnails . left. Upgrade to premium for  download unlimited thumbnails.",
              { remaining: 5 - generateCount }
            )}
            <Link href="/pricing" className="btn btn-warning ms-3">
              {t("Upgrade")}
            </Link>
          </p>
        ) : (
          <p className="text-center p-3 alert-warning">
            {t(`Hey ${user?.username}, you have unlimited download thumbnails as a ${user.plan}  user until your subscription expires.`)}
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
                  Enter YouTube Video URL{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. www.youtube.com/channel/xxxxxx or www.youtube.com/watch?v=xxxxxxx"
                  aria-label="YouTube Video URL"
                  aria-describedby="button-addon2"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div className="ms-4">
                {!isLocalHost && siteKey && (
                  <ReCAPTCHA
                    sitekey={siteKey}
                    onChange={handleCaptchaChange}
                  />
                )}
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
                          <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2-9.4-6.1-9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
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
                          <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2-9.4-6.1-9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
                        </svg>
                      </span>
                      Fetch Thumbnail
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
                      className={`text-lg ${
                        isSaved ? "text-purple-600" : "text-red-500"
                      }`}
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
        <div className="d-flex flex-wrap justify-content-center">
          {thumbnails &&
            Object.entries(thumbnails).map(([resolution, { url }]) => (
              <div
                key={resolution}
                className={`p-2 ${url === selectedThumbnailUrl ? "selected" : ""}`}
                onClick={() => setSelectedThumbnailUrl(url)}
              >
                {url ? (
                  <Image
                    src={url}
                    alt={`Thumbnail ${resolution}`}
                    width={200}
                    height={150}
                    className="img-thumbnail"
                    style={{
                      border: url === selectedThumbnailUrl ? "3px solid blue" : "none",
                      cursor: "pointer",
                    }}
                  />
                ) : (
                  <div>Loading...</div>
                )}
                <p className="text-center">{resolution}</p>
              </div>
            ))}
        </div>

        <div className="text-center mt-4">
          {selectedThumbnailUrl && (
            <button className="btn btn-danger">
              <a
                target="_blank"
                href={selectedThumbnailUrl}
                download="YouTube_thumbnail.jpg"
                rel="noreferrer"
              >
                <FaDownload className="text-white" />
              </a>
            </button>
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

          {/* Review Modal */}
          {showReviewForm && (
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
                  onClick={() => setShowReviewForm(false)}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Tools Section */}
      <div className="bg-indigo-50 p-5">
        <h2 className="text-2xl font-bold mb-5 pt-5 text-center">
          {t("Related Tools")}
        </h2>
        <ul role="list" className="mx-auto gap-3 grid max-w-7xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {relatedTools.map((tool, index) => (
            <li
              key={index}
              className="cursor-pointer bg-white rounded-xl list-none p-4 shadow transition duration-200 ease-in-out hover:scale-[101%] hover:bg-gray-50 hover:shadow-lg hover:ring-1 hover:ring-indigo-500"
            >
              <Link
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
                      width={28}
                      quality={50}
                      loading="lazy"
                    />
                  </div>
                  <span className="ml-4 text-base font-medium text-gray-900 hover:text-indigo-600">
                    {tool.name}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .selected {
          border: 3px solid blue;
        }
        .img-thumbnail {
          cursor: pointer;
        }
        .review-card {
          margin-top: 20px;
          padding: 20px;
          background-color: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        .share-icons {
          display: flex;
          justify-content: space-between;
          width: 150px;
        }
      `}</style>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps(
    "Youtube-Thumbnails-Generator",
    context.locale,
    context.req
  );
}

export default YtThumbnailDw;