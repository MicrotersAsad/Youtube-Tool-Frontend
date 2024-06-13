/* eslint-disable react/no-unescaped-entities */
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaEye, FaEyeSlash, FaStar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';
import Slider from "react-slick";
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRating from "./StarRating"; // Assuming StarRating is a custom component
import { useAuth } from '../../contexts/AuthContext';

const YouTubeDescriptionGenerator = () => {
  // Initial video information state
  const { isLoggedIn, user, updateUserProfile } = useAuth();
  const [videoInfo, setVideoInfo] = useState({
    aboutVideo: `Welcome to [Your Channel Name]!\n\nIn this video, we're diving deep into the world of Full Stack Development. Whether you're a beginner or an experienced developer, these tips and guidelines will help you enhance your skills and stay ahead in the tech industry.`,
    timestamps: `00:00 - Introduction\n01:00 - First Topic\n02:00 - Second Topic\n03:00 - Third Topic`,
    aboutChannel: `Our channel is all about [Channel's Niche]. We cover a lot of cool stuff like [Topics Covered]. Make sure to subscribe for more awesome content!`,
    recommendedVideos: `Check Out Our Other Videos:\n- [Video 1 Title](#)\n- [Video 2 Title](#)\n- [Video 3 Title](#)`,
    aboutCompany: `Check out our company and our products at [Company Website]. We offer [Products/Services Offered].`,
    website: `Find us at:\n[Website URL]`,
    contactSocial: `Get in Touch with Us:\nEmail: [Your Email]\nFollow us on Social Media:\nTwitter: [Your Twitter Handle]\nLinkedIn: [Your LinkedIn Profile]\nGitHub: [Your GitHub Repository]`,
    keywords: 'full stack development, coding, programming, web development'
  });

  // Sections for the draggable interface
  const [sections, setSections] = useState([
    { id: 'aboutVideo', title: 'About the Video', visible: true },
    { id: 'timestamps', title: 'Timestamps', visible: true },
    { id: 'aboutChannel', title: 'About the Channel', visible: true },
    { id: 'recommendedVideos', title: 'Recommended Videos/Playlists', visible: true },
    { id: 'aboutCompany', title: 'About Our Company & Products', visible: true },
    { id: 'website', title: 'Our Website', visible: true },
    { id: 'contactSocial', title: 'Contact & Social', visible: true },
    { id: 'keywords', title: 'Keywords to Target (Optional)', visible: true }
  ]);

  // State for meta and content
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState('');
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });

  // Fetch content on component mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=DescriptionGenerator`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        
        setQuillContent(data[0]?.content || ''); // Ensure content is not undefined
        setExistingContent(data[0]?.content || ''); // Ensure existing content is not undefined
        setMeta(data[0])
      
      } catch (error) {
        toast.error("Error fetching content");
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=youtube-description-generator");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
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
          tool: "youtube-description-generator",
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVideoInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value
    }));
  };

  // Generate description based on the current state
  const generateDescription = () => {
    const { aboutVideo, timestamps, aboutChannel, recommendedVideos, aboutCompany, website, contactSocial, keywords } = videoInfo;
    return `
${aboutVideo}

📌 **Timestamps:**
${timestamps}

📌 **About the Channel:**
${aboutChannel}

📌 **Recommended Videos/Playlists:**
${recommendedVideos}

📌 **About Our Company & Products:**
${aboutCompany}

📌 **Our Website:**
${website}

📌 **Contact & Social:**
${contactSocial}

🔍 **Keywords to Target:**
${keywords}
    `;
  };

  // Handle drag and drop functionality
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedSection);

    setSections(newSections);
  };

  // Toggle visibility of sections
  const toggleVisibility = (id) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter((review) => review.rating === rating).length;
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
    <div className="container mx-auto p-6">
      {/* Page head metadata */}
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
        <meta name="twitter:card" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
        <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
        <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
      </Head>
      {/* Toast container for notifications */}
      <ToastContainer />
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-4 text-center">YouTube Description Generator</h1>
      {/* Grid layout for input and output sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Draggable sections input */}
        <div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map(({ id, title, visible }, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-4 border p-4 rounded shadow"
                        >
                          <div className="flex justify-between items-center">
                            <label className="block font-semibold mb-1" htmlFor={id}>{title}</label>
                            <button onClick={() => toggleVisibility(id)} className="text-gray-600">
                              {visible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {visible && (
                            <textarea
                              name={id}
                              value={videoInfo[id]}
                              onChange={handleChange}
                              className="w-full p-2 border border-gray-300 rounded"
                              rows="4"
                            ></textarea>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        {/* Generated description output */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Generated Video Description</h2>
          <div className="p-4 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
            {generateDescription()}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(generateDescription())}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
      {/* Render content from API */}
      <div className="content pt-6 pb-5">
        <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
      </div>
      {/* Review section */}
      <div>
        <div className="review-card">
          <h3 className="text-xl font-bold mb-4">Add a Review</h3>
          <div className="mb-3">
          <StarRating
            rating={newReview.rating}
            setRating={(rating) => setNewReview({ ...newReview, rating })}
          />
          </div>
          <textarea
            className="form-control mb-3"
            placeholder="Add your review..."
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          ></textarea>
          <button className="btn btn-primary" onClick={handleReviewSubmit}>
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
      </div>
      {/* Additional styles */}
      <style jsx>{`
        .review-card {
          margin-top: 20px;
          padding: 20px;
          background-color: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        .share-icons {
          display: flex;
          justify-content: space-between;
          width: 150px;
        }
      `}</style>
    </div>
  );
};

export default YouTubeDescriptionGenerator;
