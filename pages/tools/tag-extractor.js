// pages/tools/tag-extractor.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import { getContentProps } from "../../utils/getContentProps";
import {
  FaShareAlt,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaCopy,
  FaDownload,
  FaStar,
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
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });


const TagExtractor = ({ meta, reviews,content,relatedTools,faqs }) => {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const { t } = useTranslation("common");
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
  const [error, setError] = useState("");
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
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(`/api/content?category=tagExtractor&language=${language}`);
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
        setContent(data.translations[language]?.content || '')
        setFaqs(contentData.translations[language]?.faqs || [])
        setRelatedTools(contentData.translations[language]?.relatedTools || [])
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

  const shareOnSocialMedia = (socialNetwork) => {
    const url = encodeURIComponent(window.location.href);
    const socialMediaUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      instagram: "Instagram sharing is only available via the mobile app.",
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
  if (loading) {
    return <div>Loading...</div>;
  }
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
          <title>{meta?.title}</title>
          <meta name="description" content={meta?.description} />
          <meta property="og:url" content={meta?.url} />
          <meta property="og:title" content={meta?.title} />
          <meta property="og:description" content={meta?.description} />
          <meta property="og:image" content={meta?.image || ""} />
          <meta name="twitter:card" content={meta?.image || ""} />
          <meta property="twitter:domain" content={meta?.url} />
          <meta property="twitter:url" content={meta?.url} />
          <meta name="twitter:title" content={meta?.title} />
          <meta name="twitter:description" content={meta?.description} />
          <meta name="twitter:image" content={meta?.image || ""} />
          {/* - Webpage Schema */}
          <Script type="application/ld+json">
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
          <Script type="application/ld+json">
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
          <Script type="application/ld+json">
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
          {Object.keys(faqs).map((lang) => (
            <link
              key={lang}
              rel="alternate"
              href={`${meta?.url}?locale=${lang}`}
              hrefLang={lang} // Corrected property name
            />
          ))}
        </Head>
        {loading && <div className="loading">Loading...</div>}
        <div className="max-w-7xl mx-auto p-4">
          <h2 className="text-3xl text-white">{t("YouTube Tag Extractor")}</h2>
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

          <div className="flex justify-center pt-5">
            <div className="w-full max-w-md px-4 md:px-6 lg:px-8">
              <div className="mb-3">
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder={t("enterYoutubeUrl")}
                  aria-label="YouTube Video URL"
                  aria-describedby="button-addon2"
                  value={videoUrl}
                  onChange={handleUrlChange}
                />
              </div>
              <button
                className="w-full p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
                type="button"
                id="button-addon2"
                onClick={fetchTags}
                disabled={loading || fetchLimitExceeded}
              >
                {loading ? t("loading") : t("Generate Unlimited Tags")}
              </button>
              <small className="block mt-2 text-gray-300">
                Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s
              </small>
              {error && (
                <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2">
            <FaShareAlt className="text-red-500 text-xl" />
            <span> {t("shareOnSocialMedia")}</span>
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
          {generatedTitles.map((title, index) => (
            <div
              key={index}
              className="flex items-center p-2 border rounded-md"
            >
              <input
                className="mr-2"
                type="checkbox"
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
            </div>
          ))}
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

        <div className="content pt-5 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            className="list-none"
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
          {/* Review Summary Section */}
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

          {/* Review List Section */}
          <div className="p-4 bg-white shadow-md rounded-md col-span-1 md:col-span-1">
            {reviews?.slice(0, 5).map((review, index) => (
              <div
                key={index}
                className="border p-4 mb-4 bg-gray-50 rounded-md shadow-sm"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={`data:image/jpeg;base64,${review?.userProfile}`}
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
                        src={`data:image/jpeg;base64,${review?.userProfile}`}
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

        {/* Related Tools Section */}
        <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-5 text-center">
            {t("relatedTools")}
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
        {/* End of Related Tools Section */}
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  return getContentProps("tagExtractor", context.locale, context.req);
}


export default TagExtractor;
