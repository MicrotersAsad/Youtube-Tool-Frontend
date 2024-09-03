import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import {
  FaFacebook,
  FaThumbsUp, 
  FaThumbsDown ,
  FaFlag ,
  FaBookmark, 
  FaTwitter,
  FaLinkedin,
  FaReddit,
  FaDigg,
  FaHeart,
  FaComment,
  FaEye,
  FaStar,
  FaShareAlt,
} from "react-icons/fa";
import Link from "next/link";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import { getContentProps } from '../../utils/getContentProps';
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import Image from "next/image";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { i18n, useTranslation } from "next-i18next";
import Script from "next/script";
const StarRating = lazy(() => import('./StarRating'));


const TrendingVideos =  ({ meta, reviews, content, relatedTools, faqs,reactions,translations}) => {
  const { t } = useTranslation(['trending']);
  const [country, setCountry] = useState("All");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isUpdated, setIsUpdated] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const [generateCount, setGenerateCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
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
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const closeModal = () => setModalVisible(false);
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language || "en";
        const response = await fetch(`/api/content?category=trendingVideos&language=${language}`);
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
        setLikes(data.reactions.likes || 0);
        setUnlikes(data.reactions.unlikes || 0);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchContent();
   
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

 

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment) {
      toast.error(t('All fields are required.'));
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "trendingVideos",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t('Review submitted successfully!'));
      setNewReview({
        name: "",
        rating: 0,
        comment: "",
        userProfile: "",
        userName: "",
      });
      setShowReviewForm(false);
      fetchReviews('trendingVideos');
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(t('Failed to submit review'));
    }
  };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`https://restcountries.com/v3.1/all`);
        const countryData = response.data.map((country) => ({
          code: country.cca2,
          name: country.name.common,
        }));
        setCountries([{ code: "All", name: t('All') }, ...countryData]);
      } catch (error) {
        console.error("Error fetching countries:", error.message);
      }
    };

    fetchCountries();
  }, [t]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/trending", {
          params: { country, category: "0" },
        });
        const categoryData = response.data.categories;
        const categoryOptions = Object.entries(categoryData).map(
          ([id, title]) => ({
            id,
            title,
          })
        );
        setCategories([{ id: "All", title: t('All') }, ...categoryOptions]);
      } catch (error) {
        console.error("Error fetching video categories:", error.message);
      }
    };

    if (country !== "All") {
      fetchCategories();
    } else {
      setCategories([{ id: "All", title: t('All') }]);
    }
  }, [country, t]);

  const fetchTrendingVideos = async () => {
    if (!user) {
      toast.error(t('Please log in to fetch channel data.'));
      return;
    }

    if (
      user &&
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount <= 0
    ) {
      toast.error(
        t('You have reached the limit of generating tags. Please upgrade your plan for unlimited use.')
      );
      return;
    }
    setLoading(true);

    try {
      const response = await axios.get("/api/trending", {
        params: { country, category },
      });
      setVideos(response.data.videos);

      if (user && user.paymentStatus !== "success") {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      console.error("Error fetching trending videos:", error.message);
    } finally {
      setLoading(false);
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
      const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
      const isChannelSaved = savedChannels.some(channel => channel.toolUrl === window.location.href);
      setIsSaved(isChannelSaved);
    }
  }, [user, reactions.users]);
  

  const handleReaction = async (action) => {
    if (!user) {
      toast.error("Please log in to react.");
      return;
    }
  
    try {
      const response = await fetch('/api/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: "trendingVideos",
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
  
      if (action === "like") {
        if (hasLiked) {
          toast.error("You have already liked this.");
        } else {
          setHasLiked(true);
          setHasUnliked(false);
        }
      } else if (action === "unlike") {
        if (hasUnliked) {
          setHasUnliked(false);
        } else {
          setHasLiked(false);
          setHasUnliked(true);
        }
      }
    } catch (error) {
      console.error("Failed to update reaction:", error);
      toast.error(error.message);
    }
  };
  
  
  
  const saveChannel = () => {
    const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    const currentTool = {
      toolName: "YouTube Trending Videos", // Name of the current tool
      toolUrl: window.location.href, // Current URL of the tool
    };
  
    const existingChannelIndex = savedChannels.findIndex(channel => channel.toolUrl === currentTool.toolUrl);
  
    if (existingChannelIndex === -1) {
      // If the tool is not already saved, save it
      savedChannels.push(currentTool);
      localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
      setIsSaved(true);
      toast.success("Tool saved successfully!");
    } else {
      // If the tool is already saved, remove it
      savedChannels.splice(existingChannelIndex, 1);
      localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
      setIsSaved(false);
      toast.success("Tool removed from saved list.");
    }
  };
  

  // বাটন রঙের লজিক
  const likeButtonColor = hasLiked ? "#4CAF50" : "#ccc"; // লাইক করা থাকলে সবুজ
  const unlikeButtonColor = hasUnliked ? "#F44336" : "#ccc"; // ডিসলাইক করা থাকলে লাল
  const reportButtonColor = hasReported ? "#FFD700" : "#ccc"; // রিপোর্ট করা থাকলে হলুদ
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
  
  {/* Open Graph Tags */}
  <meta property="og:url" content={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/trending-videos`} />
  <meta property="og:title" content={meta?.title} />
  <meta property="og:description" content={meta?.description} />
  <meta property="og:image" content={meta?.image || ""} />
  
  {/* Twitter Card Tags */}
  <meta name="twitter:card" content={meta?.image || ""} />
  <meta property="twitter:domain" content={meta?.url} />
  <meta property="twitter:url" content={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/trending-videos`} />
  <meta name="twitter:title" content={meta?.title} />
  <meta name="twitter:description" content={meta?.description} />
  <meta name="twitter:image" content={meta?.image || ""} />
  
  {/* hreflang and Alternate Language Links */}
  <link rel="alternate" href={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/trending-videos`}  hrefLang="x-default" />
  <link rel="alternate" href={`${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/trending-videos`}  hrefLang="en" />
  {translations && Object.keys(translations).map(lang => (
    lang !== 'en' && (
      <link
        key={lang}
        rel="alternate"
        hrefLang={lang}
        href={`${meta?.url}/${lang}/tools/trending-videos`}
      />
    )
  ))}
  
  {/* JSON-LD Structured Data */}
  <Script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: meta?.title,
      url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/trending-videos`,
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
  
  <Script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta?.title,
      url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/trending-videos`,
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
</Head>
          {/* Toast container for notifications */}
          <ToastContainer />
          {/* Page title */}

         {/* Alert message for logged in/out users */}
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
                        {t('Congratulations! Now you can get unlimited Trending Video.')}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t('You are not upgraded. You can get Trending Video {remaining Generations} more times', { remainingGenerations: 5 - generateCount })}{" "}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t('Upgrade')}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t('Please log in to fetch channel data.')} <Link href="/login">{t('loginPrompt')}</Link>
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

<div className="border max-w-4xl mx-auto shadow-sm rounded p-5 bg-light">
  <h1 className="text-center">{t('YouTube Trending Videos')}</h1>
  <div className="flex flex-col sm:flex-row items-center justify-center mx-auto w-full sm:w-3/4 space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 mb-4 mt-5">
    <select
      value={country}
      onChange={(e) => setCountry(e.target.value)}
      className="border p-2 rounded w-full sm:w-1/3"
    >
      {countries.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="border p-2 rounded w-full sm:w-1/3"
    >
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.title}
        </option>
      ))}
    </select>
    <button
      onClick={fetchTrendingVideos}
      className="bg-red-500 text-white p-2 rounded w-full sm:w-1/3"
    >
      {t('Get Your Trends')}
    </button>
  </div>

  <div className="flex justify-center mb-4">
   <FaShareAlt className="mx-1 text-red-600 cursor-pointer"/>
    <FaFacebook className="mx-1 text-blue-600 cursor-pointer" />
    <FaTwitter className="mx-1 text-blue-400 cursor-pointer" />
    <FaLinkedin className="mx-1 text-blue-700 cursor-pointer" />
    <FaReddit className="mx-1 text-orange-500 cursor-pointer" />
    <FaDigg className="mx-1 text-blue-600 cursor-pointer" />
  </div>

  {/* Reaction Bar */}
  <div className="reaction-bar flex items-center justify-between mt-4 p-3">
    <div className="flex items-center space-x-2 ps-5">
      <button
        onClick={() => handleReaction("like")}
        className="flex items-center space-x-1"
        style={{ color: likeButtonColor }}
      >
        <FaThumbsUp className="text-purple-600" />
        <span>{likes} |</span>
      </button>

      <button
        onClick={() => handleReaction("unlike")}
        className="flex items-center space-x-1"
        style={{ color: unlikeButtonColor }}
      >
        <FaThumbsDown className="text-red-400" />
        <span>{unlikes} |</span>
      </button>

      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center space-x-1"
        style={{ color: reportButtonColor }}
      >
        <FaFlag className="text-red-500" />
        <span className="text-red-500">Report</span>
      </button>
    </div>

    <div className="flex items-center">
      <button
        onClick={saveChannel}
        className="flex items-center space-x-1"
        style={{ color: saveButtonColor }}
      >
        {isSaved ? <FaBookmark className="text-yellow-300" /> : <FaBookmark className="text-yellow-300" />}
      </button>
    </div>
  </div>

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
        {loading ? (
          <p>{t('Loading...')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.videoId}
                  className="border rounded-lg shadow-md p-4"
                >
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    className="mb-4 rounded-lg"
                    width={400}
                    height={400}
                  />
                  <h3 className="text-lg font-bold mb-2">
                    <Link
                      className="text-black"
                      target="_blank"
                      href={`https://www.youtube.com/watch?v=${video?.videoId}`}
                    >
                      {video.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {t('Uploaded By:')}{" "}
                    <span className="font-medium">{video.channel}</span> {t('on')}{" "}
                    {new Date(video.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    {t('Category')}{" "}
                    <span className="font-medium">{video.category}</span>
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center text-red-500">
                      <FaHeart className="mr-1" />
                      <span>{video.likes}</span>
                    </div>
                    <div className="flex items-center text-blue-500">
                      <FaComment className="mr-1" />
                      <span>{video.comments}</span>
                    </div>
                    <div className="flex items-center text-green-500">
                      <FaEye className="mr-1" />
                      <span>{video.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
       <div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ listStyleType: "none" }}
          ></article>
        </div>
        {/* Reviews Section */}
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
                <Suspense fallback={<div>Loading...</div>}>
                  <StarRating
                    rating={newReview.rating}
                    setRating={(rating) => setNewReview({ ...newReview, rating })}
                  />
                </Suspense>
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
                onClick={closeReviewForm}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        )}
 {/* Related Tools Section */}
 <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-5 text-center">{t('Related Tools')}</h2>
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
    </>
  );
};


export async function getServerSideProps(context) {
  return getContentProps('trendingVideos', context.locale, context.req);
}

export default TrendingVideos;
