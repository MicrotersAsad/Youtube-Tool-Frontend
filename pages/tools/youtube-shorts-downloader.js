import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import Link from "next/link";
import "react-toastify/dist/ReactToastify.css";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import dynamic from 'next/dynamic';
import { getContentProps } from "../../utils/getContentProps";
import Script from "next/script";
import { i18n } from "next-i18next";
import { Spinner } from "react-bootstrap";
import axios from "axios";
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });
const YtShortdw =({ meta, reviews, content, relatedTools, faqs,reactions,hreflangs})   => {
  const { t } = useTranslation('calculator');
  const { user, updateUserProfile, logout } = useAuth();
  const [likes, setLikes] = useState(reactions.likes || 0);
  const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState("video");
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 const [thumbnail, setThumbnail] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  // Fetch Available Formats (Video & Audio)
  const fetchFormats = async () => {
    setError("");
    setFormats([]);
    setDownloadUrl("");
    setVideoTitle("")
    setThumbnail("")
    if (!url) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("https://ytd.mhnazmul.com/api/getFormats", { url });
console.log(response);

      if (response.data.formats.length > 0) {
        setFormats(response.data.formats);
        setVideoTitle(response.data.videoTitle)
        setThumbnail(response.data.videoThumbnail)
      } else {
        setError("No formats available.");
      }
    } catch (err) {
      setError("Error fetching video/audio formats.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Download Selected Format
  const handleDownload = async () => {
    setError("");
    setDownloadUrl("");

    if (!selectedFormat || !selectedType) {
      setError("Please select a format first.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("https://ytd.mhnazmul.com/api/downloadMedia", {
        url,
        itag: selectedFormat,
        type: selectedType,
      });

      if (response.data.downloadUrl) {
        setDownloadUrl(`https://ytd.mhnazmul.com${response.data.downloadUrl}`);
      } else {
        setError("Failed to generate download link.");
      }
    } catch (err) {
      setError("Error downloading media.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (loading) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [loading]);


  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && user.role !== "admin") {
      setGenerateCount(5);
    }
  }, [user]);
  const closeModal = () => {
    setModalVisible(false);
  };
  const closeReviewModal = () => {
    setShowReviewForm(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(
          `/api/content?category=youtube-shorts-downloader&language=${language}`
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
          tool: "youtube-shorts-downloader",
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
      fetchReviews("youtube-shorts-downloader");
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

      // Check if data is already saved using the current URL
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
          category: "youtube-shorts-downloader",
          userId: user.email,
          action,
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
                .replace("youtube-shorts-downloader", "youtube-shorts-downloader")}`}
            />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website" />
            <meta
              property="og:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("youtube-shorts-downloader", "youtube-shorts-downloader")}`}
            />
            <meta property="og:title" content={meta?.title} />
            <meta property="og:description" content={meta?.description} />
            <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737888179645-youutbeshortdownloader.PNG" />
            <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737888179645-youutbeshortdownloader.PNG" />
            <meta property="og:site_name" content="Ytubetools" />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:domain"
              content={meta?.url
                .replace("tools/youtube-shorts-downloader", "")}
            />
            <meta
              property="twitter:url"
              content={`${meta?.url
                .toLowerCase()
                .replace("youtube-shorts-downloader", "youtube-shorts-downloader")}`}
            />
            <meta name="twitter:title" content={meta?.title} />
            <meta name="twitter:description" content={meta?.description} />
            <meta name="twitter:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737888179645-youutbeshortdownloader.PNG" />
            <meta name="twitter:site" content="@ytubetools" />
            <meta name="twitter:image:alt" content="youtube-shorts-downloader" />

            {/* Alternate hreflang Tags for SEO */}
            {hreflangs &&
              hreflangs.map((hreflang, index) => (
                <link
                  key={index}
                  rel={hreflang.rel}
                  hreflang={hreflang.hreflang}
                  href={`${hreflang.href
                    .toLowerCase()
                    .replace("youtube-shorts-downloader", "youtube-shorts-downloader")}`}
                />
              ))}
          </Head>
  {/* JSON-LD Structured Data */}
  <Script id="webpage-structured-data" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-shorts-downloader`,
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
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/youtube-shorts-downloader`,
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


        <div className="max-w-7xl mx-auto p-4">
       
        <div className="max-w-screen-lg mx-auto p-4">
        <h1 className="text-center text-white">YouTube Shorts Downloader</h1>
        <p className="text-center text-white">Download your favorite YouTube Shorts as high-quality short videos with our YouTube Shorts  Downloader. This 100% ad-free tool offers a fast, simple, and seamless way to save Shorts directly to your device.</p>
        <div className="container mt-5">
      

      {/* URL Input and Fetch Button */}
       {/* Input Section */}
       <div className="input-group mb-3" style={{ height: "50px" }}>
            <span className="input-group-text" style={{ height: "100%" }}>
              <img src="https://img.icons8.com/color/48/000000/youtube-play.png" alt="YouTube" width="30" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Enter YouTube video URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="input-group-append" style={{ height: "100%" }}>
              <button
                className="btn btn-primary"
                onClick={fetchFormats}
                style={{ height: "100%", paddingRight: "40px", paddingLeft: "40px" }}
              >
                Search
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

{/* Show loading spinner when data is being fetched */}
{loading && (
  <div className="d-flex justify-content-center my-4">
    <Spinner animation="border" variant="primary" />
  </div>
)}

      {/* Formats and Download Button */}
      {formats.length > 0 && (
         <div className="row">
                        <div className="col-md-6">
                {/* Video Thumbnail */}
                <div className="card" style={{ width: "100%" }}>
                  <img src={thumbnail} alt="Video thumbnail" className="card-img-top" />
                </div>
                {/* Video Title */}
                <h5 className="text-center mt-2" style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                  {videoTitle}
                </h5>
              </div>
              <div className="col-md-6">
        <div className="text-center">
          <h4 className="mb-3">Select Format</h4>
          <select
            className="form-select mb-3"
            value={selectedFormat}
            onChange={(e) => {
              const selectedItag = e.target.value;
              const selectedFormat = formats.find(
                (f) => f.itag.toString() === selectedItag
              );
              if (selectedFormat) {
                setSelectedFormat(selectedItag);
                setSelectedType(selectedFormat.type);
              }
            }}
          >
            <option value="">Select Format</option>
            {formats.map((format, index) => (
              <option key={index} value={format.itag}>
                {format.qualityLabel} ({format.type})
              </option>
            ))}
          </select>

          <button
            className="btn btn-success"
            onClick={handleDownload}
            disabled={!selectedFormat || loading}
          >
            {loading ? "Downloading..." : "Download"}
          </button>
        </div>
        </div>
        </div>
      )}

      {/* Download Link */}
      {downloadUrl && (
        <div className="text-center mt-4">
          <h4 className="mb-3">Download Ready!</h4>
          <a href={downloadUrl} className="btn btn-primary" download>
            Click Here to Download
          </a>
          <p className="text-muted mt-2">⏳ This file will be deleted after 2 minutes.</p>
        </div>
      )}
    </div>
     
      <div className="max-w-screen-lg mx-auto p-4">
    <div>
      {/* Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-6">
        <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800">
          YouTube Video Downloader
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800">
          YouTube to MP4
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800">
          YouTube to MP3
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800">
          YouTube Shorts Downloader
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800">
          YouTube Shorts to MP3
        </button>
        <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800">
          YouTube Shorts to MP4
        </button>
      
      </div>

      {/* User Profiles */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <div className="flex -space-x-3">
          <img
            src="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737622922590-avatar.jpg"
            alt="User 1"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <img
            src="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737622934187-avatar.jpg"
            alt="User 2"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <img
            src="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737622942113-avatar.jpg"
            alt="User 3"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <img
            src="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737622951792-avatar.jpg"
            alt="User 4"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <img
            src="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1737622959593-avatar.jpg"
            alt="User 5"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
        </div>
        <p className="ml-4 text-white">
         <FaStar className="text-yellow-500"/> 
         <FaStar className="text-yellow-500"/>
         <FaStar className="text-yellow-500"/>
         <FaStar className="text-yellow-500"/>
         <FaStar className="text-yellow-500 me-2"/>and <strong>150,000+</strong> others
        </p>
      </div>

      {/* Existing Content (Search Bar, Thumbnails, etc.) */}
      {/* Copy the rest of your existing component logic here */}
    </div>
  </div>
    </div>
          <ToastContainer />
        
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
      <div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>
        <div className="p-5 shadow">
          <div className="accordion">
            <h2 className="faq-title">{t('Frequently Asked Questions')}</h2>
            <p className="faq-subtitle">
             {t('Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us')}
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
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 mb-4"
                onClick={openReviewForm}
              >
                {t('Write a customer review')}
              </button>
            </div>
          </div>

          <div className="col-md-8">
            {reviews?.slice(0, 5).map((review, index) => (
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
              reviews?.slice(5).map((review, index) => (
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
              <h2 className="text-2xl font-semibold mb-4">Leave a Review</h2>
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
                  placeholder="Title"
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview({ ...newReview, title: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <textarea
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                  placeholder="Your Review"
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
                {t('Submit Review')}
              </button>
              <button
                className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
                onClick={closeReviewModal}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        )}
       
       {/* Related Tools Section */}
       <div className="bg-indigo-50 p-5">
          <h2 className="text-2xl font-bold mb-5 pt-5 text-center">
            {t("Related Tools")}
          </h2>
  
          <ul role="list" className="mx-auto gap-3 grid max-w-7xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
  {relatedTools.map((tool, index) => (
    <li key={index} className="cursor-pointer bg-white rounded-xl list-none p-4 shadow transition duration-200 ease-in-out hover:scale-[101%] hover:bg-gray-50 hover:shadow-lg hover:ring-1 hover:ring-indigo-500">
                  <Link
                key={index}
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
                                                    width={28} // Add width for proper optimization
                                                    quality={50} // reduce quality if needed
                                      loading="lazy" // lazy load
                                                  />
          </div>
          <span className="ml-4 text-base font-medium text-gray-900 hover:text-indigo-600">{tool.name}</span>
        </div>
      </Link>
    </li>
  ))}
</ul>

</div>    
        {/* End of Related Tools Section */}
    
    
     
      </div>
    </>
  );
};


export async function getServerSideProps(context) {
  return getContentProps("youtube-shorts-downloader", context.locale, context.req);
}

export default YtShortdw;
