import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaReddit,
  FaDigg,
  FaHeart,
  FaComment,
  FaEye,
  FaStar,
} from "react-icons/fa";
import Link from "next/link";
import { useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import StarRating from "./StarRating";
import Slider from "react-slick";

const TrendingVideos = () => {
  const [country, setCountry] = useState("All");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const { user, updateUserProfile } = useAuth();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const recaptchaRef = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
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
  const [modalVisable, setModalVisable] = useState(true);
  const closeModal = () => {
    setModalVisable(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=trendingVideos`);
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

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=trendingVideos");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

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
          tool: "trendingVideos",
          ...newReview,
          userProfile: user?.profileImage || "", // Assuming user has a profileImage property
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 0, comment: "", userProfile: "" });
      fetchReviews(); // Refresh the reviews
    } catch (error) {
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

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`https://restcountries.com/v3.1/all`);
        const countryData = response.data.map((country) => ({
          code: country.cca2,
          name: country.name.common,
        }));
        setCountries([{ code: "All", name: "All" }, ...countryData]);
      } catch (error) {
        console.error("Error fetching countries:", error.message);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/trending", {
          params: { country, category: "0" },
        });
        const categoryData = response.data.categories;
        const categoryOptions = Object.entries(categoryData).map(
          ([id, title]) => ({
            id,
            title,
          })
        );
        setCategories([{ id: "All", title: "All" }, ...categoryOptions]);
      } catch (error) {
        console.error("Error fetching video categories:", error.message);
      }
    };

    if (country !== "All") {
      fetchCategories();
    } else {
      setCategories([{ id: "All", title: "All" }]);
    }
  }, [country]);

  const fetchTrendingVideos = async () => {
    if (
      user &&
      user.paymentStatus !== "success" &&
      user.role !== "admin" &&
      generateCount <= 0
    ) {
      toast.error(
        "You have reached the limit of generating tags. Please upgrade your plan for unlimited use."
      );
      return;
    }
    setLoading(true);
   
    try {
      const response = await axios.get("/api/trending", {
        params: { country, category },
      });
      setVideos(response.data.videos);
    } catch (error) {
      console.error("Error fetching trending videos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker"
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
          content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker"
        />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Head>
      {/* Toast container for notifications */}
      <ToastContainer />
      {/* Page title */}

      {/* Alert message for logged in/out users */}
      {modalVisable && (
        <div
          className=" bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3 z-50"
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
                user.paymentStatus === "success" || user.role === "admin" ? (
                  <p className="text-center p-3 alert-warning">
                    Congratulations!! Now you can generate unlimited tags.
                  </p>
                ) : (
                  <p className="text-center p-3 alert-warning">
                    You are not upgraded. You can generate Title{" "}
                    {5 - generateCount} more times.{" "}
                    <Link href="/pricing" className="btn btn-warning ms-3">
                      Upgrade
                    </Link>
                  </p>
                )
              ) : (
                <p className="text-center p-3 alert-warning">
                  Please payment in to use this tool.
                </p>
              )}
            </div>
            <button className="text-yellow-700 ml-auto" onClick={closeModal}>
              ×
            </button>
          </div>
        </div>
      )}
      <div className="border shadow-sm  rounded p-2">
        <h1 className="text-center">YouTube Trending Videos</h1>
        <div className="flex items-center  justify-center center w-full sm:w-3/4 space-x-4 mb-4 mt-5">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border p-2 rounded w-1/3"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 rounded w-1/3"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
          <button
            onClick={fetchTrendingVideos}
            className="bg-red-500 text-white p-2 rounded w-1/3"
          >
            Get Your Trends
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <span className="mr-2">Share:</span>
          <FaFacebook className="mx-1 text-blue-600 cursor-pointer" />
          <FaTwitter className="mx-1 text-blue-400 cursor-pointer" />
          <FaLinkedin className="mx-1 text-blue-700 cursor-pointer" />
          <FaReddit className="mx-1 text-orange-500 cursor-pointer" />
          <FaDigg className="mx-1 text-blue-600 cursor-pointer" />
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {videos.map((video) => (
              <div
                key={video.videoId}
                className="border rounded-lg shadow-md p-4"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="mb-4 rounded-lg"
                />
                <h3 className="text-lg font-bold mb-2">
                  <Link
                    className="text-black"
                    target="_blank"
                    href={`https://www.youtube.com/watch?v=${video?.videoId}`}
                  >
                    {" "}
                    {video.title}
                  </Link>
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Uploaded By:{" "}
                  <span className="font-medium">{video.channel}</span> on{" "}
                  {new Date(video.uploadedAt).toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  Category:{" "}
                  <span className="font-medium">{video.category}</span>
                </p>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center text-red-500">
                    <FaHeart className="mr-1" />
                    <span>{video.likes}</span>
                  </div>
                  <div className="flex items-center text-blue-500">
                    <FaComment className="mr-1" />
                    <span>{video.comments}</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <FaEye className="mr-1" />
                    <span>{video.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
       <div className="content pt-6 pb-5">
        <div
          dangerouslySetInnerHTML={{ __html: existingContent }}
          style={{ listStyleType: "none" }}
        ></div>
      </div>
       {/* Review Form */}
       {user && (
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
      {/* Reviews Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5">
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
      <div className="review-card pb-5">
        <Slider {...settings}>
          {reviews.map((review, index) => (
            <div key={index} className="p-4 bg-white shadow rounded-lg mt-5">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((star, i) => (
                  <FaStar
                    key={i}
                    size={24}
                    color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                  />
                ))}
                <span className="ml-2 text-xl font-bold">
                  {review.rating.toFixed(1)}
                </span>
              </div>
              <div>
                <p className="text-gray-600 text-right me-auto">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-lg font-semibold">{review.comment}</p>
              <p className="text-gray-600">- {review.name}</p>
              {review.userProfile && (
                <img
                  src={review.userProfile}
                  alt="User Profile"
                  className="w-12 h-12 rounded-full mt-2"
                />
              )}
            </div>
          ))}
        </Slider>
        </div>
    </div>
  );
};

export default TrendingVideos;
