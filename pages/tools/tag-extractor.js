import React, { useState, useEffect } from "react";
import {
  FaCopy,
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaStar,
  FaTimes,
  FaTwitter,
} from "react-icons/fa";
import { FaGrip } from "react-icons/fa6";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import StarRating from "./StarRating";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { format } from "date-fns";
import { i18n, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const TagExtractor = ({ meta, faqs }) => {
  const { t } = useTranslation('tagextractor');
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [relatedTools, setRelatedTools] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const closeModal = () => setModalVisible(false);
  const closeReview = () => setShowReviewForm(false);
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(`/api/content?category=tagExtractor&language=${language}`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data.translations[language]?.content || "");
        setExistingContent(data.translations[language]?.content || "");
        setRelatedTools(data.translations[language]?.relatedTools || []);
        setTranslations(data.translations);
        
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
    fetchReviews();
  }, [i18n.language]);
  
  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && user.role !== "admin") {
      const storedCount = localStorage.getItem("generateCount");
      if (storedCount) {
        setGenerateCount(parseInt(storedCount));
      } else {
        setGenerateCount(5);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.paymentStatus === "success" || user.role === "admin")) {
      localStorage.removeItem("generateCount");
    }
  }, [user]);

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const copyAllTagsToClipboard = () => {
    const textToCopy = tags.join(", ");
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        toast.success("Tags copied to clipboard!");
      },
      (err) => {
        toast.error("Failed to copy tags:", err);
      }
    );
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

  const copyToClipboard = (tag) => {
    navigator.clipboard.writeText(tag).then(
      () => {
        toast.success(`Copied: "${tag}"`);
      },
      (err) => {
        toast.error("Failed to copy text:", err);
      }
    );
  };

  const downloadTags = () => {
    const element = document.createElement("a");
    const file = new Blob([tags.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "YouTubeTags.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
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

  useEffect(() => {
    if (user && user.paymentStatus === "success") {
      setFetchLimitExceeded(false);
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=tagExtractor");
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
          tool: "tagExtractor",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted successfully!");
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
          <script type="application/ld+json">
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
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            })}
          </script>
          {translations && Object.keys(translations).map(lang => (
    <link
      key={lang}
      rel="alternate"
      href={`${meta?.url}?locale=${lang}`}
      hrefLang={lang} // Corrected property name
    />
  ))}
        </Head>
          <h2 className="text-3xl text-white">{t('YouTube Tag Extractor')}</h2>
          <ToastContainer />
          {modalVisible && (
            <div
              className=" bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4  shadow-md mb-6 mt-3 fixed-modal"
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
                <div className="mt-4">
                  {!user ? (
                    <p className="text-center p-3 alert-warning">
                      {t('Login To GenerateTags')}
                    </p>
                  ) : user.paymentStatus === "success" ||
                    user.role === "admin" ? (
                    <p className="text-center p-3 alert-warning">
                      {t('Generate Unlimited Tags')}
                    </p>
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t('notUpgraded')} {5 - generateCount} {t('moreTimes')}.{" "}
                      <Link href="/pricing" className="btn btn-warning ms-3">
                        {t('upgrade')}
                      </Link>
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

          <div className="row justify-content-center pt-5">
            <div className="col-md-6">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('enterYoutubeUrl')}
                  aria-label="YouTube Video URL"
                  aria-describedby="button-addon2"
                  value={videoUrl}
                  onChange={handleUrlChange}
                />
                <button
                  className="btn btn-danger"
                  type="button"
                  id="button-addon2"
                  onClick={fetchTags}
                  disabled={loading || fetchLimitExceeded}
                >
                  {loading ? t('loading') : t('Generate Unlimited Tags')}
                </button>
              </div>
              <small className="text-white">
              Example : https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s
              </small>
              <br />

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-end">
          <button className="btn btn-danger mt-3" onClick={handleShareClick}>
            <FaShareAlt />
          </button>
          {showShareIcons && (
            <div className="share-icons text-center mt-3">
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
        {tags.length > 0 && (
          <div>
            <h3>{t('tags')}:</h3>
            <div className="d-flex flex-wrap">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-light m-1 p-2 rounded-pill d-flex align-items-center extract"
                >
                  <FaGrip className="text-muted" />
                  <span
                    onClick={() => copyToClipboard(tag)}
                    style={{ cursor: "pointer" }}
                  >
                    {tag}
                  </span>
                  <FaTimes
                    className="ms-2 text-danger"
                    onClick={() => removeTag(index)}
                  />
                </div>
              ))}
            </div>
            <button className="btn btn-danger mt-3" onClick={downloadTags}>
              <FaDownload />
            </button>
            <button
              className="btn btn-danger mt-3 ms-2"
              onClick={copyAllTagsToClipboard}
            >
              <FaCopy />
            </button>
          </div>
        )}

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
            <div className=" text-3xl font-bold mb-2">{t('customerReviews')}</div>
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
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
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
                    <div className="text-gray-500 text-sm">
                      {t('verifiedPurchase')}
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

        {showReviewForm && (
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
                onClick={closeReview}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

          {/* Related Tools Section */}
          <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-5 text-center">Related Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedTools.map((tool, index) => (
          <a
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
          </a>
        ))}
      </div>
    </div>
        {/* End of Related Tools Section */}
      </div>
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : "http";
  const apiUrl = `${protocol}://${host}/api/content?category=tagExtractor&language=${locale}`;


  try {
    const [contentResponse] = await Promise.all([
      fetch(apiUrl),
 
    ]);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const [contentData] = await Promise.all([
      contentResponse.json(),
      
    ]);

    const meta = {
      title: contentData.translations[locale]?.title || "",
      description: contentData.translations[locale]?.description || "",
      image: contentData.translations[locale]?.image || "",
      url: `${protocol}://${host}/tools/tag-extractor`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
       
        ...(await serverSideTranslations(locale, ['common','tagextractor','navbar','footer'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        relatedTools: [],
        ...(await serverSideTranslations(locale, ['common', 'tagextractor','navbar','footer'])),
      },
    };
  }
}

export default TagExtractor;