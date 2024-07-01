import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import { ToastContainer, toast } from 'react-toastify';
import { FaStar } from 'react-icons/fa';
import Slider from 'react-slick';
import StarRating from './StarRating';
import Link from 'next/link';
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
const rpmCpmRates = {
  "Low Shorts RPM": { rpm: 0.01, cpm: 0.02 },
  "Typical Shorts RPM": { rpm: 0.05, cpm: 0.09 },
  "High Shorts RPM": { rpm: 0.08, cpm: 0.15 },
  "Music": { rpm: 0.75, cpm: 1.36 },
  "Entertainment / Pets & Animals": { rpm: 1.00, cpm: 1.82 },
  "Gaming": { rpm: 2.50, cpm: 4.55 },
  "People & Blogs / How To & Style": { rpm: 3.50, cpm: 6.36 },
  "Education": { rpm: 5.00, cpm: 9.09 },
  "Digital Marketing / Finance (lower bound)": { rpm: 8.00, cpm: 14.55 },
  "Digital Marketing / Finance (upper bound)": { rpm: 20.00, cpm: 36.36 },
};

const categories = Object.keys(rpmCpmRates);

const YouTubeMoneyCalculator = () => {
  const [dailyViews, setDailyViews] = useState(0);
  const [category, setCategory] = useState(categories[0]);
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
        const response = await fetch(`/api/content?category=YouTube-Money-Calculator`);
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
      const response = await fetch("/api/reviews?tool=YouTube-Money-Calculator");
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
          tool: "YouTube-Money-Calculator",
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

  const calculateEarnings = (views, rate) => {
    return (views / 1000) * rate;
  };

  const selectedRates = rpmCpmRates[category];
  const dailyEarnings = {
    min: calculateEarnings(dailyViews, selectedRates.rpm),
    max: calculateEarnings(dailyViews, selectedRates.cpm),
  };
  const monthlyEarnings = {
    min: dailyEarnings.min * 30,
    max: dailyEarnings.max * 30,
  };
  const yearlyEarnings = {
    min: dailyEarnings.min * 365,
    max: dailyEarnings.max * 365,
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
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
      <ToastContainer />
      <div className="bg-white shadow-md rounded-lg max-w-4xl mx-auto p-5">
        <h1 className='text-center'>YouTube Money Calculator</h1>
        <p className='text-center'>Check How Much Money Do YouTubers Make?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Daily Views</label>
              <input
                type="number"
                className="border rounded w-full py-2 px-3 text-gray-700"
                value={dailyViews}
                onChange={(e) => setDailyViews(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border p-2 rounded w-full"
              >
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
          
            <h3 className="text-xl font-bold mb-4">Estimated Earnings</h3>
            <div className="text-red-500">
              <p>Estimated Daily Earnings: ${dailyEarnings.min.toFixed(2)} - ${dailyEarnings.max.toFixed(2)}</p>
              <p>Estimated Monthly Earnings: ${monthlyEarnings.min.toFixed(2)} - ${monthlyEarnings.max.toFixed(2)}</p>
              <p>Estimated Yearly Projected: ${yearlyEarnings.min.toFixed(2)} - ${yearlyEarnings.max.toFixed(2)}</p>
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
      <style jsx>
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

export default YouTubeMoneyCalculator;
