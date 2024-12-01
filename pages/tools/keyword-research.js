import { useEffect, useState } from "react";
import { FaCopy, FaStar, FaThumbsUp, FaThumbsDown, FaBookmark, FaFlag } from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
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
import * as XLSX from 'xlsx';
import { useRouter } from "next/navigation";
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const KeywordSearch = ({ initialMeta,meta, faqList, tools, content, reactions,hreflangs  }) => {
  const router = useRouter();

  
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
  const { t } = useTranslation('keyword');
  const countryOptions = countryList().getData(); // Get the country list
  const [likes, setLikes] = useState(reactions.likes || 0);
  const [unlikes, setUnlikes] = useState(reactions.unlikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasUnliked, setHasUnliked] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language = i18n.language;
       

        // Add Authorization header if the token is available
        const response = await fetch(
          `/api/content?category=keyword-research&language=${language}`,
          {
            method: 'GET',  // or 'POST' depending on your API
            headers: {
              'Content-Type': 'application/json',
              'Authorization':`Bearer AZ-fc905a5a5ae08609ba38b046ecc8ef00`  // Add token to the header
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }

        const data = await response.json();
        setLikes(data.reactions.likes || 0);
        setUnlikes(data.reactions.unlikes || 0);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchContent();
    // If there's a reviews fetching function, you can call it similarly:
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

    if (user) {
      const userAction = reactions.users?.[user.email];
      if (userAction === "like") {
        setHasLiked(true);
      } else if (userAction === "unlike") {
        setHasUnliked(true);
      } else if (userAction === "report") {
        setHasReported(true);
      }
    }

    // Check if data is already saved
    const savedTools = JSON.parse(localStorage.getItem('savedTools') || '[]');
    setIsSaved(savedTools.some(tool => tool.toolUrl === window.location.href));
  }, [user, reactions.users]);

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
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
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
    }

    // Check if data is already saved
    const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    
    setIsSaved(savedChannels.some(channel => channel.toolUrl === window.location.href));
  }, [user, reactions.users]);
  const handleReaction = async (action) => {
    if (!user) {
      toast.error('Please log in to react.');
      return;
    }

    try {
      const response = await fetch('/api/reactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'keyword-research', // Replace with appropriate category
          userId: user.email,
          action,
          reportText: action === 'report' ? reportText : null, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update reaction');
      }

      const updatedData = await response.json();
      setLikes(updatedData.reactions.likes || 0);
      setUnlikes(updatedData.reactions.unlikes || 0);

      if (action === 'like') {
        if (hasLiked) {
          toast.error('You have already liked this.');
        } else {
          setHasLiked(true);
          setHasUnliked(false);
          toast.success('You liked this content.');
        }
      } else if (action === 'unlike') {
        if (hasUnliked) {
          setHasUnliked(false);
          toast.success('You removed your dislike.');
        } else {
          setHasLiked(false);
          setHasUnliked(true);
          toast.success('You disliked this content.');
        }
      } else if (action === 'report') {
        if (hasReported) {
          toast.error('You have already reported this.');
        } else {
          setHasReported(true);
          toast.success('You have reported this content.');
        }
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      toast.error(error.message);
    }
  };

  const saveChannel = () => {
    const savedChannels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    const currentTool = {
      toolName: "YouTube Keyword Research", // Name of the current tool
      toolUrl: window.location.href, // Current URL of the tool
    };
    
    if (!isSaved) {
      savedChannels.push(currentTool);
      localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
      setIsSaved(true);
      toast.success("Tool saved successfully!");
    } else {
      const updatedChannels = savedChannels.filter(channel => channel.toolUrl !== currentTool.toolUrl);
      localStorage.setItem('savedChannels', JSON.stringify(updatedChannels));
      setIsSaved(false);
      toast.success("Tool removed from saved list.");
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

  // Button color logic
  const likeButtonColor = hasLiked ? "#4CAF50" : "#ccc"; // Green if liked
  const unlikeButtonColor = hasUnliked ? "#F44336" : "#ccc"; // Red if disliked
  const reportButtonColor = hasReported ? "#FFD700" : "#ccc"; // Yellow if reported
  const saveButtonColor = isSaved ? "#FFD700" : "#ccc";

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
          {/* SEO Meta Tags */}
          <title>{initialMeta?.title}</title>
          <meta name="description" content={initialMeta?.description} />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="robots" content="index, follow" />

          {/* Canonical URL */}
          <link rel="canonical" href={`${initialMeta?.url}`} />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:url"  content={`${initialMeta?.url}`}/>
          <meta property="og:title" content={initialMeta?.title} />
          <meta property="og:description" content={initialMeta?.description} />
          <meta property="og:image" content={initialMeta?.image} />
          <meta property="og:image:secure_url" content={initialMeta?.image} />
          <meta property="og:site_name" content="Ytubetools" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta
              name="twitter:domain"
              content={meta?.url
                .toLowerCase()
                .replace("tools/keyword-research", "")}
            />
          <meta property="twitter:url" content={`${initialMeta?.url}`}/>
          <meta name="twitter:title" content={initialMeta?.title} />
          <meta name="twitter:description" content={initialMeta?.description} />
          <meta name="twitter:image" content={initialMeta?.image} />
          <meta name="twitter:site" content="@ytubetools" />
          <meta name="twitter:image:alt" content={initialMeta?.imageAlt} />

          {/* Alternate hreflang Tags for SEO */}
          {hreflangs &&
            hreflangs.map((hreflang, index) => (
              <link
                key={index}
                rel={hreflang.rel}
                hreflang={hreflang.hreflang}
                href={`${hreflang.href}`}
              />
            ))}
          {/* <link
            rel="alternate"
            hreflang="en"
            href={meta?.url?.replace(/\/$/, "").replace(/\/$/, "")}
          /> */}
        </Head>
  {/* JSON-LD Structured Data */}
  <Script id="webpage-keyword-research" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/keyword-research`,
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

<Script id="software-application-keyword-research" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta?.title,
    url: `${meta?.url}${i18n.language !== 'en' ? `/${i18n.language}` : ''}/tools/keyword-research`,
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

<Script id="faq-keyword-research" type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqList.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  })}
</Script>


          <h1 className="text-3xl pt-5 text-white">{t('YouTube Keyword Research')}</h1>
        
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
        <div className="shadow-md bg-white p-5 rounded">
        <ToastContainer />
       
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
          
            
          </div>
          <div className="flex justify-center mb-4">
          <button
  className="flex items-center justify-center p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-purple-400"
  type="button"
  id="button-addon2"
  onClick={fetchKeywordData}
  disabled={loading}
>
  {loading ? (
    <>
     <span className="animate-spin mr-2">
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
  >
    <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
  </svg>
</span>

      Loading...
    </>
  ) : (
    <>
     <span className="animate-spin mr-2">
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
  >
    <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path>
  </svg>
</span>


Search
    </>
  )}
</button>
</div>
          <div className="reaction-bar  flex items-center justify-between mt-4 p-2">
           <div className="flex items-center space-x-2 ps-5 mx-auto">
              <button
                onClick={() => handleReaction("like")}
                className="flex items-center space-x-1"
                style={{ color: likeButtonColor }}
              >
                <FaThumbsUp className="text-blue-600"/>
                <span>{likes}</span>
              </button>
              <button
                onClick={() => handleReaction("unlike")}
                className="flex items-center space-x-1"
                style={{ color: unlikeButtonColor }}
              >
                <FaThumbsDown className="text-red-400"/>
                <span>{unlikes}</span>
              </button>
            
              
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1"
                style={{ color: reportButtonColor }}
              >
                <FaFlag className="text-red-500"/>
                <span className="text-red-500">Report</span>
              </button>
              <button
                  onClick={saveChannel}
                  className="flex items-center space-x-1"
                  style={{ color: saveButtonColor }}
                >
                  {isSaved ? <FaBookmark /> : <FaBookmark />}
                </button>
              </div>
            
              
             
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
            dangerouslySetInnerHTML={{ __html: content }}
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
              {faqList?.map((faq, index) => (
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
            {tools.map((tool, index) => (
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
        {/* /* End of Related Tools Section */}
        </div>
    </>
  );
};

export async function getServerSideProps({ req, locale }) {
  // Extract protocol and host, fallback to defaults if necessary
  const protocol =
    req.headers["x-forwarded-proto"]?.split(",")[0] ||
    (req.connection?.encrypted ? "https" : "http") ||
    "https"; // fallback to https
  const host = req.headers.host || "your-default-domain.com"; // Ensure the host is correct
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || `${protocol}://${host}`;
  
  const contentApiUrl = `${baseUrl}/api/content?category=keyword-research&language=${locale}`;
  const headerApiUrl = `${baseUrl}/api/heading`;

  console.log("Fetching data from:", contentApiUrl); // Debugging: Log the request URL

  const AUTH_TOKEN = process.env.AUTH_TOKEN; // Authorization token from .env

  // Function to fetch with timeout
  const fetchWithTimeout = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Request timed out")), 5000); // Timeout after 5 seconds
      fetch(url, options)
        .then(response => {
          clearTimeout(timeout);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  };

  try {
    // Fetching both API data concurrently
    const [contentResponse, headerResponse] = await Promise.all([
      fetchWithTimeout(contentApiUrl, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' }
      }),
      fetchWithTimeout(headerApiUrl),
    ]);

    // If the response is OK, parse it, else use fallback data
    const contentData = contentResponse.ok ? await contentResponse.json() : { translations: {} };
  
    
    const headerData = headerResponse.ok ? await headerResponse.json() : [{ content: "" }];
    
    const headerContent = headerData[0]?.content || "";
    const localeData = contentData.translations?.[locale] || {};
    const translations = contentData.translations || {};

    // Prepare meta data for SEO or page title
    const meta = {
      title: localeData.title || "Default Title",
      description: localeData.description || "Default description",
      url: `${baseUrl}${locale === "en" ? "" : `/${locale}`}`,
      img: localeData.image || "Default Image",
    };


    // Hreflang for international SEO
    const hreflangs = [
      { rel: "alternate", hreflang: "x-default", href: baseUrl },
      { rel: "alternate", hreflang: "en", href: baseUrl },
      ...Object.keys(translations)
        .filter((lang) => lang !== "en")
        .map((lang) => ({
          rel: "alternate",
          hreflang: lang,
          href: `${baseUrl}/${lang}`,
        })),
    ];

    return {
      props: {
        initialMeta: meta,
        reactions: localeData.reactions || {
          likes: 0,
          unlikes: 0,
          reports: [],
          users: {},
        },
        content: localeData.content || "",
        faqList: localeData.faqs || [],
        tools: localeData.relatedTools || [],
        headerContent,
        translations,
        hreflangs,
        ...(await serverSideTranslations(locale, ["common", "navbar", "footer"])),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);

    // Return fallback props in case of error
    return {
      props: {
        initialMeta: {
          title: "Default Title",
          description: "Default description",
          url: `${baseUrl}${locale === "en" ? "" : `/${locale}`}`,
        },
        reactions: { likes: 0, unlikes: 0, reports: [], users: {} },
        content: "",
        faqList: [],
        tools: [],
        headerContent: "",
        translations: {},
        hreflangs: [
          { rel: "alternate", hreflang: "x-default", href: baseUrl },
          { rel: "alternate", hreflang: "en", href: baseUrl },
        ],
        ...(await serverSideTranslations(locale, ["common", "navbar", "footer"])),
      },
    };
  }
}


export default KeywordSearch;
