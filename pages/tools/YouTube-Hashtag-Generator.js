/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef, useEffect } from "react";
import {
  FaShareAlt,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaCog,
  FaCopy,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";
import sanitizeHtml from 'sanitize-html';
import { ToastContainer, toast } from "react-toastify";
import Head from "next/head";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component

const YouTubeHashtagGenerator = () => {
  // State variables
  const { user, updateUserProfile } = useAuth();
  const [tags, setTags] = useState([]); // Array to store entered tags
  const [keyword, setKeyword] = useState(""); // keyword value for adding new tag
  const [generateHashTag, setGenerateHashTag] = useState([]); // Array to store generated titles
  const [isLoading, setIsLoading] = useState(false); // Loading state for API requests
  const [showCaptcha, setShowCaptcha] = useState(false); // Whether to show ReCAPTCHA
  const [showShareIcons, setShowShareIcons] = useState(false); // Whether to show social media share icons
  const [generateCount, setGenerateCount] = useState(2); // generated count show 
  const recaptchaRef = useRef(null); // Reference to ReCAPTCHA component
  const apiKey = process.env.NEXT_PUBLIC_API_KEY; // API key for OpenAI
  const [selectAll, setSelectAll] = useState(false); // Whether all titles are selected
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [quillContent, setQuillContent] = useState('');
    const [existingContent, setExistingContent] = useState('');
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=YouTube-Hashtag-Generator`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        console.log(data);
        setQuillContent(data[0]?.content || '');
        setExistingContent(data[0]?.content || '');
        setMeta(data[0]);
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
    fetchReviews();
  }, []);

  useEffect(() => {
    fetch('/api/deal')
      .then(res => res.json())
      .then(data => setPrompt(data[0]))
  }, []);


  useEffect(() => {
    if (user && user.paymentStatus !== 'success' && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
}, [user, updateUserProfile, isUpdated]);

useEffect(() => {
    if (user && user.paymentStatus !== 'success' && user.role !== 'admin') {
        setGenerateCount(5);
    }
}, [user]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        "/api/reviews?tool=youtube-hashtag-generator"
      );
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  // Function to handle user input for adding tags
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const newTag = keyword.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setKeyword("");
      }
    }
  };

  // Function to handle selecting all titles
  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setGenerateHashTag(
      generateHashTag.map((title) => ({
        ...title,
        selected: newSelection,
      }))
    );
  };

  // Function to share on social media
  const shareOnSocialMedia = (socialNetwork) => {
    const url = encodeURIComponent(window.location.href);
    const socialMediaUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      instagram:
        "You can share this page on Instagram through the Instagram app on your mobile device.",
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    if (socialNetwork === "instagram") {
      toast.success(socialMediaUrls[socialNetwork]);
    } else {
      window.open(socialMediaUrls[socialNetwork], "_blank");
    }
  };

  // Function to handle share button click
  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  // Function to toggle title selection
  const toggleTitleSelect = (index) => {
    const newTitles = [...generateHashTag];
    newTitles[index].selected = !newTitles[index].selected;
    setGenerateHashTag(newTitles);
    setSelectAll(newTitles.every((title) => title.selected));
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`Copied: "${text}"`);
      },
      (err) => {
        toast.error("Failed to copy text: ", err);
      }
    );
  };

  // Function to copy selected titles
  const copySelectedTitles = () => {
    const selectedTitlesText = generateHashTag
      .filter((title) => title.selected)
      .map((title) => title.text)
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  // Function to download selected titles
  const downloadSelectedTitles = () => {
    const selectedTitlesText = generateHashTag
      .filter((title) => title.selected)
      .map((title) => title.text)
      .join("\n");
    const element = document.createElement("a");
    const file = new Blob([selectedTitlesText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "selected_titles.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to generate titles
  const generateHashTags = async () => {
    if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount <= 0) {
      toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
      return;
  }
    setIsLoading(true);
    setShowCaptcha(true);
    console.log(tags.join(", "));
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-16k",
            messages: [
              {
                role: "system",
                content: `${prompt.outline}`,
              },
              { role: "user", content: tags.join(", ") },
            ],
            temperature: 0.7,
            max_tokens: 3500,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          }),
        }
      );

      const data = await response.json();
      const titles = data.choices[0].message.content
        .trim()
        .split("\n")
        .map((title) => ({
          text: title,
          selected: false,
        }));
      setGenerateHashTag(titles);

      if (user && user.paymentStatus !== 'success') {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      toast.error("Error generating titles:", error);
      setGenerateHashTag([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment) {
      toast.error("Please fill in both rating and comment.");
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "youtube-hashtag-generator",
          rating: newReview.rating,
          comment: newReview.comment,
          user: user.id,
        }),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        setNewReview({ rating: 0, comment: "" });
        fetchReviews();
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review.");
    }
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter((review) => review.rating === rating)
      .length;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta
          property="og:image"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
        <meta
          name="twitter:card"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
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
        <meta
          name="twitter:image"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
      </Head>
      <h2 className="text-3xl pt-5">YouTube Hashtag Generator</h2>
      <ToastContainer />
      <div className="text-center pt-4 pb-4">
        <div
          className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3"
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
          </div>
        </div>
      </div>
      <div className="keywords-input center rounded">
        <div className="tags">
          {tags.map((tag, index) => (
            <span className="tag" key={index}>
              {tag}
              <span
                className="remove-btn"
                onClick={() => setTags(tags.filter((_, i) => i !== index))}
              >
                ×
              </span>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add a keyword"
          className="rounded w-100"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          required
        />
      </div>
      <p className="text-muted text-center"> Example : php, html, css</p>
      <div className="center">
        <div className="d-flex justify-between items-center pt-5">
          <button
            className="btn btn-danger"
            onClick={generateHashTags}
            disabled={isLoading || tags.length === 0}
          >
            <span>
              {" "}
              {isLoading ? "Generating..." : "Generate HashTag"}
            </span>
          </button>
          <div className="share-button-container">
            <button className="btn btn-danger ms-5" onClick={handleShareClick}>
              <FaShareAlt className="share-button-icon" />
            </button>
            {showShareIcons && (
              <div className="share-icons ms-2">
                <FaFacebook
                  className="facebook-icon"
                  onClick={() => shareOnSocialMedia("facebook")}
                />
                <FaInstagram
                  className="instagram-icon"
                  onClick={() => shareOnSocialMedia("instagram")}
                />
                <FaTwitter
                  className="twitter-icon"
                  onClick={() => shareOnSocialMedia("twitter")}
                />
                <FaLinkedin
                  className="linkedin-icon"
                  onClick={() => shareOnSocialMedia("linkedin")}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showCaptcha && (
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_CAPTCHA_KEY}
          onChange={(value) => setShowCaptcha(!value)}
        />
      )}
      <div className="generated-titles-container">
        <div className="select-all-checkbox">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
          />
          <span>Select All</span>
        </div>
        {generateHashTag.map((title, index) => (
          <div key={index} className="title-checkbox">
            <input
              type="checkbox"
              checked={title.selected}
              onChange={() => toggleTitleSelect(index)}
            />
            <span className="ms-2"> {title.text}</span>
            <FaCopy
              className="copy-icon"
              onClick={() => copyToClipboard(title.text)}
            />
          </div>
        ))}
        {generateHashTag.some((title) => title.selected) && (
          <button className="btn btn-danger" onClick={copySelectedTitles}>
            Copy <FaCopy />
          </button>
        )}
        {generateHashTag.some((title) => title.selected) && (
          <button
            className="btn btn-danger ms-2"
            onClick={downloadSelectedTitles}
          >
            Download <FaDownload />
          </button>
        )}
      </div>
      <div>

      </div>
      <div className="content pt-6 pb-5">
                    <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
                </div>
      {/* Review Section */}
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
      <div className="mt-8 review-card">
        <h2 className="text-2xl font-semibold mb-4">User Reviews</h2>
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
              <p className="text-gray-600">- {user?.username}</p>
            </div>
          ))}
        </Slider>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
};

const styles = `
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
      color: #333; // Change the color to match your design
      font-size: 16px; // Adjust the font size as needed
      line-height: 1.6; // Adjust the line height for readability
      // Add any other styles you want to apply to the content
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
        color: #fff!important;
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

    .tag, .generated-tag {
        display: flex;
        align-items: center;

        color: #000000!important;
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
        .keywords-input, .center {
            width: 100%;
        }

        .btn {
            width: 100%;
            margin-top: 10px.
        }
    }

    .generated-tags-display {
        background-color: #f2f2f2;
        border-radius: 8px;
        padding: 10px.
        margin-top: 20px.
    }
`;
export default YouTubeHashtagGenerator;
