/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from "react";
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
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import StarRating from "./StarRating";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Head from "next/head";
import { format } from "date-fns";
import { i18n, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const YtThumbnailDw = ({ meta, faqs }) => {
  const { isLoggedIn, user, updateUserProfile, logout } = useAuth();
  const [translations, setTranslations] = useState([]);
  const [t]=useTranslation('thumbnail')
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [thumbnails, setThumbnails] = useState(null);
  const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState("");
  const [generateCount, setGenerateCount] = useState(0);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [content, setContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [relatedTools,setRelatedTools]=useState([])

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const closeModal = () => setModalVisible(false);
  const closeRform = () => setShowReviewForm(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/content?category=Youtube-Thumbnails-Generator&language=${language}`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        console.log(data);
        setQuillContent(data.translations[language]?.content || "");
        setExistingContent(data.translations[language]?.content || "");  
        setRelatedTools(data.translations[language]?.relatedTools || []);
        setTranslations(data.translations);
      } catch (error) {
        console.error("Error fetching content");
      }
    };

    fetchContent();
  }, [i18n.language]);

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

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=yt-thumbnail-downloader");
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
          tool: "yt-thumbnail-downloader",
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

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const fetchYouTubeData = async () => {
    if (generateCount <= 0 && user?.role !== "admin") {
      toast.error(
        "You have reached the limit of generating titles. Please upgrade your plan for unlimited use."
      );
      return;
    }
    if (!videoUrl) {
      toast.error("Please enter a valid YouTube video URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error("Failed to fetch API tokens");

      const tokens = await tokensResponse.json();
      const videoId = extractVideoId(videoUrl);
      let dataFetched = false;

      for (const { token } of tokens) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${token}`
          );

          if (response.data.items && response.data.items.length > 0) {
            const { thumbnails } = response.data.items[0].snippet;
            console.log(thumbnails);
            setThumbnails(thumbnails);
            dataFetched = true;
            break; // Exit loop on success
          } else {
            console.error("No video data found for the provided URL.");
          }
        } catch (error) {
          console.error(
            `Error fetching data with token ${token}:`,
            error.response?.data || error.message
          );
        }
      }

      if (!dataFetched) {
        throw new Error("All API tokens exhausted or failed to fetch data.");
      }
    } catch (error) {
      setError("Failed to fetch YouTube data. Please check the video URL.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    const match = url.match(regex);
    return match ? match[2] : null;
  };

  const downloadThumbnail = (url) => {
    if (!url) {
      toast.error("No thumbnail URL selected.");
      return;
    }

    window.location.href = url;
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
              href={`${meta?.url}/?locale=${lang}`}
              hreflang={lang}
            />
          ))}
        </Head>
          <h2 className="text-3xl pt-5 text-white">
            {t('YouTube Thumbnails Downloader')}
          </h2>
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
                        {t('You need to be logged in to generate thumbnails.')}
                      </p>
                    ) : user.paymentStatus === "success" ||
                      user.role === "admin" ? (
                      <p className="text-center p-3 alert-warning">
                        {t('Congratulations!! Now you can generate unlimited thumbnails.')}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                         {t('You are not upgraded. You can download thumbnails {{remainingGenerations}} more times.', { remainingGenerations: 5 - generateCount })}
                       
                        <Link className="btn btn-warning ms-3" href="/pricing">
                          {t('Upgrade')}
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

          <div className="row justify-content-center pt-5">
            <div className="col-md-6">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter YouTube Video URL..."
                  aria-label="YouTube Video URL"
                  value={videoUrl}
                  onChange={handleUrlChange}
                />
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={fetchYouTubeData}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Fetch Thumbnail"}
                </button>
              </div>
              <small className="text-white">
                Example: https://www.youtube.com/watch?v=j6X9tH9y_cs
              </small>
              <br />
              <div className="ms-5">
                <button
                  className="btn btn-danger mt-3"
                  onClick={handleShareClick}
                >
                  <FaShareAlt />
                </button>
                {showShareIcons && (
                  <div className="share-icons mt-3">
                    <FaFacebook className="facebook-icon" />
                    <FaInstagram className="instagram-icon" />
                    <FaTwitter className="twitter-icon" />
                    <FaLinkedin className="linkedin-icon" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <div className="d-flex flex-wrap justify-content-center">
          {thumbnails &&
            Object.entries(thumbnails).map(([resolution, { url }]) => (
              <div
                key={resolution}
                className={`p-2 ${
                  url === selectedThumbnailUrl ? "selected" : ""
                }`}
                onClick={() => setSelectedThumbnailUrl(url)}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${resolution}`}
                  width={200}
                  height={150}
                  className="img-thumbnail"
                  style={{
                    border:
                      url === selectedThumbnailUrl ? "3px solid blue" : "none",
                    cursor: "pointer",
                  }}
                />
                <p className="text-center">{resolution}</p>
              </div>
            ))}
        </div>
        <div className="text-center mt-4">
          {selectedThumbnailUrl && (
            <button className="btn btn-danger">
              <Link
                target="_blank"
                href={selectedThumbnailUrl}
                download="YouTube_thumbnail.jpg"
              >
                <FaDownload className="text-white" />
              </Link>
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
                onClick={closeRform}
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
        <style jsx>{`
          .selected {
            border: 3px solid blue;
          }
          .img-thumbnail {
            cursor: pointer;
          }
          .review-card {
            margin-top: 20px;
            padding: 20px;
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
          }
          .share-icons {
            display: flex;
            justify-content: space-between;
            width: 150px;
          }
        `}</style>
      </div>
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}/api/content?category=Youtube-Thumbnails-Generator&language=${locale}`;


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
      url: `${protocol}://${host}/tools/youtube-thumbnail`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
       
        ...(await serverSideTranslations(locale, ['common','thumbnail','navbar','footer'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        relatedTools: [],
        ...(await serverSideTranslations(locale, ['common', 'thumbnail','navbar','footer'])),
      },
    };
  }
}

export default YtThumbnailDw;
