import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import StarRating from "./StarRating";
import Link from "next/link";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { i18n } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const YouTubeMoneyCalculator = ({ meta, faqs }) => {
  const { t } = useTranslation('calculator');
  const [dailyViews, setDailyViews] = useState(0);
  const { user, updateUserProfile, logout } = useAuth();
  const [translations, setTranslations] = useState([]);
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [relatedTools,setRelatedTools]=useState([])
  const [reviews, setReviews] = useState([]);
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

  const [minCPM, setMinCPM] = useState(0.15);
  const [maxCPM, setMaxCPM] = useState(4.8);

  const calculateEarnings = (views, rate) => {
    return (views / 1000) * rate;
  };

  const dailyEarnings = {
    min: calculateEarnings(dailyViews, minCPM),
    max: calculateEarnings(dailyViews, maxCPM),
  };
  const monthlyEarnings = {
    min: dailyEarnings.min * 30,
    max: dailyEarnings.max * 30,
  };
  const yearlyEarnings = {
    min: dailyEarnings.min * 365,
    max: dailyEarnings.max * 365,
  };
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(`/api/content?category=YouTube-Money-Calculator&language=${language}`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data.translations[language]?.content || "");
        setExistingContent(data.translations[language]?.content || "");  
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

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        "/api/reviews?tool=YouTube-Money-Calculator"
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
          tool: "YouTube-Money-Calculator",
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
        <div className="max-w-7xl mx-auto p-4">
       
       
          <ToastContainer />
          <div className="container mx-auto p-4">
            <div className="bg-white shadow-md rounded-lg max-w-4xl mx-auto p-5">
              <h1 className="text-center text-3xl font-bold">
                {t("YouTube Money Calculator")}
              </h1>
              <p className="text-center text-lg">
                {t('Check How Much Money Do YouTubers Make?')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">
                     {t('Daily Views')}
                    </label>
                    <input
                      type="number"
                      className="border rounded w-full py-2 px-3 text-gray-700"
                      value={dailyViews}
                      onChange={(e) => setDailyViews(Number(e.target.value))}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">
                      {t('Estimated CPM')}
                    </label>
                    <div>
                      <span className="whitespace-nowrap">
                        ${minCPM.toFixed(2)} {t('USD')}
                      </span>
                      _____{" "}
                      <span className="whitespace-nowrap">
                        ${maxCPM.toFixed(2)}{t('USD')}
                      </span>
                      <div>
                        <input
                          type="range"
                          min="0.15"
                          max="4.80"
                          step="0.01"
                          value={minCPM}
                          onChange={(e) => setMinCPM(Number(e.target.value))}
                          className="mx-2 flex-1"
                        />
                      </div>
                      <div>
                        <input
                          type="range"
                          min="0.15"
                          max="4.80"
                          step="0.01"
                          value={maxCPM}
                          onChange={(e) => setMaxCPM(Number(e.target.value))}
                          className="mx-2 flex-1"
                        />
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                     {t('Note: The accepted formula that Social Blade LLC uses to calculate the CPM range is $0.15 USD - $4.80 USD.')}
                    </p>
                    <p className="text-gray-500 text-sm">
                    {t('Note: The range fluctuates this much because many factors come into play when calculating a CPM. Quality of traffic, source country, niche type of video, price of specific ads, adblock, the actual click rate, etc.')}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">{t('Estimated Earnings')}</h3>
                  <div className="text-green-500">
                    <p>
                      {t('Estimated Daily Earnings:')} ${dailyEarnings.min.toFixed(2)}{" "}
                      - ${dailyEarnings.max.toFixed(2)}
                    </p>
                    <p>
                     {t('Estimated Monthly Earnings:')} $
                      {monthlyEarnings.min.toFixed(2)} - $
                      {monthlyEarnings.max.toFixed(2)}
                    </p>
                    <p>
                     {t('Estimated Yearly Projection:')} $
                      {yearlyEarnings.min.toFixed(2)} - $
                      {yearlyEarnings.max.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
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
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 mb-4"
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
        <style>
          {`
            .keywords-input {
              border: 2px solid #ccc;
              padding: 5px;
              border-radius: 10px;
              display: flex;
              align-items: flex-start;
              flex-wrap: wrap;
              min-height: 100px;
              margin: auto;
              width: 50%;
            }
            .content {
              color: #333;
              font-size: 16px;
              line-height: 1.6;
            }
            .keywords-input input {
              flex: 1;
              border: none;
              height: 100px;
              font-size: 14px;
              padding: 4px 8px;
              width: 50%;
            }
            .keywords-input .tag {
              width: auto;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff !important;
              padding: 0 8px;
              font-size: 14px;
              list-style: none;
              border-radius: 6px;
              background-color: #0d6efd;
              margin-right: 8px;
              margin-bottom: 8px;
            }
            .tags {
              display: flex;
              flex-wrap: wrap;
              margin-right: 8px;
            }
            .tag,
            .generated-tag {
              display: flex;
              align-items: center;
              color: #000000 !important;
              border-radius: 6px;
              padding: 5px 10px;
              margin-right: 5px;
              margin-bottom: 5px;
            }
            .remove-btn {
              margin-left: 8px;
              cursor: pointer;
            }
            input:focus {
              outline: none;
            }
            @media (max-width: 600px) {
              .keywords-input,
              .center {
                width: 100%;
              }
              .btn {
                width: 100%;
                margin-top: 10px;
              }
            }
            .generated-tags-display {
              background-color: #f2f2f2;
              border-radius: 8px;
              padding: 10px;
              margin-top: 20px;
            }
          `}
        </style>
      </div>
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : 'http';
  const apiUrl = `${protocol}://${host}/api/content?category=YouTube-Money-Calculator&language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content");
    }

    const contentData = await contentResponse.json();

    if (!contentData.translations || !contentData.translations[locale]) {
      throw new Error("Invalid content data format");
    }

    const meta = {
      title: contentData.translations[locale]?.title || "",
      description: contentData.translations[locale]?.description || "",
      image: contentData.translations[locale]?.image || "",
      url: `${protocol}://${host}/tools/youtube-money-calculator`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
        ...(await serverSideTranslations(locale, ['common', 'calculator', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        meta: {},
        faqs: [],
        ...(await serverSideTranslations(locale, ['common', 'calculator', 'navbar', 'footer'])),
      },
    };
  }
}

export default YouTubeMoneyCalculator;
