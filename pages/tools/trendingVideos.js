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
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import StarRating from "./StarRating";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";

const TrendingVideos = ({ meta }) => {
  const [country, setCountry] = useState("All");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const { user, updateUserProfile } = useAuth();
  const [generateCount, setGenerateCount] = useState(0);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState([]);

  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);

  const closeModal = () => {
    setModalVisible(false);
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
      const response = await fetch("/api/reviews?tool=trendingVideos");
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
          tool: "trendingVideos",
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
    if (!user) {
      toast.error("Please log in to fetch trending videos.");
      return;
    }

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

      if (user && user.paymentStatus !== "success") {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      console.error("Error fetching trending videos:", error.message);
    } finally {
      setLoading(false);
    }
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
          {/* Toast container for notifications */}
          <ToastContainer />
          {/* Page title */}
          
          {/* Alert message for logged in/out users */}
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
                        Congratulations! Now you can get unlimited Trending Video.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can get Trending Video{" "}
                        {5 - generateCount} more times.{" "}
                        <Link href="/pricing" className="btn btn-warning ms-3">
                          Upgrade
                        </Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      Please <Link href="/login">log</Link> in to fetch channel data.
                    </p>
                  )}
                </div>
                <button className="text-yellow-700 ml-auto" onClick={closeModal}>
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="border shadow-sm rounded p-5 bg-light">
            <h1 className="text-center">YouTube Trending Videos</h1>
            <div className="flex items-center justify-center center w-full sm:w-3/4 space-x-4 mb-4 mt-5">
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
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
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
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    className="mb-4 rounded-lg"
                    width={400}
                    height={400}
                  />
                  <h3 className="text-lg font-bold mb-2">
                    <Link
                      className="text-black"
                      target="_blank"
                      href={`https://www.youtube.com/watch?v=${video?.videoId}`}
                    >
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

export async function getServerSideProps(context) {
  const { req } = context;
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const apiUrl = `${protocol}://${host}`;

  const response = await fetch(`${apiUrl}/api/content?category=tagExtractor`);
  const data = await response.json();

  const meta = {
    title: data[0]?.title || "",
    description: data[0]?.description || "",
    image: data[0]?.image || "",
    url: `${apiUrl}/tools/tagExtractor`,
  };

  return {
    props: {
      meta,
    },
  };
}

export default TrendingVideos;
