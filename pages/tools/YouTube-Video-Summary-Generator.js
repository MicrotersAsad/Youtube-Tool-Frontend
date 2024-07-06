import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCopy, FaStar } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClipLoader from "react-spinners/ClipLoader";
import Slider from "react-slick";
import Head from "next/head";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { format } from "date-fns";

const VideoSummarizer = ({ meta, faqs }) => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState([]);
  const [activeTab, setActiveTab] = useState("Transcript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateCount, setGenerateCount] = useState(5);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
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
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=YouTube-Video-Summary-Generator`
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
      const response = await fetch(
        "/api/reviews?tool=YouTube-Video-Summary-Generator"
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

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  const fetchSummary = async () => {
    if (user && user.paymentStatus !== "success" && generateCount <= 0) {
      toast.error(
        "You have reached the limit. Please upgrade for unlimited use."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/summarize", { videoUrl });
      setVideoInfo(response.data.videoInfo);
      setTranscript(response.data.captions);
      setSummary(response.data.summaries);
      if (user && user.paymentStatus !== "success" && user.role !== "admin") {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      console.error("Error summarizing video:", error);
      setError("Failed to summarize video");
      toast.error("Failed to summarize video");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!");
      })
      .catch((error) => {
        console.error("Error copying text:", error);
        toast.error("Failed to copy text");
      });
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
          tool: "YouTube-Video-Summary-Generator",
          ...newReview,
          userProfile: user?.profileImage || "",
          userName: user?.username,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setNewReview({ rating: 0, comment: "", userProfile: "", userName: "" });
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
              content="https://youtube-tool-frontend.vercel.app/tools/YouTube-Video-Summary-Generator"
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
              content="https://youtube-tool-frontend.vercel.app/tools/YouTube-Video-Summary-Generator"
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
                url: "https://youtube-tool-frontend.vercel.app/tools/YouTube-Video-Summary-Generator",
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
                url: "https://youtube-tool-frontend.vercel.app/tools/YouTube-Video-Summary-Generator",
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
          <h1 className="text-3xl font-bold text-center mb-6 text-white">
            YouTube Video Summarizer
          </h1>
          {modalVisible && (
            <div
              className="bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3 z-50"
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
                <div>
                  {user ? (
                    user.paymentStatus === "success" ||
                    user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        Congratulations! You can generate unlimited summaries.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You can generate {generateCount} more summaries.{" "}
                        <Link href="/pricing" className="btn btn-warning ms-3">
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
                  className="text-yellow-700 ml-auto"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <input
              type="text"
              className="border rounded w-full sm:w-2/3 py-2 px-3 mt-12"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <button
              className="bg-red-500 text-white py-2 px-4 rounded mt-2"
              onClick={fetchSummary}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Summary"}
            </button>
          </div>
          {loading && (
            <div className="flex justify-center my-4">
              <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        {videoInfo && !loading && (
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
              <div className="border rounded pt-6 pb-14 pe-4 ps-4 ">
                <img
                  src={videoInfo.thumbnail}
                  alt="Video Thumbnail"
                  className="mb-4"
                />
                <h2 className="text-xl font-bold mb-2">{videoInfo.title}</h2>
                <p className="mb-1">Author: {videoInfo.author}</p>
                <p className="mb-1">Video Duration: {videoInfo.duration}</p>
                <p className="mb-1">Video Published: {videoInfo.publishedAt}</p>
              </div>
            </div>
            <div className="w-full lg:w-2/3 lg:ml-4">
              <div className="border rounded p-4">
                <div className="mb-4">
                  <button
                    className={`py-2 px-4 rounded ${
                      activeTab === "Transcript"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200"
                    }`}
                    onClick={() => setActiveTab("Transcript")}
                  >
                    Transcript
                  </button>
                  <button
                    className={`py-2 px-4 rounded ml-2 ${
                      activeTab === "Summary"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200"
                    }`}
                    onClick={() => setActiveTab("Summary")}
                  >
                    Summary
                  </button>
                </div>
                {activeTab === "Transcript" && (
                  <div className="overflow-y-auto max-h-96">
                    {transcript.map((segment, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-lg font-semibold text-sky-500">
                            {" "}
                            {index + 1}:00
                          </h6>
                          <FaCopy
                            className="cursor-pointer text-red-500 hover:text-gray-700"
                            onClick={() =>
                              handleCopy(
                                segment.map((caption) => caption.text).join(" ")
                              )
                            }
                          />
                        </div>
                        <p>
                          {segment.map((caption) => caption.text).join(" ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "Summary" && (
                  <div className="overflow-y-auto max-h-96">
                    {summary.map((sum, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-lg font-semibold text-sky-500">
                            {" "}
                            {index + 1}:00
                          </h6>
                          <FaCopy
                            className="cursor-pointer text-red-500 hover:text-gray-700"
                            onClick={() => handleCopy(sum)}
                          />
                        </div>
                        <p>{sum}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
  <h2 className="faq-title">Frequently Asked Questions</h2>
  <p className="faq-subtitle">
    Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us
  </p>
  <div className="faq-grid">
    {faqs.map((faq, index) => (
      <div key={index} className="faq-item">
        <span id={`accordion-${index}`} className="target-fix"></span>
        <a
          href={`#accordion-${index}`}
          id={`open-accordion-${index}`}
          className={`accordion-header ${openIndex === index ? 'active' : ''}`}
          onClick={() => toggleFAQ(index)}
        >
          {faq.question}
        </a>
        <a
          href={`#accordion-${index}`}
          id={`close-accordion-${index}`}
          className={`accordion-header ${openIndex === index ? 'active' : ''}`}
          onClick={() => toggleFAQ(index)}
        >
          {faq.question}
        </a>
        <div
          className={`accordion-content ${openIndex === index ? 'open' : ''}`}
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
  const apiUrl = `${protocol}://${host}/api/content?category=YouTube-Video-Summary-Generator`;
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
      url: `${protocol}://${host}/tools/YouTube-Video-Summary-Generator`,
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

export default VideoSummarizer;
