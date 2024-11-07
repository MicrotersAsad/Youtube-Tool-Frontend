import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { FaShareAlt, FaThumbsUp, FaThumbsDown, FaFlag, FaBookmark, FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaCopy, FaDownload, FaStar } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import dynamic from "next/dynamic";
import announce from "../public/shape/announce.png";
import chart from "../public/shape/chart (1).png";
import cloud from "../public/shape/cloud.png";
import cloud2 from "../public/shape/cloud2.png";
import Script from "next/script";

const StarRating = dynamic(() => import("./tools/StarRating"), { ssr: false });

export default function Home({ initialMeta, reactions, content, faqList, tools }) {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation("common"); // i18n এখানে পেয়েছেন
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [meta, setMeta] = useState(initialMeta);
  const [existingContent, setExistingContent] = useState(content);
  const [translations, setTranslations] = useState([]);
  const [relatedTools, setRelatedTools] = useState(tools);
  const [faqs, setFaqs] = useState(faqList);
  const [likes, setLikes] = useState(reactions.likes || 0);
  const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
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

  const closeModal = () => setModalVisible(false);
  useEffect(() => {
    // ডেটা লোড হয়ে গেলে isLoading স্টেট false করে দেয়
    setIsLoading(false);
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
    .split(/[,\.]/)
    .map((part) => part.trim())
    .filter((part) => part);
  if (parts.length > 1) {
    setTags([...tags, ...parts]);
    setInput("");
  }
};

const handleKeyDown = (event) => {
  if (["Enter", ",", "."].includes(event.key)) {
    event.preventDefault();
    processTags(input.trim());
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
    instagram: "Instagram sharing is only available via the mobile app.",
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  };

  if (socialNetwork === "instagram") {
    toast.info("Instagram sharing is available only via the mobile app.");
  } else {
    window.open(socialMediaUrls[socialNetwork], "_blank");
  }
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
    const response = await fetch("/api/openaiKey");
    if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);

    const keysData = await response.json();
    const apiKeys = keysData.map((key) => key.token);

    for (const key of apiKeys) {
      try {
        const result = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: t("generateTagsPrompt", { tags: tags.join(", ") }),
              },
              { role: "user", content: tags.join(", ") },
            ],
            temperature: 0.7,
            max_tokens: 3500,
          }),
        });

        const data = await result.json();
        if (data.choices) {
          const titles = data.choices[0].message.content
            .trim()
            .split("\n")
            .map((title) => ({ text: title, selected: false }));
          setGeneratedTitles(titles);
          break;
        }
      } catch (error) {
        console.error("Error with key:", key, error.message);
      }
    }

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

  fetchReviews(); // Call once on mount
}, []);

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
        tool: "tagGenerator",
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
    refreshReviews(); // Update the review list
  } catch (error) {
    console.error("Failed to submit review:", error);
    toast.error(t("reviewSubmitFailed"));
  }
};

// Helper function to refresh reviews
const refreshReviews = () => {
  fetchReviews();
};

const calculateRatingPercentage = (rating) => {
  const totalReviews = reviews.length;
  if (totalReviews === 0) return 0;
  const ratingCount = reviews.filter((review) => review.rating === rating).length;
  return (ratingCount / totalReviews) * 100;
};

// Calculate overall rating with safety check for division by zero
const overallRating = reviews.length > 0
  ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
  : "0";

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

