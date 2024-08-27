import { useEffect, useState } from "react";
import { FaCopy, FaStar } from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { i18n } from "next-i18next";
import Script from "next/script";
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx'
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const KeywordSearch = ({ meta, faqs, relatedTools, existingContent }) => {
  const [keyword, setKeyword] = useState("");
  const [relatedKeywords, setRelatedKeywords] = useState(null);
  const [googleSuggestionKeywords, setGoogleSuggestionKeywords] = useState(null);
  const [country, setCountry] = useState({ value: 'us', label: 'United States' }); // Default country set to 'us'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, updateUserProfile } = useAuth();
  const [generateCount, setGenerateCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isUpdated, setIsUpdated] = useState(false);
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
  const [translations, setTranslations] = useState([]);
  const { t } = useTranslation('keyword');
  const countryOptions = countryList().getData(); // Get the country list
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
        const response = await fetch(
          `/api/content?category=keyword-research&language=${language}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setTranslations(data.translations);
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to load content.");
      }
    };

    fetchContent(i18n.language);
    fetchReviews(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true)).catch(err => console.error("Error updating user profile:", err));
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

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=keyword-research");
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"),
      }));
      setReviews(formattedData);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError("Failed to load reviews.");
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
          tool: "keyword-research",
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

  const closeModal = () => {
    setModalVisible(false);
  };

  const fetchKeywordData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/getKeywordData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, country: country.value }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error: ${res.status} ${errorText}`);
      }

      const result = await res.json();
      setRelatedKeywords(result.relatedKeywords); // Set related keywords data
      setGoogleSuggestionKeywords(result.googleSuggestionKeywords); // Set Google suggestions data
      setError(null);
    } catch (err) {
      setError(err.message);
      setRelatedKeywords(null);
      setGoogleSuggestionKeywords(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allKeywords = [...(relatedKeywords || []), ...(googleSuggestionKeywords || [])];


  const downloadCSV = () => {
    const csvData = [
      ['Keyword', 'Volume', 'CPC', 'Competition', 'Country'],
      ...[...relatedKeywords, ...googleSuggestionKeywords].map(item => [
        item.keyword,
        item.volume,
        `$${item.cpc.value}`,
        item.competition,
        item.country,
      ]),
    ];

    const csvContent = `data:text/csv;charset=utf-8,${csvData.map(e => e.join(',')).join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'keyword_data.csv');
    document.body.appendChild(link);
    link.click();
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([...relatedKeywords, ...googleSuggestionKeywords]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Keywords');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'keyword_data.xlsx');
  };

  const copyToClipboard = () => {
    const copyText = [...relatedKeywords, ...googleSuggestionKeywords].map(item =>
      `${item.keyword}, Volume: ${item.volume}, CPC: $${item.cpc.value}, Competition: ${item.competition}, Country: ${item.country}`
    ).join('\n');

    navigator.clipboard.writeText(copyText).then(() => {
      alert('Keywords copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy keywords.');
    });
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
                hrefLang={lang}
              />
            ))}
          </Head>

          <h2 className="text-3xl pt-5 text-white">{t('YouTube Keyword Research')}</h2>
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
                        {t("Congratulations!! Now you can pick unlimited keywords.")}
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        {t("You are not upgraded. You can Keyword Research {{remainingGenerations}} more times.", { remainingGenerations: 5 - generateCount })}{" "}
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
        
        <div className="flex flex-col sm:flex-row items-center mb-4 w-full sm:w-2/3 mx-auto">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword"
              className="w-full p-2 mb-2 sm:mb-0 sm:mr-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Select
              options={countryOptions}
              value={country}
              onChange={setCountry}
              className="w-full sm:w-1/2 p-2 mb-2 sm:mb-0  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              styles={{
                control: (base) => ({
                  ...base,
                  height: '100%',
                  minHeight: '50px',
                  borderRadius: '8px',
                  borderColor: '#D1D5DB',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#2563EB',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '8px',
                  marginTop: '5px',
                }),
              }}
            />
            <button
              onClick={fetchKeywordData}
              className="w-full sm:w-auto sm:mt-0 sm:ml-4 ps-5 pe-5 pt-2 pb-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Search
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center">
              <ClipLoader color="#3b82f6" loading={loading} size={50} />
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
      {allKeywords && !loading && allKeywords.length > 0 && (
        
            <div className="overflow-x-auto">
                 <div className="flex justify-end mt-4">
                <button
                  onClick={downloadCSV}
                  className="p-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 mr-2"
                >
                  Download CSV
                </button>
                <button
                  onClick={downloadExcel}
                  className="p-2 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 mr-2"
                >
                  Download Excel
                </button>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  Copy All
                </button>
              </div>
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b">Keyword</th>
                    <th className="px-4 py-2 border-b">Volume</th>
                    <th className="px-4 py-2 border-b">CPC</th>
                    <th className="px-4 py-2 border-b">Competition</th>
                    <th className="px-4 py-2 border-b">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeywords.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="px-4 py-2 border-b">{item.keyword}</td>
                      <td className="px-4 py-2 border-b">{item.volume}</td>
                      <td className="px-4 py-2 border-b">${item.cpc.value}</td>
                      <td className="px-4 py-2 border-b">{item.competition}</td>
                      <td className="px-4 py-2 border-b">{item.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          )}
        

        


<div className="content pt-6 pb-5">
          <article
            dangerouslySetInnerHTML={{ __html: existingContent }}
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
                    className={`accordion-header ${
                      openIndex === index ? "active" : ""
                    }`}
                    onClick={() => toggleFAQ(index)}
                  >
                    {faq.question}
                  </a>
                  <a
                    href={`#accordion-${index}`}
                    id={`close-accordion-${index}`}
                    className={`accordion-header ${
                      openIndex === index ? "active" : ""
                    }`}
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
                        Verified Purchase
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
                onClick={closeReviewForm}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        )}
        {/* Related Tools Section */}
        <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-5 text-center">{t("Related Tools")}</h2>
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
                  className="w-14 h-14 mr-4"
                />
                <span className="text-blue-600 font-medium">{tool.name}</span>
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
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : 'http';
  const apiUrl = `${protocol}://${host}/api/content?category=keyword-research&language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error('Failed to fetch content');
    }

    const contentData = await contentResponse.json();
    const meta = {
      title: contentData.translations[locale]?.title || '',
      description: contentData.translations[locale]?.description || '',
      image: contentData.translations[locale]?.image || '',
      url: `${protocol}://${host}/tools/keyword-research`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
        relatedTools: contentData.translations[locale]?.relatedTools || [],
        existingContent: contentData.translations[locale]?.content || '',
        ...(await serverSideTranslations(locale, ['keyword', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        meta: {},
        faqs: [],
        relatedTools: [],
        existingContent: '',
        ...(await serverSideTranslations(locale, ['keyword', 'navbar', 'footer'])),
      },
    };
  }
}


export default KeywordSearch;
