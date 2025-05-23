import React, { useState, useEffect } from "react";
import {
  FaShareAlt,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaCopy,
  FaDownload,
  FaStar,
  FaFlag,
  FaBookmark,
  FaThumbsUp,
  FaThumbsDown,
  FaPhoneVolume,
  FaLanguage,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import Script from "next/script";
import dynamic from "next/dynamic";
import { getContentProps } from "../../utils/getContentProps";
import { i18n } from "next-i18next";
import ReCAPTCHA from "react-google-recaptcha";
import Skeleton from "react-loading-skeleton";
import axios from "axios";
import { useRouter } from "next/router";

const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const availableLanguages = [
  { code: "en", name: "English", flag: "us" },
  { code: "fr", name: "Français", flag: "fr" },
  { code: "zh-HANT", name: "中国传统的", flag: "cn" },
  { code: "zh-HANS", name: "简体中文", flag: "cn" },
  { code: "nl", name: "Nederlands", flag: "nl" },
  { code: "gu", name: "ગુજરાતી", flag: "in" },
  { code: "hi", name: "हिंदी", flag: "in" },
  { code: "it", name: "Italiano", flag: "it" },
  { code: "ja", name: "日本語", flag: "jp" },
  { code: "ko", name: "한국어", flag: "kr" },
  { code: "pl", name: "Polski", flag: "pl" },
  { code: "pt", name: "Português", flag: "pt" },
  { code: "ru", name: "Русский", flag: "ru" },
  { code: "es", name: "Español", flag: "es" },
  { code: "de", name: "Deutsch", flag: "de" },
];

const availableTones = [
  { value: "formal", label: "Formal" },
  { value: "informal", label: "Informal" },
  { value: "neutral", label: "Neutral" },
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
];

const YouTubeHashtagGenerator = ({
  meta,
  reviews,
  content,
  relatedTools,
  faqs,
  reactions,
  hreflangs,
}) => {
  const { user, updateUserProfile } = useAuth();
  const { t } = useTranslation("hashtag");
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");
  const [generateHashTag, setGenerateHashTag] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "", title: "" });
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
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [siteKey, setSiteKey] = useState();

  // Fallback image for invalid user profiles
  const FALLBACK_IMAGE = "/default-profile.png"; // Ensure this image exists in your public folder

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const closeModal = () => setModalVisible(false);

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
        const token = "AZ-fc905a5a5ae08609ba38b046ecc8ef00";

        if (!token) {
          console.error("No authentication token found!");
          return;
        }

        const response = await fetch(`${protocol}://${host}/api/extensions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
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
          console.error("Error fetching extensions:", result.message);
        }
      } catch (error) {
        console.error("Error fetching configurations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleToneChange = (event) => {
    setSelectedTone(event.target.value);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(
          `/api/content?category=YouTube-Hashtag-Generator&language=${language}`
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
    fetch("/api/deal")
      .then((res) => res.json())
      .then((data) => setPrompt(data[0]));
  }, []);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem("generateCount"), 10) || 0;
      setGenerateCount(count);
    }
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === ".") {
      event.preventDefault();
      processTags(input.trim());
    }
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    setInput(value);

    const delimiters = [",", "."];
    const parts = value
      .split(new RegExp(`[${delimiters.join("")}]`))
      .map((part) => part.trim())
      .filter((part) => part);

    if (parts.length > 1) {
      const newTags = [...tags, ...parts];
      setTags(newTags);
      setInput("");
    }
  };

  const handleBlur = () => {
    processTags(input.trim());
  };

  const processTags = (inputValue) => {
    const parts = inputValue
      .split(/[,.\n]/)
      .map((part) => part.trim())
      .filter((part) => part && !tags.includes(part));

    if (parts.length > 0) {
      setTags([...tags, ...parts]);
      setInput("");
    }
  };

  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setGenerateHashTag(
      generateHashTag.map((title) => ({
        ...title,
        selected: newSelection,
      }))
    );
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
      toast.success(socialMediaUrls[socialNetwork]);
    } else {
      window.open(socialMediaUrls[socialNetwork], "_blank");
    }
  };

  const toggleTitleSelect = (index) => {
    const newTitles = [...generateHashTag];
    newTitles[index].selected = !newTitles[index].selected;
    setGenerateHashTag(newTitles);
    setSelectAll(newTitles.every((title) => title.selected));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(t('Copied: "{{text}}"', { text })),
      (err) => toast.error(t("Failed to copy text"))
    );
  };

  const copySelectedTitles = () => {
    const selectedTitlesText = generateHashTag
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, ""))
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  const downloadSelectedTitles = () => {
    const selectedTitlesText = generateHashTag
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, ""))
      .join("\n");
    const element = document.createElement("a");
    const file = new Blob([selectedTitlesText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "selected_hashtags.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
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
    

  const generateHashTags = async () => {
    if (!captchaVerified && !isLocalHost) {
      toast.error(t("Please complete the CAPTCHA verification."));
      return;
    }

    if (!tags.length || !selectedLanguage || !selectedTone) {
      toast.error(t("All fields are required."));
      return;
    }

       // Check lifetime generation limit for free users
        if (isFreePlan && generateCount >= 5) {
          toast.error(t("Free users are limited to 5 hashtag generations in their lifetime. Upgrade to premium for unlimited access."));
          return;
        }

    setIsLoading(true);

    try {
      const response = await fetch("/api/openaiKey");
      if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.status}`);
      }

      const keysData = await response.json();
      const activeKeys = keysData.filter((key) => key.active);

      if (activeKeys.length === 0) {
        toast.error("No active API keys available.");
        return;
      }

      for (const keyData of activeKeys) {
        try {
          const { token, serviceType } = keyData;
          let url = "";
          let headers = {};
          let body = {};

          if (serviceType === "openai") {
            url = "https://api.openai.com/v1/chat/completions";
            headers = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            };
            body = JSON.stringify({
              model: "gpt-3.5-turbo-16k",
              messages: [
                {
                  role: "system",
                  content: `Generate a list of at least 10 SEO-friendly hashtags for keywords: "${tags.join(
                    ", "
                  )}" in ${selectedTone} tone and ${selectedLanguage} language.`,
                },
                { role: "user", content: tags.join(", ") },
              ],
              temperature: 0.7,
              max_tokens: 3500,
            });
          } else if (serviceType === "azure") {
            url =
              "https://nazmul.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview";
            headers = {
              "Content-Type": "application/json",
              "api-key": token,
            };
            body = {
              messages: [
                {
                  role: "system",
                  content: `Generate a list of at least 10 SEO-friendly hashtags for keywords: "${tags.join(
                    ", "
                  )}" in ${selectedLanguage} language.`,
                },
                { role: "user", content: tags.join(", ") },
              ],
              temperature: 1,
              max_tokens: 4096,
              top_p: 1,
              frequency_penalty: 0.5,
              presence_penalty: 0.5,
            };
          }

          const result = await axios.post(url, body, { headers });

          const data = result.data;

          if (data && data.choices && data.choices.length > 0) {
            const titles = data.choices[0].message.content
              .trim()
              .split("\n")
              .map((title) => ({ text: title, selected: false }));
            setGenerateHashTag(titles);
            break;
          } else if (data && data.error) {
            console.error("Azure API Error:", data.error);
            toast.error(`Azure API Error: ${data.error.message}`);
            break;
          } else {
            console.error("No hashtags found in the response:", data);
            toast.error(t("failedToGenerateHashtags"));
          }
        } catch (error) {
          console.error("Error with key:", keyData.token, error.message);
          toast.error(`Error with key: ${error.message}`);
        }
      }

        // Increment generate count for free users
         if (isFreePlan) {
           const newCount = generateCount + 1;
           setGenerateCount(newCount);
           localStorage.setItem("generateCount", newCount);
           console.log(`Free user generation: ${newCount}/5`);
         }
       } catch (error) {
         console.error("Error generating titles:", error);
         toast.error(`Error: ${error.message}`);
       } finally {
         setIsLoading(false);
       }
     };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment || !newReview.title) {
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
          tool: "YouTube-Hashtag-Generator",
          ...newReview,
          userProfile: user?.profileImage || FALLBACK_IMAGE,
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t("Review submitted successfully!"));
      setNewReview({ rating: 0, comment: "", title: "" });
      setShowReviewForm(false);
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
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length || 0
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
          category: "YouTube-Hashtag-Generator",
          userId: user.email,
          action,
          reportText: action === "report" ? reportText : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update reaction");
      }

      const updatedData = await response.json();
      setLikes(updatedData.reactions.likes || 0);
      setUnlikes(updatedData.reactions.unlikes || 0);

      if (action === "like") {
        if (hasLiked) {
          toast.error("You have already liked this.");
        } else {
          setHasLiked(true);
          setHasUnliked(false);
          toast.success("You liked this content.");
        }
      } else if (action === "unlike") {
        if (hasUnliked) {
          setHasUnliked(false);
          toast.success("You removed your dislike.");
        } else {
          setHasLiked(false);
          setHasUnliked(true);
          toast.success("You disliked this content.");
        }
      } else if (action === "report") {
        if (hasReported) {
          toast.error("You have already reported this.");
        } else {
          setHasReported(true);
          toast.success("You have reported this content.");
        }
      }
    } catch (error) {
      console.error("Failed to update reaction:", error);
      toast.error(error.message);
    }
  };

  const saveChannel = () => {
    const savedChannels = JSON.parse(
      localStorage.getItem("savedChannels") || "[]"
    );
    const currentTool = {
      toolName: "YouTube Hashtag Generator",
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
                .replace("YouTube-Hashtag-Generator", "youtube-hashtag-generator")}`}
            />
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Hashtag-Generator", "youtube-hashtag-generator")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta
              property="og:image"
              content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732778031402-youtubehashtaggeneratora.png"
            />
            <meta
              property="og:image:secure_url"
              content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732778031402-youtubehashtaggeneratora.png"
            />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:domain"
              content={meta?.url.replace("tools/YouTube-Hashtag-Generator", "")}
            />
            <meta
              property="twitter:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("YouTube-Hashtag-Generator", "youtube-hashtag-generator")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta
              name="twitter:image"
              content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732778031402-youtubehashtaggeneratora.png"
            />
            <meta name="twitter:site" content="@ytubetools" />
            <meta name="twitter:image:alt" content="youtube-hashtag-generator" />
            {hreflangs &&
              hreflangs.map((hreflang, index) => (
                <link
                  key={index}
                  rel={hreflang.rel}
                  hreflang={hreflang.hreflang}
                  href={`${hreflang.href
                    .toLowerCase()
                    .replace("YouTube-Hashtag-Generator", "youtube-hashtag-generator")}`}
                />
              ))}
          </Head>

          <Script id="webpage-structured-data" type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: meta?.title,
              url: `${meta?.url}${i18n.language !== "en" ? `/${i18n.language}` : ""}/tools/youtube-hashtag-generator`,
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
              url: `${meta?.url}${i18n.language !== "en" ? `/${i18n.language}` : ""}/tools/youtube-hashtag-generator`,
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

          <h1 className="text-3xl text-white">{t("YouTube Hashtag Generator")}</h1>
          <p className="text-white pb-3">
            The YouTube Hashtag Generator is a powerful tool designed to help content creators by generating trending hashtags
          </p>
          <ToastContainer />

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
              "You have {{remaining}} of 5 lifetime Hashtag generations left. Upgrade to premium for unlimited access.",
              { remaining: 5 - generateCount }
            )}
            <Link href="/pricing" className="btn btn-warning ms-3">
              {t("Upgrade")}
            </Link>
          </p>
        ) : (
          <p className="text-center p-3 alert-warning">
            {t(`Hey ${user?.username}, you have unlimited Hashtag generations as a ${user.plan}  user until your subscription expires.`)}
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
            <div className="keywords-input-container">
              <div className="tags-container flex flex-wrap gap-2 mb-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} width={80} height={30} />
                  ))
                ) : (
                  tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-200 px-2 py-1 rounded-md flex items-center"
                    >
                      {tag}
                      <span
                        className="ml-2 cursor-pointer text-red-500"
                        onClick={() =>
                          setTags(tags.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </span>
                    </span>
                  ))
                )}
              </div>
              <input
                type="text"
                placeholder="Add a keyword"
                className="w-full p-2 border-none border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                required
                style={{
                  cursor: "text",
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start justify-between space-x-4 ms-4 me-4 sm:ms-2 sm:me-2 mt-3 shadow-xl border rounded-lg pt-3 pb-3 ps-3 pe-3">
              <div className="flex flex-col sm:w-1/2 w-full">
                <label htmlFor="tone" className="text-sm text-left font-medium mb-2">
                  <FaPhoneVolume className="text-[#fa6742]" /> Tone:
                </label>
                <div className="relative">
                  <select
                    id="tone"
                    value={selectedTone}
                    onChange={handleToneChange}
                    className="block shadow-lg appearance-none w-full bg-white border border-gray-300 rounded-md py-3 pl-4 pr-10 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Select a tone
                    </option>
                    {availableTones.map((tone) => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-600">
                    <svg
                      className="fill-current h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:w-1/2 w-full">
                <label htmlFor="language" className="text-sm text-left font-medium mb-2">
                  <FaLanguage className="text-[#fa6742]" /> Language:
                </label>
                <div className="relative">
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    className="block shadow-lg appearance-none w-full bg-white border border-gray-300 rounded-md py-3 pl-4 pr-10 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Select a language
                    </option>
                    {availableLanguages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-600">
                    <svg
                      className="fill-current h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="ms-4 mt-3">
              {!isLocalHost && siteKey && (
                <ReCAPTCHA sitekey={siteKey} onChange={handleCaptchaChange} />
              )}
            </div>

            <div className="flex items-center mt-4 md:mt-0 ps-6 pe-6">
              <button
                className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-500"
                type="button"
                id="button-addon2"
                onClick={generateHashTags}
                disabled={isLoading || tags.length === 0}
              >
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
                {isLoading ? "Loading..." : "Generate Hashtags"}
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
                  <h2 className="text-2xl font-semibold mb-4">Report This Tool</h2>
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
              <span>{t("Share on social media")}</span>
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

          <div className="center">
            {generateHashTag.length > 0 && (
              <div className="rounded p-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <span>{t("Select All")}</span>
              </div>
            )}
       

          <div className="generated-titles-container grid grid-cols-1 md:grid-cols-4 gap-4">
            {generateHashTag.map((title, index) => (
              <div
                key={index}
                className="title-checkbox rounded flex items-center"
              >
                <input
                  className="me-2 rounded"
                  type="checkbox"
                  checked={title.selected}
                  onChange={() => toggleTitleSelect(index)}
                />
                {title.text.replace(/^\d+\.\s*/, "")}
                <FaCopy
                  className="copy-icon ml-2 cursor-pointer"
                  onClick={() =>
                    copyToClipboard(title.text.replace(/^\d+\.\s*/, ""))
                  }
                />
              </div>
            ))}
          </div>

          <div className="d-flex">
            {generateHashTag.some((title) => title.selected) && (
              <FaCopy
                onClick={copySelectedTitles}
                className="text-center text-red-500 cursor-pointer ms-2 fs-4"
              />
            )}
            {generateHashTag.some((title) => title.selected) && (
              <FaDownload
                onClick={downloadSelectedTitles}
                className="text-center text-red-500 cursor-pointer ms-2 fs-4"
              />
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
                      className={`accordion-content ${openIndex === index ? "open" : ""}`}
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
              <div className="text-3xl font-bold mb-2">{t("Customer Reviews")}</div>
              <div className="flex items-center mb-2">
                <div className="text-3xl font-bold mr-2">{overallRating}</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      color={i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"}
                    />
                  ))}
                </div>
                <div className="ml-2 text-sm text-gray-500">
                  {reviews?.length} {t("global ratings")}
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
                      src={review?.userProfile && review.userProfile !== "nai" ? review.userProfile : FALLBACK_IMAGE}
                      alt={review.userName || "User"}
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
                    {t("Reviewed on")} {review.createdAt}
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
                        src={
                          review?.userProfile && review.userProfile !== "nai"
                            ? review.userProfile
                            : FALLBACK_IMAGE
                        }
                        alt={review.userName || "User"}
                        className="w-12 h-12 rounded-full"
                        width={48}
                        height={48}
                      />
                      <div className="ml-4">
                        <div className="font-bold">{review?.userName}</div>
                        <div className="text-gray-500 text-sm">{t("Verified Purchase")}</div>
                        <p className="text-muted">
                          {t("Reviewed on")} {review?.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg font-semibold">{review.title}</div>
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
              <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
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

        <div className="bg-indigo-50 p-5">
          <h2 className="text-2xl font-bold mb-5 pt-5 text-center">{t("Related Tools")}</h2>
          <ul
            role="list"
            className="mx-auto gap-3 grid max-w-7xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
          >
            {relatedTools.map((tool, index) => (
              <li
                key={index}
                className="cursor-pointer bg-white rounded-xl list-none p-4 shadow transition duration-200 ease-in-out hover:scale-[101%] hover:bg-gray-50 hover:shadow-lg hover:ring-1 hover:ring-indigo-500"
              >
                <Link href={tool.link} className="flex items-center transition">
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

        <style jsx>{`
          .title-checkbox {
            padding: 10px;
            border: 1px solid #e0e0e0;
            background-color: #f9f9f9;
          }
          .copy-icon {
            color: #fa6742;
          }
        `}</style>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps("YouTube-Hashtag-Generator", context.locale, context.req);
}

export default YouTubeHashtagGenerator;