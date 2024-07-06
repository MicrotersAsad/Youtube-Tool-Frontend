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
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import Head from "next/head";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { format } from "date-fns";

const YouTubeHashtagGenerator = ({ meta,faqs }) => {
  const { user, updateUserProfile } = useAuth();
  const [tags, setTags] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [generateHashTag, setGenerateHashTag] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [generateCount, setGenerateCount] = useState(5);
  const [selectAll, setSelectAll] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
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
          `/api/content?category=YouTube-Hashtag-Generator`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || "");
        setExistingContent(data[0]?.content || "");
      } catch (error) {
        console.error("Error fetching content");
      }
    };

    fetchContent();
    fetchReviews();
  }, []);

  useEffect(() => {
    fetch("/api/deal")
      .then((res) => res.json())
      .then((data) => setPrompt(data[0]));
  }, []);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("generateCount", generateCount.toString());
    }
  }, [generateCount]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const newTag = keyword.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setKeyword("");
      }
    }
  };

  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setGenerateHashTag(
      generateHashTag.map((title) => ({
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
      toast.success(socialMediaUrls[socialNetwork]);
    } else {
      window.open(socialMediaUrls[socialNetwork], "_blank");
    }
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const toggleTitleSelect = (index) => {
    const newTitles = [...generateHashTag];
    newTitles[index].selected = !newTitles[index].selected;
    setGenerateHashTag(newTitles);
    setSelectAll(newTitles.every((title) => title.selected));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`Copied: "${text}"`),
      (err) => toast.error("Failed to copy text")
    );
  };

  const copySelectedTitles = () => {
    const selectedTitlesText = generateHashTag
      .filter((title) => title.selected)
      .map((title) => title.text.replace(/^\d+\.\s*/, "")) // Remove leading numbers and dots
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  const downloadSelectedTitles = () => {
    const selectedTitlesText = generateHashTag
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

  const generateHashTags = async () => {
    if (!user) {
      toast.error("You need to be logged in to generate tags.");
      return;
    }

    if (
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount <= 0
    ) {
      toast.error("Upgrade your plan for unlimited use.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/openaiKey");
      if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);

      const keysData = await response.json();
      const apiKeys = keysData.map((key) => key.token);
      let titles = [];
      let success = false;

      for (const key of apiKeys) {
        try {
          const result = await fetch("https://api.openai.com/v1/chat/completions", {
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
                  content: `Generate a list of at least 20 SEO-friendly Hashtags for keywords like #money: "${tags.join(
                    ", "
                  )}".`,
                },
                { role: "user", content: tags.join(", ") },
              ],
              temperature: 0.7,
              max_tokens: 3500,
            }),
          });

          const data = await result.json();
          console.log("API response:", data);

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

      setGenerateHashTag(titles);
      if (user.paymentStatus !== "success") {
        const newCount = generateCount - 1;
        setGenerateCount(newCount);
        localStorage.setItem("generateCount", newCount);
      }
    } catch (error) {
      console.error("Error generating titles:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
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
          tool: "YouTube-Hashtag-Generator",
          ...newReview,
          userProfile: user?.profileImage || "nai",
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

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=YouTube-Hashtag-Generator");
      if (!response.ok) throw new Error("Failed to fetch reviews");
  
      const data = await response.json();
      
      const formattedData = data.map((review) => ({
        ...review,
        name: review.userName,
        userProfile: review.userProfile,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"), // Format the date here
      }));
  
      setReviews(formattedData);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to fetch reviews");
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
const closeReviewForm =()=>{
  setShowReviewForm(false)
}
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
        <meta name="description" content={meta?.description || "AI Youtube Hashtag Generator"} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/YouTube-Hashtag-Generator"
        />
        <meta property="og:title" content={meta?.title || "AI Youtube Tag Generator"} />
        <meta property="og:description" content={meta?.description ||"Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights" }/>
        <meta property="og:image" content={meta?.image || ""} />
        <meta name="twitter:card" content={meta?.image || ""} />
        <meta
          property="twitter:domain"
          content="https://youtube-tool-frontend.vercel.app/"
        />
        <meta
          property="twitter:url"
          content="https://youtube-tool-frontend.vercel.app/tools/YouTube-Hashtag-Generator"
        />
        <meta name="twitter:title" content={meta?.title || "AI Youtube Tag Generator"} />
        <meta name="twitter:description" content={meta?.description ||"Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights" }/>
        <meta name="twitter:image" content={meta?.image || ""} />
        {/* - Webpage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: meta?.title,
            url: "https://youtube-tool-frontend.vercel.app/tools/YouTube-Hashtag-Generator",
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
            url: "https://youtube-tool-frontend.vercel.app/tools/YouTube-Hashtag-Generator",
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
          <h2 className="text-3xl text-white">YouTube HashTag Generator</h2>
          <ToastContainer />
          {modalVisible && (
            <div
              className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4  shadow-md mb-6 mt-3"
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
                        You need to be logged in to generate HashTag.
                      </p>
                    ) : user.paymentStatus === "success" || user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        Congratulations!! Now you can generate unlimited HashTag.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can generate HashTag {5 - generateCount} more times.{" "}
                        <Link className="btn btn-warning ms-3" href="/pricing">
                          Upgrade
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
              placeholder="Add a keyword"
              className="rounded w-100"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              required
            />
          </div>
          <p className="text-white text-center"> Example: php, html, css</p>
          <div className="center">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                className="btn btn-danger"
                onClick={generateHashTags}
                disabled={isLoading || tags.length === 0}
              >
                <span> {isLoading ? "Generating..." : "Generate HashTag"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center">
          <div className="flex gap-2">
            <FaShareAlt className="text-danger fs-3" />
            <span> Share On Social Media</span>
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

        <div className="center">
          {generateHashTag.length > 0 && (
            <div className="rounded p-3">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <span>Select All</span>
            </div>
          )}
        </div>
        <div className="generated-titles-container grid grid-cols-1 md:grid-cols-4 gap-4">
          {generateHashTag.map((title, index) => (
            <div key={index} className="title-checkbox rounded flex items-center">
              <input
                className="me-2 rounded"
                type="checkbox"
                checked={title.selected}
                onChange={() => toggleTitleSelect(index)}
              />
              {title.text.replace(/^\d+\.\s*/, "")}
              <FaCopy
                className="copy-icon ml-2 cursor-pointer"
                onClick={() => copyToClipboard(title.text.replace(/^\d+\.\s*/, ""))}
              />
            </div>
          ))}
        </div>
        <div className="d-flex">
          {generateHashTag.some((title) => title.selected) && (
            <FaCopy
              onClick={copySelectedTitles}
              className="text-center text-red-500 cursor-pointer ms-2 fs-4"
            />
          )}
          {generateHashTag.some((title) => title.selected) && (
            <FaDownload
              onClick={downloadSelectedTitles}
              className="text-center text-red-500 cursor-pointer ms-2 fs-4"
            />
          )}
        </div>
        <div></div>
        <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>

        <div className="faq-section">
          <h2 className="text-2xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center">
            Answered All Frequently Asked Question, Still Confused? Feel Free
            To Contact Us{" "}
          </p>
          <div className="faq-container grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item text-white border  p-4 ${
                  openIndex === index ? "shadow " : ""
                }`}
              >
                <div
                  className="cursor-pointer flex justify-between items-center"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="font-bold text-black">{faq.question}</h3>
                  <span className="text-white">
                    {openIndex === index ? "-" : "+"}
                  </span>
                </div>
                {openIndex === index && (
                  <p className="mt-2 text-white">{faq.answer}</p>
                )}
              </div>
            ))}
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
  const apiUrl = `${protocol}://${host}/api/content?category=YouTube-Hashtag-Generator`;
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
      url: `${protocol}://${host}/tools/YouTube-Hashtag-Generator`,
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



export default YouTubeHashtagGenerator;
