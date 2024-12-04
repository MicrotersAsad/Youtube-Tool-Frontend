import React, { useState, useEffect, useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
  FaCopy,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import dynamic from "next/dynamic";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Script from "next/script";
import 'flag-icons/css/flag-icons.min.css';
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import { getContentProps } from "../../utils/getContentProps";
import { useAuth } from "../../contexts/AuthContext";


const availableLanguages = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'zh-HANT', name: '中国传统的', flag: 'cn' },
  { code: 'zh-HANS', name: '简体中文', flag: 'cn' },
  { code: 'nl', name: 'Nederlands', flag: 'nl' },
  { code: 'gu', name: 'ગુજરાતી', flag: 'in' },
  { code: 'hi', name: 'हिंदी', flag: 'in' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'ja', name: '日本語', flag: 'jp' },
  { code: 'ko', name: '한국어', flag: 'kr' },
  { code: 'pl', name: 'Polski', flag: 'pl' },
  { code: 'pt', name: 'Português', flag: 'pt' },
  { code: 'ru', name: 'Русский', flag: 'ru' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
];
const availableTones = [
    { value: 'formal', label: 'Formal' },
    { value: 'informal', label: 'Informal' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'professional', label: 'Professional' },
  ];
  

const TagGenerator = ({ meta: initialMeta, reviews, content, relatedTools, faqs, reactions, hreflangs }) => {
    const [meta, setMeta] = useState(initialMeta);  // Now `meta` is a state
    const [isLoading, setIsLoading] = useState(false);
    const { isLoggedIn, user, updateUserProfile } = useAuth();
    const router = useRouter();
    const { t, i18n } = useTranslation("common"); // i18n here
    const [tags, setTags] = useState([]);
    const [input, setInput] = useState("");
    const [generatedTitles, setGeneratedTitles] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [generateCount, setGenerateCount] = useState(0);
    const [isUpdated, setIsUpdated] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [existingContent, setExistingContent] = useState(content);
    const [captchaVerified, setCaptchaVerified] = useState(false); // State for reCAPTCHA
    const [hasLiked, setHasLiked] = useState(false);
    const [hasUnliked, setHasUnliked] = useState(false);
    const [hasReported, setHasReported] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportText, setReportText] = useState("");
    const [selectedLanguage ,setSelectedLanguage ]=useState()
    const [selectedTone, setSelectedTone] = useState('');
    const [siteKey, setSiteKey] = useState();
    const [isSaved, setIsSaved] = useState(false);
    const [likes, setLikes] = useState(reactions.likes || 0);
    const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
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

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
// Check if running on localhost
const isLocalHost = typeof window !== "undefined" && 
(window.location.hostname === "localhost" || 
 window.location.hostname === "127.0.0.1" || 
 window.location.hostname === "::1");

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    // Perform additional actions based on language change if needed
  };
console.log(initialMeta);

  const handleToneChange = (event) => {
    // টোন নির্বাচন করা হলে selectedTone আপডেট হবে
    setSelectedTone(event.target.value);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(`/api/content?category=YouTube-Channel-Logo-Downloader&language=${language}`);
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
        setLikes(data.reactions.likes || 0);
        setUnlikes(data.reactions.unlikes || 0);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchData();
   
  }, [i18n.language]);
  
  const closeModal = () => setModalVisible(false);
  useEffect(() => {
    // ডেটা লোড হয়ে গেলে isLoading স্টেট false করে দেয়
    setIsLoading(false);
  }, []);

//   useEffect(() => {
//     if (!headerContent) return;

//     // HTML হিসেবে ডিকোড করার জন্য একটি ডিভ তৈরি করা হচ্ছে
//     const tempDiv = document.createElement("div");
//     tempDiv.innerHTML = headerContent;

