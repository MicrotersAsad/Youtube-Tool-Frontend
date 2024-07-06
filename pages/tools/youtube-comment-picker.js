import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaHeart, FaComment, FaStar } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import StarRating from "./StarRating";
import Head from "next/head";
import { format } from "date-fns";

const YouTubeCommentPicker = ({ meta, faqs }) => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [includeReplies, setIncludeReplies] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [comments, setComments] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=youtube-comment-picker`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || "");
        setExistingContent(data[0]?.content || "");
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=youtube-comment-picker");
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
          tool: "youtube-comment-picker",
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem("generateCount"), 10) || 0;
      setGenerateCount(count);
    }
  }, []);

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

  const handlePickWinner = async () => {
    if (!user) {
      toast.error("Please log in to use this tool.");
      return;
    }

    if (
      generateCount >= 5 &&
      user?.paymentStatus !== "success" &&
      user?.role !== "admin"
    ) {
      toast.error(
        "You have reached the limit of generating winners. Please upgrade your plan for unlimited use."
      );
      return;
    }

    setLoading(true);
    try {
      const videoId = new URLSearchParams(new URL(videoUrl).search).get("v");
      const response = await axios.get("/api/commentswinner", {
        params: { videoId, includeReplies },
      });
      let allComments = response.data;

      if (filterDuplicates) {
        const uniqueUsers = new Set();
        allComments = allComments.filter((comment) => {
          if (uniqueUsers.has(comment.user)) return false;
          uniqueUsers.add(comment.user);
          return true;
        });
      }

      if (filterText) {
        allComments = allComments.filter((comment) =>
          comment.text.includes(filterText)
        );
      }

      if (allComments.length > 0) {
        const selectedWinners = [];
        const uniqueIndexes = new Set();
        while (
          selectedWinners.length < numberOfWinners &&
          uniqueIndexes.size < allComments.length
        ) {
          const randomIndex = Math.floor(Math.random() * allComments.length);
          if (!uniqueIndexes.has(randomIndex)) {
            uniqueIndexes.add(randomIndex);
            selectedWinners.push(allComments[randomIndex]);
          }
        }
        setWinners(selectedWinners);
        setGenerateCount((prevCount) => {
          const newCount = prevCount + 1;
          localStorage.setItem("generateCount", newCount);
          return newCount;
        });
      } else {
        setWinners([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error.message);
      toast.error("Error fetching comments");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
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
              content={meta?.description || "AI Youtube Hashtag Generator"}
            />
            <meta
              property="og:url"
              content="https://youtube-tool-frontend.vercel.app/tools/youtube-comment-picker"
            />
            <meta
              property="og:title"
              content={meta?.title || "AI Youtube Tag Generator"}
            />
            <meta
              property="og:description"
              content={
                meta?.description ||
                "Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights"
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
              content="https://youtube-tool-frontend.vercel.app/tools/youtube-comment-picker"
            />
            <meta
              name="twitter:title"
              content={meta?.title || "AI Youtube Tag Generator"}
            />
            <meta
              name="twitter:description"
              content={
                meta?.description ||
                "Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights"
              }
            />
            <meta name="twitter:image" content={meta?.image || ""} />
            {/* - Webpage Schema */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: meta?.title,
                url: "https://youtube-tool-frontend.vercel.app/tools/youtube-comment-picker",
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
                url: "https://youtube-tool-frontend.vercel.app/tools/youtube-comment-picker",
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
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h1 className="text-center">YouTube Comment Picker</h1>
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
                          Congratulations!! Now you can pick unlimited winners.
                        </p>
                      ) : (
                        <p className="text-center p-3 alert-warning">
                          You are not upgraded. You can pick winners{" "}
                          {5 - generateCount} more times.{" "}
                          <Link
                            href="/pricing"
                            className="btn btn-warning ms-3"
                          >
                            Upgrade
                          </Link>
                        </p>
                      )
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        Please log in to use this tool.
                      </p>
                    )}
                  </div>
                  <button
                    className="ml-auto text-yellow-700"
                    onClick={closeModal}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-4 mb-4">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=example"
                className="border p-2 rounded sm:w-2/3"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <button
                onClick={handlePickWinner}
                className="bg-red-500 text-white p-2 rounded"
                disabled={loading}
              >
                {loading ? "Loading..." : "Pick a Winner"}
              </button>
            </div>
            <div className="container mx-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-100 rounded-lg shadow-lg">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">
                    YouTube Comment Options:
                  </h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-gray-700">
                      Include replies to comments
                    </label>
                    <input
                      type="checkbox"
                      checked={includeReplies}
                      onChange={() => setIncludeReplies(!includeReplies)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </div>
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-gray-700">
                      Filter duplicate users/names
                    </label>
                    <input
                      type="checkbox"
                      checked={filterDuplicates}
                      onChange={() => setFilterDuplicates(!filterDuplicates)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </div>
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-gray-700">
                      Filter comments on specific text
                    </label>
                    <input
                      type="text"
                      className="border p-2 rounded-lg w-full focus:border-blue-500"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">
                    YouTube Raffle Options:
                  </h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-gray-700">No. of winners:</label>
                    <select
                      value={numberOfWinners}
                      onChange={(e) =>
                        setNumberOfWinners(parseInt(e.target.value))
                      }
                      className="border p-2 rounded-lg focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {winners.length === 1 && (
                <div className="bg-white p-4 rounded-lg sm:w-1/3 mx-auto shadow-md mt-5 winner-card">
                  <h3 className="text-xl font-bold text-center mb-4">Winner</h3>
                  {winners.map((winner, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center mb-4"
                    >
                      <div className="w-24 h-24 mb-4">
                        <img
                          src={winner.avatar}
                          alt={winner.user}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <p className="text-lg font-bold">
                        <Link target="_blank" href={winner.channelUrl}>
                          @{winner.user}
                        </Link>
                      </p>
                      <p className="text-gray-600">{winner.text}</p>
                      <div className="flex space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-red-500">
                          <FaHeart />
                          <span>{winner.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-blue-500">
                          <FaComment />
                          <span>{winner.replies}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {winners.length > 1 && (
                <>
                  <h2 className="text-center pt-5">Winner</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                    {winners.map((winner, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-md winner-card"
                      >
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-24 h-24 mb-4">
                            <img
                              src={winner.avatar}
                              alt={winner.user}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <p className="text-lg font-bold">
                            <Link target="_blank" href={winner.channelUrl}>
                              @{winner.user}
                            </Link>
                          </p>
                          <p className="text-gray-600">{winner.text}</p>
                          <div className="flex space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-red-500">
                              <FaHeart />
                              <span>{winner.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-blue-500">
                              <FaComment />
                              <span>{winner.replies}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>
        <div className="p-5 shadow">
          <div className="accordion">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <p className="faq-subtitle">
              Answered All Frequently Asked Questions, Still Confused? Feel Free
              To Contact Us
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
            <div className=" text-3xl font-bold mb-2">Customer reviews</div>
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
                {reviews.length} global ratings
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
              <h4>Review This Tool</h4>
              <p>Share Your Thoughts With Other Customers</p>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
                onClick={openReviewForm}
              >
                Write a customer review
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
                      Verified Purchase
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
                  Reviewed On {review.createdAt}
                </div>
                <div className="text-lg mb-4">{review.comment}</div>
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="btn btn-primary mt-4 mb-5"
                onClick={handleShowMoreReviews}
              >
                See More Reviews
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
                        Verified Purchase
                      </div>
                      <p className="text-muted">
                        Reviewed On {review?.createdAt}
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
                Submit Review
              </button>
              <button
                className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
                onClick={closeReviewForm}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const { req } = context;
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=youtube-comment-picker`;
  console.log(apiUrl);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch content");
    }

    const data = await response.json();

    const meta = {
      title: data[0]?.title || "",
      description: data[0]?.description || "",
      image: data[0]?.image || "",
      url: `${protocol}://${host}/tools/youtube-comment-picker`,
    };

    return {
      props: {
        meta,
        faqs: data[0]?.faqs || [],
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
      },
    };
  }
}
export default YouTubeCommentPicker;