// useEffect for setting initial user actions and checking saved channels
useEffect(() => {
  if (user) {
    const userAction = reactions.users?.[user.email];
    setHasLiked(userAction === "like");
    setHasUnliked(userAction === "unlike");
    setHasReported(userAction === "report");

    // Check if the current tool URL is already saved in local storage
    const savedChannels = JSON.parse(localStorage.getItem("savedChannels") || "[]");
    const isChannelSaved = savedChannels.some((channel) => channel.toolUrl === window.location.href);
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
      like: { set: setHasLiked, reset: setHasUnliked, successMsg: "You liked this content." },
      unlike: { set: setHasUnliked, reset: setHasLiked, successMsg: "You disliked this content." },
      report: { set: setHasReported, successMsg: "You have reported this content." }
    };

    const currentReaction = reactionUpdates[action];
    if (currentReaction) {
      const hasAction = action === "like" ? hasLiked : action === "unlike" ? hasUnliked : hasReported;
      if (hasAction) {
        toast.error(`You have already ${action === "like" ? "liked" : action === "unlike" ? "disliked" : "reported"} this.`);
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
  const savedChannels = JSON.parse(localStorage.getItem("savedChannels") || "[]");
  const currentTool = { toolName: "YouTube Tag Generator", toolUrl: window.location.href };

  const isSavedAlready = savedChannels.some(channel => channel.toolUrl === currentTool.toolUrl);

  const updatedChannels = isSavedAlready
    ? savedChannels.filter(channel => channel.toolUrl !== currentTool.toolUrl)
    : [...savedChannels, currentTool];

  localStorage.setItem("savedChannels", JSON.stringify(updatedChannels));
  setIsSaved(!isSavedAlready);
  toast.success(isSavedAlready ? "Tool removed from saved list." : "Tool saved successfully!");
};

// Button color logic
const buttonColors = {
  like: hasLiked ? "#4CAF50" : "#ccc",
  unlike: hasUnliked ? "#F44336" : "#ccc",
  report: hasReported ? "#FFD700" : "#ccc",
  save: isSaved ? "#FFD700" : "#ccc"
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
         
          <title>{meta?.title}</title>
          <meta name="description" content={meta?.description} />
          <meta
            property="og:url"
            content={`${meta?.url}/${
              i18n.language !== "en" ? i18n.language : ""
            }`}
          />
          <meta property="og:title" content={meta?.title} />
          <meta property="og:description" content={meta?.description} />
          <meta property="og:image" content={meta?.image || ""} />
          <meta name="twitter:card" content={meta?.image || ""} />
          <meta
            property="twitter:domain"
            content={`${meta?.url}/${
              i18n.language !== "en" ? i18n.language : ""
            }`}
          />
          <meta
            property="twitter:url"
            ccontent={`${meta?.url}/${
              i18n.language !== "en" ? i18n.language : ""
            }`}
          />
          <meta name="twitter:title" content={meta?.title} />
          <meta name="twitter:description" content={meta?.description} />
          <meta name="twitter:image" content={meta?.image || ""} />
          <link rel="alternate" hreflang="x-default" href={meta?.url} />
          <link rel="alternate" hreflang="en" href={meta?.url} />
          {translations &&
            Object.keys(translations).map(
              (lang) =>
                lang !== "en" && (
                  <link
                    key={lang}
                    rel="alternate"
                    hrefLang={lang}
                    href={`${meta?.url}/${lang}`}
                  />
                )
            )}
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

        {/* - Review Schema */}
        <Script id="review-structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: meta?.title,
            url: meta?.url,
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
  <h2 className="text-3xl text-white">
    {isLoading ? <Skeleton width={250} /> : t("YouTube Tag Generator")}
  </h2>

  <ToastContainer />

  {modalVisible && (
    <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
          <div className="mt-4">
            {!user ? (
              <p className="text-center p-3 alert-warning">{t("You need to be logged in to generate tags.")}</p>
            ) : user.paymentStatus === "success" || user.role === "admin" ? (
              <p className="text-center p-3 alert-warning">{t("You can generate unlimited tags.")}</p>
            ) : (
              <p className="text-center p-3 alert-warning">
                {t("You have not upgraded. You can generate")} {5 - generateCount} {t("more times.")}{" "}
                <Link className="btn btn-warning ms-3" href="/pricing">{t("Upgrade")}</Link>
              </p>
            )}
          </div>
        </div>
        <button className="text-yellow-700" onClick={closeModal}>×</button>
      </div>
    </div>
  )}

  <div className="border max-w-4xl mx-auto rounded-xl shadow bg-white">
    <div className="keywords-input-container">
      <div className="tags-container flex flex-wrap gap-2 mb-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} width={80} height={30} />)
        ) : (
          tags.map((tag, index) => (
            <span key={index} className="bg-gray-200 px-2 py-1 rounded-md flex items-center">
              {tag}
              <span className="ml-2 cursor-pointer" onClick={() => setTags(tags.filter((_, i) => i !== index))}>×</span>
            </span>
          ))
        )}
      </div>
      {isLoading ? (
        <Skeleton height={40} width="100%" />
      ) : (
        <input
          type="text"
          placeholder={t("Add a keyword")}
          className="w-full p-2"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          required
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
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="white">
            <path d="..."></path>
          </svg>
        </span>
        {isLoading ? t("Generating...") : t("Generate Tag")}
      </button>
      <div className="ms-auto">
        {isLoading ? (
          <Skeleton width={30} height={30} circle />
        ) : (
          <button className="flex items-center justify-center" onClick={saveChannel} style={{ color: buttonColors.save }}>
            <FaBookmark className={`text-lg ${isSaved ? "text-purple-600" : "text-red-500"}`} />
          </button>
        )}
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
            <button onClick={() => handleReaction("like")} className="flex items-center space-x-1" style={{ color: buttonColors.like }}>
              <FaThumbsUp className="text-xl text-green-600" />
              <span className="text-black">{likes}</span>
            </button>
            <button onClick={() => handleReaction("unlike")} className="flex items-center space-x-1" style={{ color: buttonColors.unlike }}>
              <FaThumbsDown className="text-xl text-red-400" />
              <span className="text-black">{unlikes}</span>
            </button>
            <button onClick={() => setShowReportModal(true)} className="flex items-center space-x-1" style={{ color: buttonColors.report }}>
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
          <h2 className="text-2xl font-semibold mb-4">{t("Report This Tool")}</h2>
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

  <div className="generated-titles-container grid grid-cols-1 md:grid-cols-4 gap-4">
    {isLoading ? (
      Array(8)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} width="100%" height={40} className="rounded-md" />
        ))
    ) : (
      generatedTitles.map((title, index) => (
        <div key={index} className="flex items-center p-2 border rounded-md">
          <input
            className="mr-2"
            type="checkbox"
            checked={title.selected}
            onChange={() => toggleTitleSelect(index)}
          />
          {title.text.replace(/^\d+\.\s*/, "")}
          <FaCopy
            className="ml-2 cursor-pointer"
            onClick={() => copyToClipboard(title.text.replace(/^\d+\.\s*/, ""))}
          />
        </div>
      ))
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
      {isLoading ? <Skeleton width={200} /> : t("Frequently Asked Questions")}
    </h2>
    <p className="faq-subtitle">
      {isLoading ? <Skeleton width={300} /> : t("Here are some of the most frequently asked questions")}
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
              <a href={`#accordion-${index}`} id={`open-accordion-${index}`} className="accordion-header" onClick={() => toggleFAQ(index)}>
                {faq.question}
              </a>
              <div className={`accordion-content ${openIndex === index ? "open" : ""}`}>
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
            color={isLoading ? "#e4e5e9" : i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"}
            size={18}
          />
        ))}
      </div>
      <div className="ml-2 text-sm text-gray-500">
        {isLoading ? <Skeleton width={50} /> : `${reviews.length} ${t("global ratings")}`}
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
                width: isLoading ? "100%" : `${calculateRatingPercentage(rating)}%`,
              }}
            ></div>
          </div>
          <div className="w-16 text-left ml-2">
            {isLoading ? <Skeleton width={20} /> : `${calculateRatingPercentage(rating).toFixed(1)}%`}
          </div>
        </div>
      ))}
    </div>
    <hr className="my-4" />
    <div>
      <h4 className="text-lg font-semibold">{t("Review this tool")}</h4>
      <p className="text-sm text-gray-600">{t("Share your thoughts with other customers")}</p>
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 w-full"
        onClick={openReviewForm}
      >
        {t("Write a review")}
      </button>
    </div>
  </div>

  {/* Review List Section */}
  <div className="p-4 bg-white shadow-md rounded-md col-span-1 md:col-span-1">
    {isLoading
      ? Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} height={120} className="rounded-md mb-4" />
          ))
      : reviews?.slice(0, 5).map((review, index) => (
          <div key={index} className="border p-4 mb-4 bg-gray-50 rounded-md shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {isLoading ? (
                  <Skeleton circle={true} width={40} height={40} />
                ) : (
                  <Image src={review?.userProfile} alt={review.name} width={40} height={40} layout="intrinsic" priority />
                )}
              </div>
              <div className="ml-3">
                <div className="font-semibold text-sm">
                  {isLoading ? <Skeleton width={80} /> : review?.userName}
                </div>
                <div className="text-gray-500 text-xs">
                  {isLoading ? <Skeleton width={60} /> : t("Verified Purchase")}
                </div>
              </div>
            </div>
            <div className="flex items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  size={18}
                  color={isLoading ? "#e4e5e9" : i < review.rating ? "#ffc107" : "#e4e5e9"}
                />
              ))}
            </div>
            <div className="text-sm mb-2">
              {isLoading ? <Skeleton width="80%" /> : review.comment}
            </div>
            <div className="text-gray-500 text-xs">
              {isLoading ? <Skeleton width={100} /> : `${t("Reviewed on")} ${review.createdAt}`}
            </div>
          </div>
        ))}
    {!showAllReviews && reviews.length > 5 && (
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 w-full"
        onClick={handleShowMoreReviews}
      >
        {t("See more reviews")}
      </button>
    )}
    {showAllReviews &&
      reviews?.slice(5).map((review, index) => (
        <div key={index} className="border p-4 mb-4 bg-gray-50 rounded-md shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {isLoading ? (
                <Skeleton circle={true} width={40} height={40} />
              ) : (
                <Image src={review?.userProfile} alt={review.name} width={40} height={40} layout="intrinsic" priority />
              )}
            </div>
            <div className="ml-3">
              <div className="font-semibold text-sm">
                {isLoading ? <Skeleton width={80} /> : review?.userName}
              </div>
              <div className="text-gray-500 text-xs">
                {isLoading ? <Skeleton width={60} /> : t("Verified Purchase")}
              </div>
              <p className="text-gray-400 text-xs">
                {isLoading ? <Skeleton width={80} /> : `${t("Reviewed on")} ${review.createdAt}`}
              </p>
            </div>
          </div>
          <div className="text-sm font-semibold mb-2">
            {isLoading ? <Skeleton width="50%" /> : review.title}
          </div>
          <div className="text-sm mb-2">
            {isLoading ? <Skeleton width="80%" /> : review.comment}
          </div>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} size={18} color={isLoading ? "#e4e5e9" : i < review.rating ? "#ffc107" : "#e4e5e9"} />
            ))}
          </div>
        </div>
      ))}
  </div>
