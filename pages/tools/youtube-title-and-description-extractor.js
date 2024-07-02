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
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import Head from "next/head";

const TitleDescriptionExtractor = ({ meta }) => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generateCount, setGenerateCount] = useState(5);
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [existingContent, setExistingContent] = useState("");
  const [modalVisible, setModalVisible] = useState(true);

  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=youtube-title-and-description-extractor`
        );
        if (!response.ok) throw new Error("Failed to fetch content");
        const data = await response.json();
        setExistingContent(data[0]?.content || "");
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
      const response = await fetch(
        "/api/reviews?tool=youtube-title-and-description-extractor"
      );
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
          tool: "youtube-title-and-description-extractor",
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

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const fetchYouTubeData = async () => {
    if (generateCount <= 0) {
      toast.error(
        "You have reached the limit of generating titles. Please upgrade your plan for unlimited use."
      );
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
            const { title, description } = response.data.items[0].snippet;
            setTitle(title);
            setDescription(description);
            dataFetched = true;

            if (user && user.paymentStatus !== "success") {
              setGenerateCount((prev) => prev - 1);
            }
            break;
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
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match && match[1]) return match[1];
    throw new Error("Invalid YouTube video URL");
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard!"),
      (err) => toast.error("Failed to copy:", err)
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
    return (ratingCount / totalReviews) * 100;
  };

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
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
          <h2 className="text-3xl text-white">
            YouTube Title & Description Extractor
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
                        Congratulations! Now you can generate unlimited Titles.
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can generate titles{" "}
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
                  placeholder="Enter YouTube Video URL..."
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
                  {loading ? "Loading..." : "Fetch YouTube Data"}
                </button>
              </div>
              <small className="text-white">
                Example: https://www.youtube.com/watch?v=SMoeVy9g3a8
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
            <h6 className="pt-3 fw-bold">Title Found:</h6>
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
            <h6 className="pt-3 fw-bold">Description Found:</h6>
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
        <div>
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
                <div
                  key={index}
                  className="p-6 bg-white shadow-lg rounded-lg relative mt-5 max-w-sm mx-auto"
                >
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
                    <h3 className="text-xl font-bold text-gray-800">
                      {review.name}
                    </h3>
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
                    <span className="text-xl font-bold mt-2">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 text-red-600 text-7xl">
                    “
                  </div>
                  <div className="absolute bottom-2 right-2 text-red-600 text-7xl">
                    ”
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const { req } = context;
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const apiUrl = `${protocol}://${host}`;

  const response = await fetch(`${apiUrl}/api/content?category=youtube-title-and-description-extractor`);
  const data = await response.json();

  const meta = {
    title: data[0]?.title || "",
    description: data[0]?.description || "",
    image: data[0]?.image || "",
  };

  return { props: { meta } };
}

export default TitleDescriptionExtractor;
