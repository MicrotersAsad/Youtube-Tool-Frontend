/* eslint-disable react/no-unescaped-entities */
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaEye, FaEyeSlash, FaStar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import Slider from 'react-slick';
import 'react-toastify/dist/ReactToastify.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import StarRating from './StarRating';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';

const YouTubeDescriptionGenerator = ({ meta }) => {
  const { user, updateUserProfile } = useAuth();
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

  const [content, setContent] = useState('');
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=DescriptionGenerator`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        console.log(data);
        setQuillContent(data[0]?.content || '');
        setExistingContent(data[0]?.content || '');
      } catch (error) {
        toast.error('Error fetching content');
      }
    };

    fetchContent();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=descriptionGenerator");
      const data = await response.json();
      const updatedReviews = data.map(review => ({
        ...review,
        name: review.userName,
        userProfile: review.userProfile,
      }));
      setReviews(updatedReviews);
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
          tool: "descriptionGenerator",
          ...newReview,
          userProfile: user?.profileImage,
          userName: user?.username
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setNewReview({ name: "", rating: 0, comment: "", userProfile: "", userName: "" });
      setShowReviewForm(false);
      fetchReviews();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVideoInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value
    }));
  };

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

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedSection);

    setSections(newSections);
  };

  const toggleVisibility = (id) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Head>
        <title>{meta?.title}</title>
        <meta name="description" content={meta?.description} />
        <meta property="og:url" content={meta?.url} />
        <meta property="og:title" content={meta?.title} />
        <meta property="og:description" content={meta?.description} />
        <meta property="og:image" content={meta?.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content={meta?.url} />
        <meta property="twitter:url" content={meta?.url} />
        <meta name="twitter:title" content={meta?.title} />
        <meta name="twitter:description" content={meta?.description} />
        <meta name="twitter:image" content={meta?.image} />
      </Head>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-center">YouTube Description Generator</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="content pt-6 pb-5">
        <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 pb-5 border p-5">
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
      {/* Review Form */}
      {user && !showReviewForm && (
        <button
          className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4"
          onClick={() => setShowReviewForm(true)}
        >
          Add Review
        </button>
      )}
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
  );
};

export async function getServerSideProps(context) {
  const { req } = context;
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const apiUrl = `${protocol}://${host}`;

  const response = await fetch(`${apiUrl}/api/content?category=DescriptionGenerator`);
  const data = await response.json();
console.log(data);
  const meta = {
    title: data[0]?.title || "",
    description: data[0]?.description || "",
    image: data[0]?.image || "",
    url: `${apiUrl}/tools/description-generator`,
  };

  return {
    props: {
      meta,
    },
  };
}

export default YouTubeDescriptionGenerator;