</div>

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
              <Skeleton key={i} width="100%" height={60} className="rounded-lg" />
            ))
        : relatedTools?.map((tool, index) => (
            <a key={index} href={tool.link} className="flex items-center border rounded-lg p-4 bg-gray-100 transition">
              <Image src={tool?.logo?.src} alt={`${tool.name} Icon`} width={64} height={64} className="mr-4" />
              <span className="text-blue-600 font-medium">{tool.name}</span>
            </a>
          ))}
    </div>
  </div>
</div>

    </>
  );
}
// export async function getServerSideProps({ req, locale }) {
  // const protocol = req.headers["x-forwarded-proto"] || "http";
  // const host = req.headers.host;
  // const apiUrl = `${protocol}://${host}/api/content?category=tagGenerator&language=${locale}`;

//   try {
//     const contentResponse = await fetch(apiUrl);
//     const contentData = await contentResponse.json();

//     const localeData = contentData.translations?.[locale] || {};
    
    
//     const meta = {
//       title: localeData.title || "Default Title",
//       description: localeData.description || "Default description",
//       url: `${protocol}://${host}`,
//     };

//     return {
//       props: {
//         initialMeta: meta,
//         reactions: localeData.reactions || { likes: 0, unlikes: 0, reports: [], users: {} },
//         content: localeData.content || "",
//         faqList: localeData.faqs || [],
//         tools: localeData.relatedTools || [],
//         ...(await serverSideTranslations(locale, ["common", "navbar", "footer"])),
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return {
//       props: {
//         initialMeta: {},
//         reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
//         content: "",
//         faqList: [],
//         tools: [],
//         ...(await serverSideTranslations(locale, ["common", "navbar", "footer"])),
//       },
//     };
//   }
// }




export async function getStaticProps({ locale }) {
  // Set base URL based on the environment
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://ytubetools.com";

  const apiUrl = `${baseUrl}/api/content?category=tagGenerator&language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);
    const contentData = await contentResponse.json();

    const localeData = contentData.translations?.[locale] || {};

    const meta = {
      title: localeData.title || "Default Title",
      description: localeData.description || "Default description",
      url: `${baseUrl}`,
    };

    return {
      props: {
        initialMeta: meta,
        reactions: localeData.reactions || {
          likes: 0,
          unlikes: 0,
          reports: [],
          users: {},
        },
        content: localeData.content || "",
        faqList: localeData.faqs || [],
        tools: localeData.relatedTools || [],
        ...(await serverSideTranslations(locale, ["common", "navbar", "footer"])),
      },
      revalidate: 60, // Revalidate every 60 seconds for ISR
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        initialMeta: {},
        reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
        content: "",
        faqList: [],
        tools: [],
        ...(await serverSideTranslations(locale, ["common", "navbar", "footer"])),
      },
      revalidate: 60, // Revalidate even if there's an error
    };
  }
}

