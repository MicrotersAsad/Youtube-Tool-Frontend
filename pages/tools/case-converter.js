import React, { useEffect, useRef, useState } from 'react';
import { FaCopy, FaStar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import StarRating from "./StarRating";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import Link from 'next/link';
const CaseConverter = () => {
  const [inputText, setInputText] = useState(''); // State to hold the input text
  const [resultText, setResultText] = useState(''); // State to hold the result text
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
const [modalVisable,setModalVisable]=useState(true)
const closeModal=()=>{
  setModalVisable(false)
}

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=case-converter`);
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
      const response = await fetch("/api/reviews?tool=case-converter");
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
  // Function to handle copying text to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy text');
    });
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
          tool: "case-converter",
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

  // Function to convert the text based on the type of conversion
  const convertText = (type) => {
    let convertedText = '';
    switch (type) {
      case 'uppercase':
        convertedText = inputText.toUpperCase();
        break;
      case 'lowercase':
        convertedText = inputText.toLowerCase();
        break;
      case 'capitalize':
        convertedText = inputText.replace(/\b\w/g, char => char.toUpperCase());
        break;
      case 'sentenceCase':
        convertedText = inputText.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, char => char.toUpperCase());
        break;
      case 'titleCase':
        convertedText = inputText.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        break;
      case 'alternatingCase':
        convertedText = inputText.split('').map((char, index) => index % 2 ? char.toUpperCase() : char.toLowerCase()).join('');
        break;
      case 'inverseCase':
        convertedText = inputText.split('').map(char => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join('');
        break;
      case 'countCharacters':
        convertedText = `Character Count: ${inputText.length}`;
        break;
      case 'countWords':
        convertedText = `Word Count: ${inputText.trim().split(/\s+/).length}`;
        break;
      default:
        break;
    }
    setResultText(convertedText);
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
                <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:image" content={meta.image} />
                <meta name="twitter:card" content={meta.image} />
                <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
                <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content={meta.image} />
            </Head>
            {/* Toast container for notifications */}
            <ToastContainer />
            {/* Page title */}
          
            {/* Alert message for logged in/out users */}
            {modalVisable && (
                <div className=" bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3 z-50" role="alert">
                    <div className="flex">
                        <div className="py-1">
                            <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                        </div>
                        <div>
                            {user ? (
                                user.paymentStatus === 'success' || user.role === 'admin' ? (
                                    <p className="text-center p-3 alert-warning">
                                        Congratulations!! Now you can generate unlimited tags.
                                    </p>
                                ) : (
                                    <p className="text-center p-3 alert-warning">
                                        You are not upgraded. You can generate Title {5 - generateCount}{" "}
                                        more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
                                    </p>
                                )
                            ) : (
                                <p className="text-center p-3 alert-warning">
                                    Please payment in to use this tool.
                                </p>
                            )}
                        </div>
                        <button className="text-yellow-700 ml-auto" onClick={closeModal}>×</button>
                    </div>
                </div>
            )}
      <ToastContainer />
      <h1 className="text-3xl font-bold text-center text-white mb-4">Case Converter</h1>
      <p className="text-center text-white mb-8">Convert Your Case With Title Case Converter Online</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative">
          <textarea
            className="border rounded shadow w-full p-4 h-64"
            placeholder="Enter Text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <FaCopy
            className="absolute top-2 right-2 cursor-pointer"
            onClick={() => handleCopy(inputText)}
          />
        </div>
        <div className="relative">
          <textarea
            className="border shadow rounded w-full p-4 h-64"
            placeholder="Result"
            value={resultText}
            readOnly
          />
          <FaCopy
            className="absolute top-2 right-2 cursor-pointer"
            onClick={() => handleCopy(resultText)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('countCharacters')}>Count Characters</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('countWords')}>Count Words</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('uppercase')}>Uppercase</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('lowercase')}>Lowercase</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('capitalize')}>Capitalize</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('sentenceCase')}>Sentence Case</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('titleCase')}>Title Case</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('alternatingCase')}>aLtErNaTiNg CaSe</button>
        <button className="bg-sky-700 text-white py-2 px-4 rounded" onClick={() => convertText('inverseCase')}>InVeRsE CaSe</button>
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
        </>
    
  );
};

export default CaseConverter;
