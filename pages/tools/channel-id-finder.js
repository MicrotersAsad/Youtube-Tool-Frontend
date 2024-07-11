import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from "../../contexts/AuthContext";
import Slider from "react-slick";
import { FaStar } from "react-icons/fa";
import StarRating from "./StarRating";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import Head from "next/head";
import { format } from "date-fns";
import { i18n, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const ChannelIdFinder = ({ meta, faqs }) => {
  const { user, updateUserProfile } = useAuth();
  const [modalVisible, setModalVisible] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const { t } = useTranslation('channelId');
  const [loading, setLoading] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [error, setError] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [relatedTools, setRelatedTools] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(
          `/api/content?category=channel-id-finder&language=${language}`
        );
        if (!response.ok) throw new Error(t("Failed to fetch content"));
        const data = await response.json();
        
        setQuillContent(data[0]?.content || "");
        setExistingContent(data[0]?.content || "");
        setRelatedTools(data[0]?.relatedTools || []);
      } catch (error) {
        toast.error(t("Error fetching content"));
      }
    };

    fetchContent();
    fetchReviews();
  }, [i18n.language, t]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && user.role !== "admin") {
      const storedCount = localStorage.getItem("generateCount");
      setGenerateCount(storedCount ? parseInt(storedCount) : 3);
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.paymentStatus === "success" || user.role === "admin")) {
      localStorage.removeItem("generateCount");
    }
  }, [user]);

  const fetchVideoData = async (videoUrl) => {
    try {
      const response = await fetch("/api/fetch-channel-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });
      if (!response.ok) throw new Error(t("Failed to fetch channel data"));
      return await response.json();
    } catch (error) {
      throw new Error(error.message || t("Unknown error occurred"));
    }
  };

  const handleFetch = async () => {
    if (!user) {
      toast.error(t("Please log in to fetch channel data."));
      return;
    }

    if (!videoUrl) {
      toast.error(t("Please enter a YouTube video URL."));
      return;
    }

    if (
      generateCount >= 3 &&
      user.paymentStatus !== "success" &&
      user.role !== "admin"
    ) {
      toast.error(t("Fetch limit exceeded. Please upgrade for unlimited access."));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchVideoData(videoUrl);
      setChannelData(data);
      toast.success(t("Channel data fetched successfully!"));
      if (user && user.paymentStatus !== "success" && user.role !== "admin") {
        const newCount = generateCount + 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=channel-id-finder");
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
          tool: "channel-id-finder",
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
      toast.error(t("Failed to submit review"));
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
          <Image className="shape2" src={cloud} alt="cloud" />
          <Image className="shape3" src={cloud2} alt="cloud2" />
          <Image className="shape4" src={chart} alt="chart" />
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
              content="https://youtube-tool-frontend.vercel.app/tools/channel-id-finder"
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
              content="https://youtube-tool-frontend.vercel.app/tools/channel-id-finder"
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
                url: "https://youtube-tool-frontend.vercel.app/tools/channel-id-finder",
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
                url: "https://youtube-tool-frontend.vercel.app/tools/channel-id-finder",
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
          <ToastContainer />
          <h1 className="text-3xl font-bold text-center text-white mb-6">
            {t("YouTube Channel ID Finder")}
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
                        {t("Congratulations! Now you can get unlimited Channel Data.")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You are not upgraded. You can get Channel Data {{remainingGenerations}} more times.", { remainingGenerations: 5 - generateCount })}{" "}
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
          <div className="max-w-md mx-auto">
            <div className="input-group mb-4">
              <input
                type="text"
                className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder={t("Enter YouTube Video URL...")}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyPress={(event) => {
                  if (event.key === "Enter") handleFetch();
                }}
              />
              <small className="text-white">
                {t("Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s")}
              </small>
            </div>
            <button
              className={`btn btn-danger w-full text-white font-bold py-2 px-4 rounded hover:bg-red-700 focus:outline-none focus:shadow-outline ${
                loading ? "bg-blue-300" : "bg-blue-500"
              }`}
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? t("Loading...") : t("Fetch Data")}
            </button>
          </div>
          {error && (
            <div className="alert alert-danger text-red-500 text-center mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        {channelData && (
          <div className="mt-8">
            <p>
              <strong>{t("Channel ID")}:</strong> {channelData.channelId}
            </p>
            <p className="text-2xl font-semibold">
              <strong>{t("Channel Name")}:</strong> {channelData.channelName}
            </p>
            <p>
              <strong>{t("Channel URL")}:</strong>{" "}
              <a
                href={channelData.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {channelData.channelUrl}
              </a>
            </p>
            <p>
              <strong>{t("Description")}:</strong> {channelData.channelDescription}
            </p>
            <p>
              <strong>{t("Subscribers")}:</strong> {channelData.subscribers}
            </p>
            <p>
              <strong>{t("Total Views")}:</strong> {channelData.totalViews}
            </p>
            <p>
              <strong>{t("Video Count")}:</strong> {channelData.videoCount}
            </p>
            <p>
              <strong>{t("Tags")}:</strong> {channelData.channelTags}
            </p>
            <div className="flex flex-wrap justify-center mt-4">
              <img
                src={channelData.channelProfileImage}
                alt="Channel Profile"
                className="w-24 h-24 rounded-full mx-2"
              />
            </div>
            <div className="flex flex-wrap justify-center mt-4">
              <a href={channelData.channelProfileImage} download>
                <button className="btn btn-primary mt-2">
                  {t("Download Profile Image")}
                </button>
              </a>
            </div>
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
                    {t(faq.question)}
                  </a>
                  <a
                    href={`#accordion-${index}`}
                    id={`close-accordion-${index}`}
                    className="accordion-header"
                    onClick={() => toggleFAQ(index)}
                  >
                    {t(faq.question)}
                  </a>
                  <div
                    className={`accordion-content ${
                      openIndex === index ? "open" : ""
                    }`}
                  >
                    <p>{t(faq.answer)}</p>
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
          <h2 className="text-2xl font-bold mb-5">{t("Related Tools")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools.map((tool, index) => (
              <a
                key={index}
                href={tool.link}
                className="flex items-center border  shadow rounded-md p-4 hover:bg-gray-100"
              >
                <div className="d-flex">
                  <img
                    src={tool?.Banner?.TagGenerator?.src}
                    alt={`${tool.name} Banner`}
                    className="ml-2 w-14 h-14"
                  />
                  <span className="ms-2">{tool.name}</span>
                </div>
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
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=channel-id-finder&language=${locale}`;

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
      title: contentData[0]?.title || "",
      description: contentData[0]?.description || "",
      image: contentData[0]?.image || "",
      url: `${protocol}://${host}/tools/channel-id-finder`,
    };

    return {
      props: {
        meta,
        faqs: contentData[0].faqs || [],
        ...(await serverSideTranslations(locale, ['common','tagextractor','navbar','channelId',"footer"])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:");
    return {
      props: {
        meta: {},
        faqs: [],
        ...(await serverSideTranslations(locale, ['common', 'tagextractor','navbar','channelId',"footer"])),
      },
    };
  }
}

export default ChannelIdFinder;
