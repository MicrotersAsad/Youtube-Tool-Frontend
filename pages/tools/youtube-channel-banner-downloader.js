import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaTwitter,
  FaStar,
} from "react-icons/fa";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import Head from "next/head";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { format } from "date-fns";
import { i18n, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Script from "next/script";

// Dynamic import for StarRating component
const StarRating = dynamic(() => import("./StarRating"), {
  ssr: false,
});

const YtChannelDw = ({ meta, faqs, existingContent }) => {
  const { t } = useTranslation('banner');
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
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
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const closeModal = () => setModalVisible(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setGenerateCount(Number(localStorage.getItem("generateCount")) || 0);
    }
    
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/content?category=YouTube-Channel-Banner-Downloader&language=${language}`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setRelatedTools(data.translations[language]?.relatedTools || []);
        setTranslations(data.translations);
      } catch (error) {
        console.error("Error fetching content");
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
      setGenerateCount(5);
    }
  }, [user]);

  const handleUrlChange = (e) => {
    setChannelUrl(e.target.value);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const fetchYouTubeData = async () => {
    if (!user) {
      toast.error("Please log in to fetch YouTube data.");
      setModalVisible(true);
      return;
    }

    if (!channelUrl.trim()) {
      toast.error("Please enter a valid URL.");
      return;
    }

    if (
      generateCount >= 3 &&
      user?.paymentStatus !== "success" &&
      user.role !== "admin"
    ) {
      toast.error("Fetch limit exceeded. Please upgrade for unlimited access.");
      return;
    }

    try {
      if (
        user &&
        user.paymentStatus !== "success" &&
        user.role !== "admin" &&
        generateCount <= 0
      ) {
        toast.error(
          "You have reached the limit of generating banners. Please upgrade your plan for unlimited use."
        );
        return;
      }

      setLoading(true);
      setError("");
      const channelId = extractChannelId(channelUrl);
      if (!channelId) {
        throw new Error(
          "Invalid YouTube channel URL. Please enter a valid URL."
        );
      }

      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error("Failed to fetch API tokens");

      const tokens = await tokensResponse.json();
      let dataFetched = false;

      for (const { token } of tokens) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=${channelId}&key=${token}`
          );

          const brandingSettings = response.data?.items[0]?.brandingSettings;
          if (!brandingSettings) {
            throw new Error("Brand settings not found for this channel.");
          }
          const image = brandingSettings.image;
          if (!image) {
            throw new Error("Image settings not found for this channel.");
          }
          const bannerUrl = image.bannerExternalUrl;
          if (!bannerUrl) {
            throw new Error("Banner image URL not found for this channel.");
          }
          setBannerUrl(bannerUrl);
          dataFetched = true;
          break;
        } catch (error) {
          console.error(`Error fetching data with token ${token}:`, error);
        }
      }

      if (!dataFetched) {
        throw new Error("All API tokens exhausted or failed to fetch data.");
      }

      const newGenerateCount = generateCount + 1;
      setGenerateCount(newGenerateCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("generateCount", newGenerateCount);
      }
    } catch (error) {
      setError(
        error.message ||
          "Failed to fetch YouTube data. Please check the channel URL."
      );
      setBannerUrl("");
    } finally {
      setLoading(false);
    }
  };

  const extractChannelId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/){1,2}|(?:youtube\.com\/)?(?:channel|c)\/)([^/?]+)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const downloadChannelBanner = () => {
    if (!bannerUrl) return;

    const fileName = "YouTube_Channel_Banner.jpg";

    // Fetch the image data
    fetch(bannerUrl)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a temporary URL for the image blob
        const url = window.URL.createObjectURL(new Blob([blob]));

        // Create a temporary anchor element to trigger the download
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
      })
      .catch((error) => {
        toast.error("Error downloading image:", error);
      });
  };

  // Function to share on social media
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

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        "/api/reviews?tool=YouTube-Channel-Banner-Downloader"
      );
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
          tool: "YouTube-Channel-Banner-Downloader",
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
        userProfile: "",
        userName: "",
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
  const closeReviewForm = () => {
    setShowReviewForm(false);
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
          {translations && Object.keys(translations).map(lang => (
    <link
      key={lang}
      rel="alternate"
      href={`${meta?.url}?locale=${lang}`}
      hrefLang={lang} // Corrected property name
    />
  ))}
        </Head>

          <h2 className="text-3xl pt-5 text-white">
            {t('YouTube Channel Banner Download')}
          </h2>
          <ToastContainer />
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
                        {t('Congratulations! Now you can download unlimited Banner.')}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t('You are not upgraded. You can generate banner {{remainingGenerations}} more times.', { remainingGenerations: 5 - generateCount })}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t('Upgrade')}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t('Please log in to fetch channel data.')}
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
                  placeholder={t("Enter YouTube Channel URL...")}
                  aria-label="YouTube Channel URL"
                  value={channelUrl}
                  onChange={handleUrlChange}
                />
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={fetchYouTubeData}
                  disabled={loading}
                >
                  {loading ? "Loading..." : t("Fetch Banner")}
                </button>
              </div>
              <small className="text-white">
                Example:
                https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw
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
        <div className="text-center">
          <div className="flex gap-2">
            <FaShareAlt className="text-danger fs-3" />
            <span>{t('Share On Social Media')}</span>
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
        {bannerUrl && (
          <div className="text-center mt-3">
            <Image
              src={bannerUrl}
              alt="Channel Banner"
              width={1200}
              height={300}
            />
            <button
              className="btn btn-danger mt-3"
              onClick={downloadChannelBanner}
            >
              <FaDownload />
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
            <h2 className="faq-title">{t('Frequently Asked Questions')}</h2>
            <p className="faq-subtitle">
              {t('Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us')}
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
            <div className=" text-3xl font-bold mb-2">{t('Customer reviews')}</div>
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
                {reviews.length} {t('global ratings')}
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
              <h4>{t('Review This Tool')}</h4>
              <p>{t('Share Your Thoughts With Other Customers')}</p>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
                onClick={openReviewForm}
              >
                {t('Write a customer review')}
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
                      {t('Verified Purchase')}
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
                  {t('Reviewed On')} {review.createdAt}
                </div>
                <div className="text-lg mb-4">{review.comment}</div>
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="btn btn-primary mt-4 mb-5"
                onClick={handleShowMoreReviews}
              >
                {t('See More Reviews')}
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
                        {t('Verified Purchase')}
                      </div>
                      <p className="text-muted">
                        {t('Reviewed On')} {review?.createdAt}
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
              <h2 className="text-2xl font-semibold mb-4">{t('Leave a Review')}</h2>
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
                  placeholder={t('Title')}
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview({ ...newReview, title: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <textarea
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder={t('Your Review')}
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })}
                />
              </div>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                onClick={handleReviewSubmit}
              >
                {t('Submit Review')}
              </button>
              <button
                className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
                onClick={closeReviewForm}
              >
                {t('Cancel')}
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
        <style>{`
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
        `}</style>
      </div>
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : "http";
  const apiUrl = `${protocol}://${host}/api/content?category=YouTube-Channel-Banner-Downloader&language=${locale}`;


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
      url: `${protocol}://${host}/tools/youtube-channel-banner-downloader`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
        existingContent: contentData.translations[locale]?.content || "",
        ...(await serverSideTranslations(locale, ['common','banner','navbar','footer'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        existingContent: "",
        ...(await serverSideTranslations(locale, ['common', 'banner','navbar','footer'])),
      },
    };
  }
}

export default YtChannelDw;
