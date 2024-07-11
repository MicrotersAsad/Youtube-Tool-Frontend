import React, { useState, useEffect, useTransition } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";
import StarRating from "./StarRating"; // Import StarRating component
import { FaStar } from "react-icons/fa";
import Image from "next/image";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import { format } from "date-fns";
import { i18n, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const YouTubeChannelScraper = ({ meta, faqs }) => {
  const { user, updateUserProfile, logout } = useAuth();
  const { t } = useTranslation('search');
  const [keyword, setKeyword] = useState("");
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [minSubscriber, setMinSubscriber] = useState(0);
  const [maxSubscriber, setMaxSubscriber] = useState(Infinity);
  const [page, setPage] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [generateCount, setGenerateCount] = useState(
    typeof window !== "undefined"
      ? Number(localStorage.getItem("generateCount")) || 0
      : 0
  );
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [relatedTools, setRelatedTools] = useState([]);
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/content?category=YouTube-Channel-Search&language=${language}`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || ""); // Ensure content is not undefined
        setExistingContent(data[0]?.content || ""); // Ensure existing content is not undefined
        setRelatedTools(data[0]?.relatedTools || []);
      } catch (error) {
        toast.error(t("Error fetching content"));
      }
    };

    fetchContent();
    fetchReviews();
  }, [i18n.language]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=YouTube-Channel-Search");
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"), // Format the date here
      }));
      setReviews(formattedData);
    } catch (error) {
      console.error(t("Failed to fetch reviews:"), error);
    }
  };

  const handleReviewSubmit = async () => {
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
          tool: "YouTube-Channel-Search",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error(t("Failed to submit review"));

      toast.success(t("Review submitted successfully!"));
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
      console.error(t("Failed to submit review:"), error);
      toast.error(t("Failed to submit review."));
    }
  };

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

  const handleSearchClick = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("Please log in to fetch channel data."));
      return;
    }
    setLoading(true);
    setChannels([]);
    setFilteredChannels([]);
    setError("");
    if (
      user &&
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount >= 5
    ) {
      toast.error(
        t("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.")
      );
      setLoading(false);
      return;
    }

    try {
      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error(t("Failed to fetch API tokens"));

      const tokens = await tokensResponse.json();
      let nextPageToken = "";
      let totalChannelsData = [];
      let tokenIndex = 0;

      while (
        totalChannelsData.length < 200 &&
        nextPageToken !== null &&
        tokenIndex < tokens.length
      ) {
        const apiKey = tokens[tokenIndex].token;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(
          keyword
        )}&key=${apiKey}&pageToken=${nextPageToken}`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
          if (searchResponse.status === 403) {
            // quota exceeded or invalid API key
            tokenIndex++;
            continue; // try the next token
          } else {
            throw new Error(`HTTP error! status: ${searchResponse.status}`);
          }
        }

        const searchData = await searchResponse.json();
        const channelIds = searchData.items.map(
          (item) => item.snippet.channelId
        );
        const uniqueChannelIds = [...new Set(channelIds)];
        const channelsData = await getChannelsData(uniqueChannelIds, apiKey);
        totalChannelsData = totalChannelsData.concat(channelsData);
        nextPageToken = searchData.nextPageToken || null;
      }

      const filtered = filterChannels(totalChannelsData);
      setFilteredChannels(filtered);
      setChannels(filtered.slice(0, 50));
      setGenerateCount(generateCount + 1);
      localStorage.setItem("generateCount", generateCount + 1);
    } catch (error) {
      console.error("Error:", error);
      setError(
        `${t("An error occurred while fetching channel data:")} ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const filterChannels = (channels) => {
    return channels.filter((channel) => {
      const subscribers = parseInt(channel.statistics.subscriberCount);
      return subscribers >= minSubscriber && subscribers <= maxSubscriber;
    });
  };

  const getChannelsData = async (channelIds, apiKey) => {
    const detailsPromises = channelIds.map(async (channelId) => {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${apiKey}`;
      const response = await fetch(detailsUrl);
      if (!response.ok) {
        if (response.status === 403) {
          // quota exceeded or invalid API key
          throw new Error(`Quota exceeded for key: ${apiKey}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      const data = await response.json();
      return data.items[0];
    });

    return Promise.all(detailsPromises);
  };

  const handlePagination = (pageIndex) => {
    const startIdx = pageIndex * 50;
    const endIdx = startIdx + 50;
    const currentPageChannels = filteredChannels.slice(startIdx, endIdx);
    setChannels(currentPageChannels);
    setPage(pageIndex);
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
            <meta
              name="description"
              content={meta?.description || t("AI Youtube Hashtag Generator")}
            />
            <meta
              property="og:url"
              content="https://youtube-tool-frontend.vercel.app/tools/YouTube-Channel-Search"
            />
            <meta
              property="og:title"
              content={meta?.title || t("AI Youtube Tag Generator")}
            />
            <meta
              property="og:description"
              content={
                meta?.description ||
                t("Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights")
              }
            />
            <meta property="og:image" content={meta?.image || ""} />
            <meta name="twitter:card" content={meta?.image || ""} />
            <meta
              property="twitter:domain"
              content="https://youtube-tool-frontend.vercel.app/"
            />
            <meta
              property="twitter:url"
              content="https://youtube-tool-frontend.vercel.app/tools/YouTube-Channel-Search"
            />
            <meta
              name="twitter:title"
              content={meta?.title || t("AI Youtube Tag Generator")}
            />
            <meta
              name="twitter:description"
              content={
                meta?.description ||
                t("Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights")
              }
            />
            <meta name="twitter:image" content={meta?.image || ""} />
            {/* - Webpage Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: meta?.title,
                url: "https://youtube-tool-frontend.vercel.app/tools/YouTube-Channel-Search",
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
                url: "https://youtube-tool-frontend.vercel.app/tools/YouTube-Channel-Search",
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
          </Head>
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            {t("YouTube Channel Search")}
          </h1>
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
                        {t("Congratulations! Now you can get unlimited Channel Details.")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You are not upgraded. You can get Channel Details {{remainingGenerations}} more times.", { remainingGenerations: 5 - generateCount })}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          {t("Upgrade")}
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      {t("Please log in to fetch channel data.")}
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

          <form className="max-w-sm mx-auto" onSubmit={handleSearchClick}>
            <div className="mb-3">
              <label
                htmlFor="text"
                className="block mb-2 text-sm font-medium text-white dark:text-white"
              >
                {t("Enter Keyword")}
              </label>
              <input
                type="text"
                id="text"
                className="shadow-sm bg-gray-50 border border-gray-300 text-whitetext-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                placeholder={t("Enter Keyword")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="number"
                className="block mb-2 text-sm font-medium text-white dark:text-white"
              >
                {t("Min Subscriber")}
              </label>
              <input
                type="number"
                id="number"
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                placeholder={t("Min Subscriber")}
                value={minSubscriber}
                onChange={(e) => setMinSubscriber(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="repeat-number"
                className="block mb-2 text-sm font-medium text-white dark:text-white"
              >
                {t("Max Subscriber")}
              </label>
              <input
                type="number"
                id="repeat-number"
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                placeholder={t("Max Subscriber")}
                value={maxSubscriber}
                onChange={(e) => setMaxSubscriber(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              {t("Search")}
            </button>
          </form>

          {loading && <div className="loader mt-4 mx-auto"></div>}
          {error && (
            <div className="text-red-500 text-center mt-4">{error}</div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div
          id="channelList"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 channels-grid"
        >
          {channels.map((channel, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg p-4 channel-card"
            >
              <img
                src={channel.snippet.thumbnails.high.url}
                alt={channel.snippet.title}
                className="w-full h-auto rounded-md mb-4"
              />
              <div className="channel-info">
                <Link
                  href={`https://www.youtube.com/channel/${channel.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 font-bold text-xl"
                >
                  {channel.snippet.title}
                </Link>
                <p className="text-gray-700">
                  {t("Subscribers:")} {channel.statistics.subscriberCount}
                </p>
                <p className="text-gray-700">
                  {t("Total Views:")} {channel.statistics.viewCount}
                </p>
                <p className="text-gray-700">
                  {t("Videos:")} {channel.statistics.videoCount}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div id="pagination" className="text-center mt-3">
          {[...Array(Math.ceil(filteredChannels.length / 50)).keys()].map(
            (_, i) => (
              <button
                key={i}
                className={`btn btn-sm btn-outline-primary me-2 ${
                  page === i ? "active" : ""
                }`}
                onClick={() => handlePagination(i)}
              >
                {i + 1}
              </button>
            )
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
            <h2 className="faq-title">{t("Frequently Asked Questions")}</h2>
            <p className="faq-subtitle">
              {t("Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us")}
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
            <div className=" text-3xl font-bold mb-2">{t("Customer reviews")}</div>
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
                      src={`data:image/jpeg;base64,${review?.userProfile}`}
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
            <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full">
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
         {/* Related Tools Section */}
         <div className="related-tools mt-10 shadow p-5">
          <h2 className="text-2xl font-bold mb-5">{t('Related Tools')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools.map((tool, index) => (
              <a key={index} href={tool.link} className="flex items-center border  shadow rounded-md p-4 hover:bg-gray-100">
               <div className="d-flex">
               <img src={tool?.Banner?.TagGenerator?.src} alt={`${tool.name} Banner`} className="ml-2 w-14 h-14" />
               <span className="ms-2">{tool.name}</span>
               </div>
              </a>
            ))}
          </div>
        </div>
        {/* End of Related Tools Section */}
      </div>

      <ToastContainer />
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=YouTube-Channel-Search&language=${locale}`;
  const relatedToolsUrl = `${protocol}://${host}/api/content?category=relatedTools&language=${locale}`;

  try {
    const [contentResponse] = await Promise.all([
      fetch(apiUrl),
      fetch(relatedToolsUrl)
    ]);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const [contentData] = await Promise.all([
      contentResponse.json(),
    ]);

    const meta = {
      title: contentData[0]?.title || "",
      description: contentData[0]?.description || "",
      image: contentData[0]?.image || "",
      url: `${protocol}://${host}/tools/YouTube-Channel-Search`,
    };

    return {
      props: {
        meta,
        faqs: contentData[0].faqs || [],
        ...(await serverSideTranslations(locale, ['common','trending','footer','navbar','titlegenerator','videoDataViewer','banner','logo','search'])),
      },
    };
  
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        ...(await serverSideTranslations(locale, ['common', 'trending','footer','navbar','titlegenerator','videoDataViewer','banner','logo','search'])),
      },
      
    };
    
  }
  
}
export default YouTubeChannelScraper;
