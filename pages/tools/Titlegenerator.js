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
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StarRating from "./StarRating";
import { format } from "date-fns";
import { useRouter } from "next/router";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { i18n, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const TitleGenerator = ({ meta, faqs, relatedTools }) => {
  const { t } = useTranslation('titlegenerator');
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [content, setContent] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    title: "", // Add title field
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=youtube-title-and-description-generator?tab=title&language=${i18n?.language}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || "");
        setExistingContent(data[0]?.content || "");
      } catch (error) {
        toast.error(t('failedToFetchContent'));
      }
    };

    fetchContent();
    fetchReviews();
  }, [i18n?.language, t]);

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
        toast.success(t('copied', { text }));
      },
      (err) => {
        toast.error(t('failedToCopy'));
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
      toast.error(t('loginPrompt'));
      return;
    }

    if (
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount <= 0
    ) {
      toast.error(t('upgradePrompt'));
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

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=titlegenerator");
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"), // Format the date here
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
      toast.error(t('allFieldsRequired'));
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "titlegenerator",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t('reviewSubmittedSuccessfully'));
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        title: "", // Reset title field
        userProfile: "",
      });
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      toast.error(t('failedToSubmitReview'));
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

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <div className="bg-box">
        <div>
          <Image className="shape1" src={announce} alt="announce" />
          <Image className="shape2" src={cloud} alt="cloud" />
          <Image className="shape3" src={cloud2} alt="cloud" />
          <Image className="shape4" src={chart} alt="chart" />
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <Head>
            <title>{meta?.title}</title>
            <meta name="description" content={meta?.description} />
            <meta property="og:url" content={meta?.url} />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content={meta?.image} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="twitter:domain" content={meta?.url} />
            <meta property="twitter:url" content={meta?.url} />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content={meta?.image} />
            {/* - Webpage Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: meta?.title,
                url: meta?.url,
                description: meta?.description,
                breadcrumb: {
                  "@id": "https://youtube-tool-frontend.vercel.app/#breadcrumb",
                },
                about: {
                  "@type": "Thing",
                  name: meta?.title,
                },
                isPartOf: {
                  "@type": "WebSite",
                  url: "https://youtube-tool-frontend.vercel.app",
                },
              })}
            </script>
            {/* - Review Schema */}
            <script type="application/ld+json">
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
            </script>
            {/* - FAQ Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs?.map((faq) => ({
                  "@type": "Question",
                  name: faq?.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq?.answer,
                  },
                })),
              })}
            </script>
          </Head>

          <h2 className="text-3xl text-white">{t('YouTube Title Generator')}</h2>

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
                        {t('upgradePrompt')}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t('notUpgradedPrompt', { remaining: 5 - generateCount })}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t('Upgrade')}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t('loginPrompt')}
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
          <div className="keywords-input-container">
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span className="tag" key={index}>
                  {tag}
                  <span
                    className="remove-btn"
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder={t('addKeyword')}
              className="input-box"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              required
            />
          </div>
          <div className="center">
            <div className="flex flex-wrap gap-2 justify-center pt-5">
              <button
                className="btn btn-danger whitespace-nowrap"
                onClick={generateTitles}
                disabled={isLoading || tags.length === 0}
                style={{ minWidth: "50px" }}
              >
                {isLoading ? t('generating') : t('Generate Titles')}
              </button>
              <button
                className="btn btn-danger whitespace-nowrap"
                onClick={handleShareClick}
                style={{ minWidth: "50px" }}
              >
                <FaShareAlt />
              </button>
              {showShareIcons && (
                <div className="flex gap-2">
                  <FaFacebook
                    className="facebook-icon"
                    onClick={() => shareOnSocialMedia("facebook")}
                  />
                  <FaInstagram
                    className="instagram-icon"
                    onClick={() => shareOnSocialMedia("instagram")}
                  />
                  <FaTwitter
                    className="twitter-icon"
                    onClick={() => shareOnSocialMedia("twitter")}
                  />
                  <FaLinkedin
                    className="linkedin-icon"
                    onClick={() => shareOnSocialMedia("linkedin")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="generated-titles-container">
        {generatedTitles.length > 0 && (
          <div className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            <span>{t('selectAll')}</span>
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
            {t('copyAllTags')} <FaCopy />
          </button>
        )}
        {generatedTitles.some((title) => title.selected) && (
          <button
            className="btn btn-primary ms-2"
            onClick={downloadSelectedTitles}
          >
            {t('downloadTags')} <FaDownload />
          </button>
        )}
      </div>
      <div className="content pt-6 pb-5">
        <div
          dangerouslySetInnerHTML={{ __html: existingContent }}
          style={{ listStyleType: "none" }}
        ></div>
      </div>

      <div className="p-5 shadow">
        <div className="accordion">
          <h2 className="faq-title">{t('frequentlyAskedQuestions')}</h2>
          <p className="faq-subtitle">
            {t('answeredAllFAQs')}
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
      </div>
      <hr className="mt-4 mb-2" />
     
      <div className="row pt-3">
        <div className="col-md-4">
          <div className=" text-3xl font-bold mb-2">{t('customerReviews')}</div>
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
              {reviews.length} {t('globalRatings')}
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
            <h4>{t('reviewThisTool')}</h4>
            <p>{t('shareYourThoughts')}</p>
            <button
              className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 mb-4"
              onClick={openReviewForm}
            >
              {t('writeReview')}
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
                  <div className="text-gray-500 text-sm">{t('verifiedPurchase')}</div>
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
                {t('reviewedOn')} {review.createdAt}
              </div>
              <div className="text-lg mb-4">{review.comment}</div>
            </div>
          ))}
          {!showAllReviews && reviews.length > 5 && (
            <button
              className="btn btn-primary mt-4 mb-5"
              onClick={handleShowMoreReviews}
            >
              {t('seeMoreReviews')}
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
                      {t('verifiedPurchase')}
                    </div>
                    <p className="text-muted">
                      {t('reviewedOn')} {review?.createdAt}
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

      {modalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full">
            <h2 className="text-2xl font-semibold mb-4">{t('leaveReview')}</h2>
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
                placeholder={t('reviewTitle')}
                value={newReview.title}
                onChange={(e) =>
                  setNewReview({ ...newReview, title: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <textarea
                className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder={t('yourReview')}
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
              {t('submitReview')}
            </button>
            <button
              className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
              onClick={closeModal}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      {/* Related Tools Section */}
      <div className="related-tools-section mt-10">
        <h2 className="text-2xl font-semibold mb-4">{t('Related Tools')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedTools?.map((tool, index) => (
            <Link key={index} href={tool.link}>
              <div className="related-tool-item bg-white p-4 rounded shadow hover:shadow-md transition">
                <div className="flex items-center mb-2">
                  <tool.icon className="text-xl mr-2" />
                  <h3 className="text-lg font-bold">{tool.name}</h3>
                </div>
                <p>{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {/* End of Related Tools Section */}
      <style jsx>{`
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

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=youtube-title-and-description-generator?tab=title&lang=${locale}`;
  const relatedToolsUrl = `${protocol}://${host}/api/content?category=relatedTools&language=${locale}`;

  try {
    const [contentResponse, relatedToolsResponse] = await Promise.all([
      fetch(apiUrl),
      fetch(relatedToolsUrl)
    ]);

    if (!contentResponse.ok || !relatedToolsResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const [contentData, relatedToolsData] = await Promise.all([
      contentResponse.json(),
      relatedToolsResponse.json()
    ]);

    const meta = {
      title: contentData[0]?.title || "",
      description: contentData[0]?.description || "",
      image: contentData[0]?.image || "",
      url: `${protocol}://${host}/tools/youtube-title-and-description-generator?tab=title`,
    };

    return {
      props: {
        meta,
        faqs: contentData[0]?.faqs || [],
        relatedTools: relatedToolsData || [],
        ...(await serverSideTranslations(locale, ['common', 'titlegenerator', 'navbar'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        relatedTools: [],
        ...(await serverSideTranslations(locale, ['common', 'titlegenerator', 'navbar'])),
      },
    };
  }
}

export default TitleGenerator;
