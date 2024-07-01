// /components/KeywordSearch.js

import { useEffect, useState } from 'react';
import { FaCopy, FaStar } from 'react-icons/fa';
import ClipLoader from 'react-spinners/ClipLoader';
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import { ToastContainer, toast } from 'react-toastify';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from './StarRating';
const KeywordSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, updateUserProfile, logout } = useAuth();
  const [generateCount, setGenerateCount] = useState(0);
  const [meta, setMeta] = useState({ title: "", description: "", image: "" });
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
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=keyword-research`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || ""); // Ensure content is not undefined
        setExistingContent(data[0]?.content || ""); // Ensure existing content is not undefined
        setMeta(data[0]);
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (user && user.paymentStatus !== "success" && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem('generateCount'), 10) || 0;
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
      const data = await response.json();
      setReviews(data);
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
          tool: "keyword-research",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 0, comment: "", userProfile: "", userName: "" });
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

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 2,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
    ],
  };





  const closeModal = () => {
    setModalVisible(false);
  };


  const fetchKeywordData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/getKeywordData?keyword=${keyword}&country=${country}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error: ${res.status} ${errorText}`);
      }
      const result = await res.json();
      setData(result.slice(0, 15)); // Limit to top 15 results
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
      console.error(err); // Log the error to the console
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Keyword copied to clipboard!');
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
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content={meta.image} />
        <meta
          property="twitter:domain"
          content="https://youtube-tool-frontend.vercel.app/"
        />
        <meta
          property="twitter:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Head>
      <h2 className="text-3xl pt-5 text-white">YouTube Keyword Research</h2>
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
                        Congratulations! Now you can  unlimited Keyword Research.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can  Keyword Research{" "}
                        {5 - generateCount} more times.{" "}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          Upgrade
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      Please log in to fetch channel data.
                    </p>
                  )}
                </div>
                <button className="text-yellow-700 ml-auto" onClick={closeModal}>
                  ×
                </button>
              </div>
            </div>
          )}
      <div className="mb-4 center w-full sm:w-2/3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter a keyword"
          className="p-2 m-2 border border-gray-300 rounded mr-2"
        />
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Enter a country code"
          className="p-2 m-2 border md:mt-2 border-gray-300 rounded mr-2"
        />
        <button onClick={fetchKeywordData} className="p-2 sm:mt-3 bg-red-500 text-white rounded">
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
      {data && !loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Keyword</th>
                <th className="px-4 py-2 border-b">CPC</th>
                <th className="px-4 py-2 border-b">Volume</th>
                <th className="px-4 py-2 border-b">Competition</th>
                <th className="px-4 py-2 border-b">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b flex items-center">
                    {item.text}
                    <FaCopy
                      className="ml-2 cursor-pointer text-blue-500"
                      onClick={() => copyToClipboard(item.text)}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">{item.cpc}</td>
                  <td className="px-4 py-2 border-b">{item.vol}</td>
                  <td className="px-4 py-2 border-b">{item.competition}</td>
                  <td className="px-4 py-2 border-b">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       <div className="content pt-6 pb-5">
          <div
            dangerouslySetInnerHTML={{ __html: existingContent }}
            style={{ listStyleType: "none" }}
          ></div>
        </div>
     

       {/* Reviews Section */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5 border shadow p-5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center">
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

        {/* Review Form Toggle */}
        {user && !showReviewForm && (
          <button
            className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
            onClick={() => setShowReviewForm(true)}
          >
            Add Review
          </button>
        )}

        {/* Review Form */}
        {user && showReviewForm && (
          <div className="mt-8 review-card">
            <h2 className="text-2xl font-semibold mb-4">Leave a Review</h2>
            <div className="mb-4">
              <StarRating
                rating={newReview.rating}
                setRating={(rating) => setNewReview({ ...newReview, rating })}
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
          </div>
        )}

        <div className="review-card pb-5">
          <Slider {...settings}>
            {reviews.map((review, index) => (
              <div key={index} className="p-6 bg-white shadow-lg rounded-lg relative mt-5 max-w-sm mx-auto">
                <div className="flex justify-center">
                  <Image
                    src={`data:image/jpeg;base64,${review?.userProfile}`}
                    alt={review.name}
                    className="w-16 h-16 rounded-full -mt-12 border-2 border-white"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="mt-6 text-center">
                  <p className="text-lg italic text-gray-700 mb-4">
                    “{review.comment}”
                  </p>
                  <h3 className="text-xl font-bold text-gray-800">{review.name}</h3>
                  <p className="text-sm text-gray-500">User</p>
                  <div className="flex justify-center mt-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        size={24}
                        color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold mt-2">{review.rating.toFixed(1)}</span>
                </div>
                <div className="absolute top-2 left-2 text-red-600 text-7xl">“</div>
                <div className="absolute bottom-2 right-2 text-red-600 text-7xl">”</div>
              </div>
            ))}
          </Slider>
        </div>
    </div>
  </>
  );
};

export default KeywordSearch;
