import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaShareAlt,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaCopy,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import Head from "next/head";
import { format } from "date-fns";
import { i18n, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Script from "next/script";
import dynamic from 'next/dynamic';
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });
const TitleDescriptionExtractor = ({ meta, faqs }) => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const { t } = useTranslation("tdextractor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generateCount, setGenerateCount] = useState(5);
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [translations, setTranslations] = useState([]);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [existingContent, setExistingContent] = useState("");
  const [modalVisible, setModalVisible] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [relatedTools, setRelatedTools] = useState([]);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const closeModal = () => {
    setModalVisible(false);
  };
  const closeReview = () => setShowReviewForm(false);
  const openReviewForm = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowReviewForm(true);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/content?category=youtube-title-and-description-extractor&language=${language}`);
        if (!response.ok) throw new Error(t("Failed to fetch content"));
        const data = await response.json();
        console.log(data);
        setExistingContent(data.translations[language]?.content || "");  
        setRelatedTools(data.translations[language]?.relatedTools || []);
        setTranslations(data.translations);
      } catch (error) {
        console.error(t("Error fetching content"));
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

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        "/api/reviews?tool=youtube-title-and-description-extractor"
      );
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"), // Format the date here
      }));
      setReviews(formattedData);
    } catch (error) {
      console.error(t("Failed to fetch reviews"), error);
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
          tool: "youtube-title-and-description-extractor",
          ...newReview,
          userProfile: user?.profileImage || "nai",
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
      console.error(t("Failed to submit review"), error);
      toast.error(t("Failed to submit review"));
    }
  };

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const fetchYouTubeData = async () => {
    if (generateCount <= 0) {
      toast.error(
        t(
          "You have reached the limit of generating titles. Please upgrade your plan for unlimited use."
        )
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tokensResponse = await fetch("/api/tokens");
      if (!tokensResponse.ok) throw new Error(t("Failed to fetch API tokens"));

      const tokens = await tokensResponse.json();
      const videoId = extractVideoId(videoUrl);
      let dataFetched = false;

      for (const { token } of tokens) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${token}`
          );

          if (response.data.items && response.data.items.length > 0) {
            const { title, description } = response.data.items[0].snippet;
            setTitle(title);
            setDescription(description);
            dataFetched = true;

            if (user && user.paymentStatus !== "success") {
              setGenerateCount((prev) => prev - 1);
            }
            break;
          } else {
            console.error(t("No video data found for the provided URL."));
          }
        } catch (error) {
          console.error(
            t(`Error fetching data with token ${token}:`),
            error.response?.data || error.message
          );
        }
      }

      if (!dataFetched) {
        throw new Error(t("All API tokens exhausted or failed to fetch data."));
      }
    } catch (error) {
      setError(t("Failed to fetch YouTube data. Please check the video URL."));
      console.error(t("Error:"), error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match && match[1]) return match[1];
    throw new Error(t("Invalid YouTube video URL"));
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(t("Copied to clipboard!")),
      (err) => toast.error(t("Failed to copy:"), err)
    );
  };

  const downloadText = (text, filename) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

  return (
    <>
      <div className="bg-box">
        <div>
          <Image className="shape1" src={announce} alt="announce" />
          <Image className="shape2" src={cloud} alt="cloud" />
          <Image className="shape3" src={cloud2} alt="cloud" />
          <Image className="shape4" src={chart} alt="chart" />
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

          <h2 className="text-3xl text-white">
            {t("YouTube Title & Description Extractor")}
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
                        {t("You can extract unlimited titles and descriptions")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You have not upgraded. You can generate")}{" "}
                        {5 - generateCount}{" "}
                        {t("more times.")}{" "}
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

          <div className="row justify-content-center pt-5">
            <div className="col-md-6">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("Enter YouTube Video URL...")}
                  aria-label="YouTube Video URL"
                  aria-describedby="button-addon2"
                  value={videoUrl}
                  onChange={handleUrlChange}
                />
                <button
                  className="btn btn-danger"
                  type="button"
                  id="button-addon2"
                  onClick={fetchYouTubeData}
                  disabled={loading}
                >
                  {loading ? t("Generating...") : t("Fetch YouTube Data")}
                </button>
              </div>
              <small className="text-white">
                {t("Example: https://www.youtube.com/watch?v=SMoeVy9g3a8")}
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
        {title && (
          <div className="mt-3">
            <h6 className="pt-3 fw-bold">{t("Title Found:")}</h6>
            <h3 className="border p-3">{title}</h3>
            <div className="pt-3">
              <button
                className="btn btn-danger me-2"
                onClick={() => copyToClipboard(title)}
              >
                <FaCopy />
              </button>
              <button
                className="btn btn-danger"
                onClick={() => downloadText(title, "title.txt")}
              >
                <FaDownload />
              </button>
            </div>
          </div>
        )}
        {description && (
          <div className="mt-3">
            <h6 className="pt-3 fw-bold">{t("Description Found:")}</h6>
            <p>{description}</p>
            <div className="pt-3">
              <button
                className="btn btn-danger me-2"
                onClick={() => copyToClipboard(description)}
              >
                <FaCopy />
              </button>
              <button
                className="btn btn-danger"
                onClick={() => downloadText(description, "description.txt")}
              >
                <FaDownload />
              </button>
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
        <div>
          <div className="row pt-3">
            <div className="col-md-4">
              <div className=" text-3xl font-bold mb-2">
                {t("Customer Reviews")}
              </div>
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
                        style={{
                          width: `${calculateRatingPercentage(rating)}%`,
                        }}
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
                      <span className="fw-bold mt-2 ms-2">
                        {review?.title}
                      </span>
                    </div>
                  </div>

                  <div className="text-gray-500 text-sm mb-4">
                    {t("Reviewed on")} {review.createdAt}
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
                          {t("Reviewed on")} {review?.createdAt}
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
                <h2 className="text-2xl font-semibold mb-4">
                  {t("Leave a Review")}
                </h2>
                <div className="mb-4">
                  <StarRating
                    rating={newReview.rating}
                    setRating={(rating) =>
                      setNewReview({ ...newReview, rating })
                    }
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                    placeholder={t("Review Title")}
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
                  onClick={closeReview}
                >
                  {t("Cancel")}
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
      </div>
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : 'http';
  const apiUrl = `${protocol}://${host}/api/content?category=youtube-title-and-description-extractor&language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await contentResponse.json();

    if (!contentData.translations || !contentData.translations[locale]) {
      throw new Error("Invalid content data format");
    }

    console.log(contentData);

    const meta = {
      title: contentData.translations[locale]?.title || "",
      description: contentData.translations[locale]?.description || "",
      image: contentData.translations[locale]?.image || "",
      url: `${protocol}://${host}/tools/youtube-title-and-description-extractor`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
        ...(await serverSideTranslations(locale, ['common', 'tdextractor', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        ...(await serverSideTranslations(locale, ['common', 'tdextractor', 'navbar', 'footer'])),
      },
    };
  }
}


export default TitleDescriptionExtractor;
