import React, { useEffect, useState } from 'react';
import { FaCopy, FaStar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import StarRating from "./StarRating";
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";
import Image from "next/image";
import Link from 'next/link';

const CaseConverter = ({ meta, faqs, relatedTools }) => {
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const { user, updateUserProfile } = useAuth();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const [generateCount, setGenerateCount] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: "",
    userProfile: "",
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const closeModal = () => {
    setModalVisible(false);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=case-converter`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setQuillContent(data[0]?.content || "");
        setExistingContent(data[0]?.content || "");
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy text');
    });
  };

  const openReviewForm = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowReviewForm(true);
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=tagGenerator");
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"),
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
          tool: "tagGenerator",
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
        title: "",
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
    const ratingCount = reviews.filter((review) => review.rating === rating).length;
    return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
  };

  const overallRating = (
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  ).toFixed(1);

  const handleShowMoreReviews = () => {
    setShowAllReviews(true);
  };

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
          <ToastContainer />
          {modalVisible && (
            <div
              className="bottom-0 right-0 bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3 z-50"
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
                <div className='mt-4'>
                  {user ? (
                    user.paymentStatus === 'success' || user.role === 'admin' ? (
                      <p className="text-center p-3 alert-warning">
                        Congratulations!! Now you can use  unlimited .
                      </p>
                    ) : (
                      <p className="text-center p-3 alert-warning">
                        You are not upgraded. You can use {5 - generateCount}{" "}
                        more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
                      </p>
                    )
                  ) : (
                    <p className="text-center p-3 alert-warning">
                      Please login in to use this tool.
                    </p>
                  )}
                </div>
                <button className="text-yellow-700 ml-auto" onClick={closeModal}>×</button>
              </div>
            </div>
          )}
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
        <div className="row pt-3">
          <div className="col-md-4">
            <div className=" text-3xl font-bold mb-2">Customer reviews</div>
            <div className="flex items-center mb-2">
              <div className="text-3xl font-bold mr-2">{overallRating}</div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} color={i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"} />
                ))}
              </div>
              <div className="ml-2 text-sm text-gray-500">{reviews.length} global ratings</div>
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
              <h4>Review This Tool</h4>
              <p>Share Your Thoughts With Other Customers</p>
              <button
                className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
                onClick={openReviewForm}
                
              >
                Write a customer review
              </button>
            </div>
          </div>

          <div className="col-md-8">
            {reviews.slice(0, 5).map((review, index) => (
              <div
                key={index}
                className="border p-6 m-5 bg-white"
              >
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
                    <div className="text-gray-500 text-sm">Verified Purchase</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} size={20} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />
                  ))}
                <div>
                <span className="fw-bold mt-2 ms-2">{review?.title}</span>
                </div>
                </div>
              
                <div className="text-gray-500 text-sm mb-4">Reviewed On {review.createdAt}</div>
                <div className="text-lg mb-4">{review.comment}</div>
              
              </div>
            ))}
            {!showAllReviews && reviews.length > 5 && (
              <button
                className="btn btn-primary mt-4 mb-5"
                onClick={handleShowMoreReviews}
              >
                See More Reviews
              </button>
            )}
            {showAllReviews &&
              reviews.slice(5).map((review, index) => (
                <div
                  key={index}
                  className="border p-6 m-5 bg-white"
                >
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
                      <div className="text-gray-500 text-sm">Verified Purchase</div>
                      <p className="text-muted">Reviewed On {review?.createdAt}</p>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{review.title}</div>
                  <div className="text-gray-500 mb-4">{review.date}</div>
                  <div className="text-lg mb-4">{review.comment}</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} size={20} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {modalVisible && (
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
                Submit Review
              </button>
              <button
                className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Related Tools Section */}
      <div className="related-tools mt-10">
        <h2 className="text-2xl font-bold mb-4">Related Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedTools.map((tool, index) => (
            <div key={index} className="bg-white shadow rounded p-4">
              <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
              <p className="text-gray-700 mb-4">{tool.description}</p>
              <Link href={tool.url}>
                <a className="text-blue-500 hover:text-blue-700">Learn More</a>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CaseConverter;