//     // `<head>` এ মেটা ট্যাগ যুক্ত করা হচ্ছে
//     const metaTags = tempDiv.querySelectorAll("meta");
//     metaTags.forEach((meta) => {
//       if (
//         !document.head.querySelector(
//           `meta[content="${meta.getAttribute("content")}"]`
//         )
//       ) {
//         document.head.appendChild(meta.cloneNode(true));
//       }
//     });
//   }, [headerContent]);
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
        setIsLoading(false); // Data has been loaded
      }
    };

    fetchConfigs();
  }, []);
 
  
  // Refactored code
  useEffect(() => {
    if (user) {
      const fetchAndUpdateProfile = async () => {
        if (!user.name || (user.paymentStatus !== "success" && !isUpdated)) {
          await updateUserProfile();
          setIsUpdated(true);
        }

        // Set generate count from localStorage or default to 5 if not success or admin
        if (user.paymentStatus !== "success" && user.role !== "admin") {
          const storedCount = localStorage.getItem("generateCount");
          setGenerateCount(storedCount ? parseInt(storedCount) : 5);
        } else {
          localStorage.removeItem("generateCount");
        }
      };

      fetchAndUpdateProfile();
    }
  }, [user, updateUserProfile, isUpdated]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const processTags = (inputValue) => {
    const parts = inputValue
      .split(/[,.\n]/) // Comma, Dot, বা Newline দিয়ে ট্যাগ আলাদা করুন
      .map((part) => part.trim()) // প্রতিটি অংশ ট্রিম করুন
      .filter((part) => part && !tags.includes(part)); // ফাঁকা বা ডুপ্লিকেট ট্যাগ বাদ দিন
  
    if (parts.length > 0) {
      setTags([...tags, ...parts]); // নতুন ট্যাগ অ্যাড করুন
      setInput(""); // ইনপুট ক্লিয়ার করুন
    }
  };
  
  
  

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === ".") {
      // Enter, Comma বা Dot প্রেস করলে ট্যাগ প্রসেস হবে
      event.preventDefault();
      processTags(input.trim());
    } 
  };
  
  
  const handleBlur = () => {
    // If the input loses focus, we also process the tag (in case the user leaves the field)
    processTags(input.trim());
  };
  

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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied", { text }));
    } catch (error) {
      toast.error(t("failedToCopy"));
    }
  };

  // Helper function to get selected titles text
  const getSelectedTitlesText = () => {
    return generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, "")) // Remove leading numbers and dots
      .join("\n");
  };

  const copySelectedTitles = () => {
    const selectedTitlesText = getSelectedTitlesText();
    copyToClipboard(selectedTitlesText);
  };

  const downloadSelectedTitles = () => {
    const selectedTitlesText = getSelectedTitlesText();
    const element = document.createElement("a");
    const file = new Blob([selectedTitlesText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "selected_titles.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateTitles = async () => {
    if (!user) {
      toast.error(t("loginToGenerateTags"));
      return;
    }
  
    if (
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount <= 0
    ) {
      toast.error(t("upgradeForUnlimited"));
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Fetch active API keys from the server
      const response = await fetch("/api/openaiKey");
      if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.status}`);
      }
  
      const keysData = await response.json();
      const activeKeys = keysData.filter((key) => key.active);  // Filter out inactive keys
  
      if (activeKeys.length === 0) {
        toast.error("No active API keys available.");
        return;
      }
  
      // Try each active API key
      for (const keyData of activeKeys) {
        try {
          const { token, serviceType } = keyData;  // Extract token and serviceType
  
          // Determine the correct API URL and headers based on serviceType
          let url = '';
          let headers = {};
          let body = {};
  
          if (serviceType === "openai") {
            // For OpenAI API
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
                  content: `Generate a list of at least 10 SEO-friendly Tag for keywords: "${tags.join(", ")}" in this languge ${selectedLanguage}.`,
                },
                { role: "user", content: tags.join(", ") },
              ],
              temperature: 0.7,
              max_tokens: 3500,
            });
          } else if (serviceType === "azure") {
            // For Azure OpenAI API
            url = "https://nazmul.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview";
            headers = {
              "Content-Type": "application/json",
              "api-key": token, // Azure API key
            };
            body = {
              messages: [
                {
                  role: "system",
                  content: `Generate a list of at least 10 SEO-friendly Tag for keywords: "${tags.join(", ")}" in this languge ${selectedLanguage}.`,
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
  
          // Make the API request based on the selected service type
          const result = await axios.post(url, body, {
            headers: headers,
          });
  
          const data = result.data;
          
          // Debugging log to check the response structure
          console.log("Azure API Response Data:", data);
  
          // Check if data has choices or a similar property based on the API type
          if (data && data.choices && data.choices.length > 0) {
            const titles = data.choices[0].message.content
              .trim()
              .split("\n")
              .map((title) => ({ text: title, selected: false }));
            setGeneratedTitles(titles);
            break; // Stop after the first successful response
          } else if (data && data.error) {
            console.error("Azure API Error:", data.error);
            toast.error(`Azure API Error: ${data.error.message}`);
            break; // Break the loop if there's an error response
          } else {
            console.error("No titles found in the response:", data);
            toast.error("Failed to generate titles.");
          }
        } catch (error) {
          console.error("Error with key:", keyData.token, error.message);
          toast.error(`Error with key: ${error.message}`);
        }
      }
  
      // Update generate count if the user doesn't have unlimited access
      if (user.paymentStatus !== "success") {
        const newCount = generateCount - 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount);
      }
    } catch (error) {
      console.error("Error generating titles:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  useEffect(() => {
    fetchReviews();
  }, [reviews]); // Refetch when reviews change

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=tagGenerator");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "tagGenerator",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t("reviewSubmitted"));
      setNewReview({ name: "", rating: 0, comment: "", title: "", userProfile: "" });
      setShowReviewForm(false);
      fetchReviews(); // Refresh reviews after submission
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(t("reviewSubmitFailed"));
    }
  };

  const overallRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;
    const calculateRatingPercentage = (rating) => {
      const totalReviews = reviews.length;
      const ratingCount = reviews.filter(
        (review) => review.rating === rating
      ).length;
      return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
    };
    const openReviewForm = () => {
      if (!user) {
        router.push("/login");
        return;
      }
      setShowReviewForm(true);
    };
    console.log(reviews);

  useEffect(() => {
    if (user) {
      const userAction = reactions.users?.[user.email];
      setHasLiked(userAction === "like");
      setHasUnliked(userAction === "unlike");
      setHasReported(userAction === "report");

      // Check if the current tool URL is already saved in local storage
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
          category: "tagGenerator",
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

      // Update reaction state and display success/error messages
      const reactionUpdates = {
        like: {
          set: setHasLiked,
          reset: setHasUnliked,
          successMsg: "You liked this content.",
        },
        unlike: {
          set: setHasUnliked,
          reset: setHasLiked,
          successMsg: "You disliked this content.",
        },
        report: {
          set: setHasReported,
          successMsg: "You have reported this content.",
        },
      };

      const currentReaction = reactionUpdates[action];
      if (currentReaction) {
        const hasAction =
          action === "like"
            ? hasLiked
            : action === "unlike"
            ? hasUnliked
            : hasReported;
        if (hasAction) {
          toast.error(
            `You have already ${
              action === "like"
                ? "liked"
                : action === "unlike"
                ? "disliked"
                : "reported"
            } this.`
          );
        } else {
          currentReaction.set(true);
          currentReaction.reset && currentReaction.reset(false);
          toast.success(currentReaction.successMsg);
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
      toolName: "YouTube Tag Generator",
      toolUrl: window.location.href,
    };

    const isSavedAlready = savedChannels.some(
      (channel) => channel.toolUrl === currentTool.toolUrl
    );

    const updatedChannels = isSavedAlready
      ? savedChannels.filter(
          (channel) => channel.toolUrl !== currentTool.toolUrl
        )
      : [...savedChannels, currentTool];

    localStorage.setItem("savedChannels", JSON.stringify(updatedChannels));
    setIsSaved(!isSavedAlready);
    toast.success(
      isSavedAlready
        ? "Tool removed from saved list."
        : "Tool saved successfully!"
    );
  };
  const isGenerateButtonActive = () => {
    return captchaVerified && selectedLanguage && tags.length > 0;
  };

  // Button color logic
  const buttonColors = {
    like: hasLiked ? "#4CAF50" : "#ccc",
    unlike: hasUnliked ? "#F44336" : "#ccc",
    report: hasReported ? "#FFD700" : "#ccc",
    save: isSaved ? "#FFD700" : "#ccc",
  };
 
  return (
    <>
      <div className="bg-box">
        <div>
          <Image className="shape1" src={announce} alt="announce" priority />
          <Image className="shape2" src={cloud} alt="cloud" priority />
          <Image className="shape3" src={cloud2} alt="cloud2" priority />
          <Image className="shape4" src={chart} alt="chart" priority />
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
          <link rel="canonical" href={meta?.url} />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={meta?.url} />
          <meta property="og:title" content={meta?.title} />
          <meta property="og:description" content={meta?.description} />
          <meta property="og:image" content={meta?.image|| "NA"} />
          <meta property="og:image:secure_url" content={meta?.image} />
          <meta property="og:site_name" content="Ytubetools" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:domain" content={meta?.url} />
          <meta property="twitter:url" content={meta?.url} />
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
                href={hreflang.href}
              />
            ))}
          <link
            rel="alternate"
            hreflang="en"
            href={meta?.url?.replace(/\/$/, "").replace(/\/$/, "")}
          />
        </Head>

        {/* - Webpage Schema */}
        <Script id="webpage-structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: meta?.title,
            url: meta?.url,
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
        <Script
        id="review-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "YouTube Tag Generator | Get ⚠️ FREE YouTube Tag and Keywords Ideas",
            "url": "https://ytubetools.com",
            "applicationCategory": "Multimedia",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "${overallRating}",
              "ratingCount": "${reviews?.length}",
              "reviewCount": "${reviews?.length}"
            },
            "review": ${JSON.stringify(
              reviews?.map((review) => ({
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": review.userName,
                },
                "datePublished": review.createdAt,
                "reviewBody": review.comment,
                "name": review.title,
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": review.rating,
                },
              }))
            )}
          }
        `}
      </Script>

        



        {/* - FAQ Schema */}
        <Script id="faq-structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs?.map((faq) => ({
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
          <h1 className="text-3xl text-white">
            {isLoading ? <Skeleton width={250} /> : t("YouTube Tag Generator")}
          </h1>

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
                  ></svg>
                  <div className="mt-4">
                    {!user ? (
                      <p className="text-center p-3 alert-warning">
                        {t("You need to be logged in to generate tags.")}
                      </p>
                    ) : user.paymentStatus === "success" ||
                      user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        {t("You can generate unlimited tags.")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You have not upgraded. You can generate")}{" "}
                        {5 - generateCount} {t("more times.")}{" "}
                        <Link className="btn btn-warning ms-3" href="/pricing">
                          {t("Upgrade")}
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
      {/* Keywords Input Section */}
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

        {isLoading ? (
          <Skeleton height={40} width="100%" />
        ) : (
          <input
          type="text"
          placeholder="Add a keyword"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur} // If the input loses focus, process the tag
          required
          style={{
            cursor: "text", // Keeps text input cursor while typing
          }}
        />
        )}
      </div>
     <div>
     
     </div>
     <div className="flex items-start justify-between space-x-4 ms-4 me-5 sm:ms-2 sm:me-2 mt-3 shadow-xl border rounde pt-3 pb-3 ps-5 pe-5">



  {/* Language Section */}
  <div className="flex flex-col w-1/2">
    <label htmlFor="language" className="text-sm font-medium mb-2">
      Language:
    </label>
    <div className="relative">
      <select
        id="language"
        value={selectedLanguage}
        onChange={handleLanguageChange}
        className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-3 pl-4 pr-10 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {availableLanguages.map((language) => (
          <option
            key={language.code}
            value={language.code}
            className="flex items-center"
          >
            <span className={`fi fi-${language.flag} mr-2`}></span>
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

  {/* Tone Section */}
  <div className="flex flex-col w-1/2">
    <label htmlFor="tone" className="text-sm font-medium mb-2">
      Tone:
    </label>
    <div className="relative">
      <select
        id="tone"
        value={selectedTone}
        onChange={handleToneChange}
        className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-3 pl-4 pr-10 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
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
</div>
<div className="ms-3 mt-3">
  {/* reCAPTCHA Section */}
{!isLocalHost && siteKey && (
  <ReCAPTCHA
    sitekey={siteKey} // সঠিকভাবে `sitekey` পাঠানো
    onChange={handleCaptchaChange}
  />
)}
</div>

      {/* Buttons Section */}
      <div className="flex items-center mt-4 ps-6 pe-6">
        {/* Generate Titles Button */}
        <button
  className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-400"
  type="button"
  id="button-addon2"
  onClick={generateTitles}
  disabled={!isGenerateButtonActive()}
>
  {isLoading ? (
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


      Generate Tag
    </>
  )}
</button>
        </div>
      </div>
    

            {/* Reaction Bar */}
            <div className="w-full flex items-center justify-between mt-4 p-3 bg-gray-100 rounded-md">
              <div className="flex items-center space-x-4">
                {isLoading ? (
                  <>
                    <Skeleton width={60} height={30} />
                    <Skeleton width={60} height={30} />
                    <Skeleton width={60} height={30} />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReaction("like")}
                      className="flex items-center space-x-1"
                      style={{ color: buttonColors.like }}
                    >
                      <FaThumbsUp className="text-xl text-green-600" />
                      <span className="text-black">{likes}</span>
                    </button>
                    <button
                      onClick={() => handleReaction("unlike")}
                      className="flex items-center space-x-1"
                      style={{ color: buttonColors.unlike }}
                    >
                      <FaThumbsDown className="text-xl text-red-400" />
                      <span className="text-black">{unlikes}</span>
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center space-x-1"
                      style={{ color: buttonColors.report }}
                    >
                      <FaFlag className="text-xl text-red-500" />
                      <span className="text-black">{t("Report")}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Show Report Modal */}
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
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Generated Titles Section */}
        <div className="generated-titles-container">
          {generatedTitles.length > 0 && (
            <div className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <span>{t("Select All")}</span>
            </div>
          )}
          {generatedTitles.map((title, index) => (
            <div key={index} className="title-checkbox">
              <input
                className="me-2"
                type="checkbox"
                checked={title.selected}
                onChange={() => toggleTitleSelect(index)}
              />
              {title.text}
              <FaCopy
                className="copy-icon"
                onClick={() => copyToClipboard(title.text)}
              />
            </div>
          ))}
          {generatedTitles.some((title) => title.selected) && (
            <button className="btn btn-primary" onClick={copySelectedTitles}>
              {t("Copy All Titles")} <FaCopy />
            </button>
          )}
          {generatedTitles.some((title) => title.selected) && (
            <button
              className="btn btn-primary ms-2"
              onClick={downloadSelectedTitles}
            >
              {t("Download Titles")} <FaDownload />
            </button>
          )}
        </div>


        {/* Content Section */}
        <div className="content pt-6 pb-5">
          {isLoading ? (
            <Skeleton count={5} />
          ) : (
            <article
              dangerouslySetInnerHTML={{ __html: existingContent }}
              style={{ listStyleType: "none" }}
            ></article>
          )}
        </div>

        {/* FAQ Section */}
        <div className="accordion">
          <h2 className="faq-title">
            {isLoading ? (
              <Skeleton width={200} />
            ) : (
              t("Frequently Asked Questions")
            )}
          </h2>
          <p className="faq-subtitle">
            {isLoading ? (
              <Skeleton width={300} />
            ) : (
              t("Here are some of the most frequently asked questions")
            )}
          </p>
          <div className="faq-grid">
            {isLoading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} height={30} className="rounded-md mb-2" />
                  ))
              : faqs?.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <a
                      href={`#accordion-${index}`}
                      id={`open-accordion-${index}`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Review Summary Section */}
          <div className="p-4 bg-white shadow-md rounded-md">
            <div className="text-xl font-bold mb-2">
              {isLoading ? <Skeleton width={150} /> : t("Customer Reviews")}
            </div>
            <div className="flex items-center mb-2">
              <div className="text-xl font-bold mr-2">
                {isLoading ? <Skeleton width={30} /> : overallRating || "0"}
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    color={
                      isLoading
                        ? "#e4e5e9"
                        : i < Math.round(overallRating)
                        ? "#ffc107"
                        : "#e4e5e9"
                    }
                    size={18}
                  />
                ))}
              </div>
              <div className="ml-2 text-sm text-gray-500">
                {isLoading ? (
                  <Skeleton width={50} />
                ) : (
                  `${reviews.length} ${t("global ratings")}`
                )}
              </div>
            </div>
            <div>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center mb-2">
                  <div className="w-16 text-right mr-2">{rating}-star</div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full relative">
                    <div
                      className="h-3 bg-yellow-500 rounded-full absolute top-0 left-0"
                      style={{
                        width: isLoading
                          ? "100%"
                          : `${calculateRatingPercentage(rating)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-16 text-left ml-2">
                    {isLoading ? (
                      <Skeleton width={20} />
                    ) : (
                      `${calculateRatingPercentage(rating).toFixed(1)}%`
                    )}
                  </div>
                </div>
              ))}
            </div>
            <hr className="my-4" />
            <div>
              <h4 className="text-lg font-semibold">{t("Review this tool")}</h4>
              <p className="text-sm text-gray-600">
                {t("Share your thoughts with other customers")}
              </p>
              <button
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 w-full"
                onClick={openReviewForm}
              >
                {t("Write a review")}
              </button>
            </div>
          </div>

          {/* Review List Section */}
          <div className="p-4 bg-white shadow-md rounded-md">
            {isLoading
              ? Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton
                      key={i}
                      height={120}
                      className="rounded-md mb-4"
                    />
                  ))
              : reviews
                  .slice(0, showAllReviews ? reviews.length : 5)
                  .map((review, index) => (
                    <div
                      key={index}
                      className="border p-4 mb-4 bg-gray-50 rounded-md shadow-sm"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {isLoading ? (
                            <Skeleton circle={true} width={40} height={40} />
                          ) : (
                            <Image
                              src={review.userProfile}
                              alt={review.name}
                              width={40}
                              height={40}
                              layout="intrinsic"
                              priority
                            />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-sm">
                            {isLoading ? (
                              <Skeleton width={80} />
                            ) : (
                              review.userName
                            )}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {isLoading ? (
                              <Skeleton width={60} />
                            ) : (
                              t("Verified Purchase")
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            size={18}
                            color={
                              isLoading
                                ? "#e4e5e9"
                                : i < review.rating
                                ? "#ffc107"
                                : "#e4e5e9"
                            }
                          />
                        ))}
                      </div>
                      <div className="text-sm mb-2">
                        {isLoading ? <Skeleton width="80%" /> : review.comment}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {isLoading ? (
                          <Skeleton width={100} />
                        ) : (
                          `${t("Reviewed on")} ${review.createdAt}`
                        )}
                      </div>
                    </div>
                  ))}
            {reviews.length > 5 && !showAllReviews && (
              <button
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 w-full"
                onClick={() => setShowAllReviews(true)}
              >
                {t("See more reviews")}
              </button>
            )}
          </div>
        </div>
        {modalVisible && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={closeModal}
            ></div>
            <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
              <h2 className="text-2xl font-semibold mb-4">
                {t("Write a Review")}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">
                  {t("Review Title")}
                </label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview({ ...newReview, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">
                  {t("Your Review")}
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">
                  {t("Rating")}
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      size={24}
                      color={newReview.rating >= star ? "#ffc107" : "#e4e5e9"}
                      onClick={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                      className="cursor-pointer"
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-4">
                <button
                  className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
                  onClick={closeModal}
                >
                  {t("Cancel")}
                </button>
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
                  onClick={handleReviewSubmit}
                >
                  {t("Submit Review")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Related Tools Section */}
        <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-5 text-center">
            {isLoading ? <Skeleton width={200} /> : t("Related Tools")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton
                      key={i}
                      width="100%"
                      height={60}
                      className="rounded-lg"
                    />
                  ))
              : relatedTools.map((tool, index) => (
                  <a
                    key={index}
                    href={tool.link}
                    className="flex items-center border rounded-lg p-4 bg-gray-100 transition"
                  >
                    <Image
                      src={tool.logo.src}
                      alt={`${tool.name} Icon`}
                      width={64}
                      height={64}
                      className="mr-4"
                    />
                    <span className="text-blue-600 font-medium">
                      {tool.name}
                    </span>
                  </a>
                ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
    return getContentProps('tagGenerator', context.locale, context.req);
  }
  


  export default TagGenerator;

