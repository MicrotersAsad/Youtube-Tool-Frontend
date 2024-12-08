import React, { useState, useEffect } from "react";
import {
  FaShareAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
  FaBookmark,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaCopy,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { getContentProps } from "../../utils/getContentProps";
import Head from "next/head";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { i18n, useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import Script from "next/script";
import StarRating from "./StarRating";

const YTTitleGenerator = ({
  meta,
  faqs,
  reviews = [], // Default to an empty array here
  relatedTools,
  content,
  hreflangs,
  reactions: initialReactions = { likes: 0, unlikes: 0, users: {} },
}) => {

  
  const { t } = useTranslation("titlegenerator");
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    title: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [likes, setLikes] = useState(initialReactions?.likes || 0);
  const [unlikes, setUnlikes] = useState(initialReactions?.unlikes || 0);
  const [siteKey, setSiteKey] = useState();
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    // Ensure initialReactions has a default value
    if (initialReactions) {
      setLikes(initialReactions.likes || 0);
      setUnlikes(initialReactions.unlikes || 0);
    }
  }, [initialReactions]);
  const closeModal = () => {
    setModalVisible(false);
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

  // Check if running on localhost
const isLocalHost = typeof window !== "undefined" && 
(window.location.hostname === "localhost" || 
 window.location.hostname === "127.0.0.1" || 
 window.location.hostname === "::1");
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
  
        // Retrieve authentication token (modify this based on your auth setup)
        const token ="AZ-fc905a5a5ae08609ba38b046ecc8ef00"
  
        if (!token) {
          throw new Error("Authentication token not found");
        }
  
        const response = await fetch(
          `/api/content?category=Titlegenerator&language=${language}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
              "Content-Type": "application/json",
            },
          }
        );
  
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
  
        // Safely access data.reactions
        const likes = data.reactions?.likes || 0; // Default to 0 if undefined
        const unlikes = data.reactions?.unlikes || 0;
  
        setLikes(likes);
        setUnlikes(unlikes);
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error("Failed to fetch content");
      }
    };
  
    fetchContent();
  }, [i18n.language]);
  ;
  
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

  useEffect(() => {
    // Initialize reactions state with server-side data on initial render
    if (user) {
      const userAction = initialReactions.users?.[user.email];
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
  }, [user, initialReactions.users]);

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

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === ".") {
      event.preventDefault();
      const newTag = input.trim();
      if (newTag) {
        const newTags = [
          ...tags,
          ...newTag
            .split(/[,\.]/)
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        ];
        setTags(newTags);
        setInput("");
      }
    }
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

  const toggleTitleSelect = (index) => {
    const newTitles = [...generatedTitles];
    newTitles[index].selected = !newTitles[index].selected;
    setGeneratedTitles(newTitles);
    setSelectAll(newTitles.every((title) => title.selected));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(t("copied", { text }));
      },
      (err) => {
        toast.error(t("failedToCopy"));
      }
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

  const generateTitles = async () => {
    if (!user) {
      toast.error(t("Please sign in to use this tool."));
      return;
    }

    if (
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount <= 0
    ) {
      toast.error(
        t(
          "You are not upgraded. You can generate titles {{remaining}} more times. Upgrade",
          {
            remaining: generateCount,
          }
        )
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/openaiKey");
      if (!response.ok)
        throw new Error(`Failed to fetch API keys: ${response.status}`);

      const keysData = await response.json();
      const apiKeys = keysData.map((key) => key.token);
      let titles = [];
      let success = false;

      for (const key of apiKeys) {
        try {
          const result = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`,
              },
              body: JSON.stringify({
                model: "gpt-3.5-turbo-16k",
                messages: [
                  {
                    role: "system",
                    content: `Generate a list of at least 20 SEO-friendly Title for keywords: "${tags.join(
                      ", "
                    )}".`,
                  },
                  { role: "user", content: tags.join(", ") },
                ],
                temperature: 0.7,
                max_tokens: 3500,
              }),
            }
          );

          const data = await result.json();
          if (data.choices) {
            titles = data.choices[0].message.content
              .trim()
              .split("\n")
              .map((title) => ({ text: title, selected: false }));
            success = true;
            break;
          }
        } catch (error) {
          console.error("Error with key:", key, error.message);
        }
      }

      if (!success) throw new Error("All API keys exhausted or error occurred");

      setGeneratedTitles(titles);
      if (user.paymentStatus !== "success") {
        const newCount = generateCount - 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

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
          tool: "Titlegenerator",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t("Review submitted successfully."));
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        title: "",
        userProfile: "",
      });
      setShowReviewForm(false);
      fetchReviews("Titlegenerator");
    } catch (error) {
      toast.error(t("Failed to submit review."));
    }
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter(
      (review) => review.rating === rating
    ).length;
    return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
  };

  // Calculate the overall rating based on reviews
  const overallRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1)
    : 0;

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

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
          category: "Titlegenerator",
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
      console.log(updatedData);

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
      toolName: "Youtube Title Generator", // Name of the current tool
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

  // Button color logic
  const likeButtonColor = hasLiked ? "#4CAF50" : "#ccc"; // Green if liked
  const unlikeButtonColor = hasUnliked ? "#F44336" : "#ccc"; // Red if disliked
  const reportButtonColor = hasReported ? "#FFD700" : "#ccc"; // Yellow if reported
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
                .replace("titlegenerator", "title-generator")}`}
            />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("titlegenerator", "title-generator")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732697885773-youtubetitlegeneratora.png" />
            <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732697885773-youtubetitlegeneratora.png" />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:domain"
              content={meta?.url
                .toLowerCase()
                .replace("tools/titlegenerator", "")}
            />
            <meta
              property="twitter:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("titlegenerator", "title-generator")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1732697885773-youtubetitlegeneratora.png" />
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
                    .toLowerCase()
                    .replace("titlegenerator", "title-generator")}`}
                />
              ))}
          </Head>

          {/* JSON-LD Structured Data */}
          <Script id="webpage-title-generator" type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: meta?.title,
              url: `${meta?.url}${
                i18n.language !== "en" ? `/${i18n.language}` : ""
              }/tools/title-generator`,
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
            id="software-application-title-generator"
            type="application/ld+json"
          >
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: meta?.title,
              url: `${meta?.url}${
                i18n.language !== "en" ? `/${i18n.language}` : ""
              }/tools/title-generator`,
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

          <Script id="faq-title-generator" type="application/ld+json">
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

          <h1 className="text-3xl text-white">{"YouTube Title Generator"}</h1>
          <p className="text-white">Easily create catchy, SEO-friendly titles that boost your video’s visibility and attract more viewers.</p>

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
                        {t(
                          "Congratulations! Now you can generate unlimited titles."
                        )}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t(
                          "You are not upgraded. You can generate titles {{remaining}} more times. Upgrade",
                          { remaining: 5 - generateCount }
                        )}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t("Upgrade")}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t("Please sign in to use this tool.")}
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
          <ToastContainer />
          <div className="border max-w-4xl mx-auto rounded-xl shadow bg-white">
            <div className="keywords-input-container">
              <div className="tags-container flex flex-wrap gap-2 mb-4">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-200 px-2 py-1 rounded-md flex items-center"
                  >
                    {tag}
                    <span
                      className="ml-2 cursor-pointer"
                      onClick={() =>
                        setTags(tags.filter((_, i) => i !== index))
                      }
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder={t("addKeyword")}
                className="w-full p-2"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                required
              />
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
            <div className="flex items-center mt-4 md:mt-0 ps-6 pe-6">
              <button
                className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-500"
                type="button"
                id="button-addon2"
                onClick={generateTitles}
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
                {isLoading ? "Loading..." : "Generate Tag"}
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

        <div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>

        <div className="accordion shadow p-5">
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

        <div className="row pt-3">
          <div className="col-md-4">
            <div className=" text-3xl font-bold mb-2">
              {t("Customer Reviews")}
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
                      style={{
                        width: `${calculateRatingPercentage(rating)}%`,
                      }}
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
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 mb-4"
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
            <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md mx-auto">
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
                onClick={() => setShowReviewForm(false)}
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Related Tools Section */}
        <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-5 text-center">
            {t("Related Tools")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools.map((tool, index) => (
              <Link
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
              </Link>
            ))}
          </div>
        </div>
        {/* End of Related Tools Section */}
      </div>
      <style>{`
       
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          margin-top: 18px;

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

   

        .generated-tags-display {
          background-color: #f2f2f2;
          border-radius: 8px;
          padding: 10px;
          margin-top: 20px;
        }

        .fixed {
          position: fixed;
          z-index: 50;
        }

        .inset-0 {
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .z-50 {
          z-index: 50;
        }

        .bg-black {
          background-color: black;
        }

        .opacity-50 {
          opacity: 0.5;
        }

        .btn-secondary {
          background-color: gray;
        }
      `}</style>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps("Titlegenerator", context.locale, context.req);
}
export default YTTitleGenerator;
