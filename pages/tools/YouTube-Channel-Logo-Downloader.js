/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter, FaStar } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';
import Head from 'next/head';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import StarRating from './StarRating'; // Assuming StarRating is a custom component
import announce from "../../public/shape/announce.png";
import chart from "../../public/shape/chart (1).png";
import cloud from "../../public/shape/cloud.png";
import cloud2 from "../../public/shape/cloud2.png";;
const YouTubeChannelLogoDownloader = () => {
    const { isLoggedIn, user, updateUserProfile, logout } = useAuth(); // Destructure authentication state from context
    const [isUpdated, setIsUpdated] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state for API requests
    const [error, setError] = useState(''); // Error state
    const [channelUrl, setChannelUrl] = useState(''); // State for input URL
    const [logoUrl, setLogoUrl] = useState(''); // State for fetched logo URL
    const [showShareIcons, setShowShareIcons] = useState(false); // State to toggle share icons visibility
    const [generateCount, setGenerateCount] = useState(
        typeof window !== 'undefined' ? Number(localStorage.getItem('generateCount')) || 0 : 0
      );
    const [content, setContent] = useState(''); // Content state for fetched HTML content
    const [meta, setMeta] = useState({ // Meta information for the page
        title: 'YouTube Channel Logo Downloader',
        description: "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
        image: 'https://yourwebsite.com/og-image.png',
    });
    const [reviews, setReviews] = useState([]);
    const [quillContent, setQuillContent] = useState("");
    const [existingContent, setExistingContent] = useState("");
    const [newReview, setNewReview] = useState({
        name: "",
        rating: 0,
        comment: "",
        userProfile: "",
      });
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [modalVisible, setModalVisible] = useState(true);

    const closeModal = () => {
        setModalVisible(false);
    }

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=YouTube-Channel-Logo-Downloader`);
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

   ;

    const handleUrlChange = (e) => {
        setChannelUrl(e.target.value);
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

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

    const extractChannelId = (link) => {
        const match = link.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/)?([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };
    const fetchChannelLogo = async () => {
        if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount <= 0) {
            toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
            return;
        }
        if (!channelUrl) {
            setError('Please enter a YouTube channel URL.');
            return;
        }
    
        const channelId = extractChannelId(channelUrl);
        if (!channelId) {
            setError('Invalid YouTube channel link.');
            return;
        }
    
        setLoading(true);
        setError('');
    
        try {
            const tokensResponse = await fetch("/api/tokens");
            if (!tokensResponse.ok) throw new Error("Failed to fetch API tokens");
    
            const tokens = await tokensResponse.json();
            let dataFetched = false;
    
            for (const { token } of tokens) {
                try {
                    const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${token}`);
                    if (response.data.items && response.data.items.length > 0) {
                        const logoUrl = response.data.items[0].snippet.thumbnails.default.url;
                        setLogoUrl(logoUrl);
                        dataFetched = true;
                        break;
                    }
                } catch (error) {
                    console.error(`Error fetching data with token ${token}:`, error);
                }
            }
    
            if (!dataFetched) {
                throw new Error("All API tokens exhausted or failed to fetch data.");
            }
    
            setGenerateCount(generateCount - 1);
            localStorage.setItem('generateCount', generateCount - 1);
        } catch (error) {
            toast.error('Failed to fetch channel logo:', error);
            setError('Failed to fetch data. Check console for more details.');
        } finally {
            setLoading(false);
        }
    };
    

    const downloadLogo = () => {
        if (!logoUrl) {
            setError('No logo to download.');
            return;
        }

        const fileName = 'YouTube_Channel_Logo.jpg';
        fetch(logoUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName;
                document.body.appendChild(anchor);
                anchor.click();

                window.URL.revokeObjectURL(url);
                document.body.removeChild(anchor);
            })
            .catch(error => {
                console.error('Error downloading image:', error);
                setError('Error downloading image. Check console for more details.');
            });
    };

    const shareOnSocialMedia = (socialNetwork) => {
        const url = encodeURIComponent(window.location.href);
        const socialMediaUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}`,
            instagram: "You can share this page on Instagram through the Instagram app on your mobile device.",
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        };

        if (socialNetwork === 'instagram') {
            alert(socialMediaUrls[socialNetwork]);
        } else {
            window.open(socialMediaUrls[socialNetwork], "_blank");
        }
    };

    const fetchReviews = async () => {
        try {
          const response = await fetch("/api/reviews?tool=YouTube-Channel-Logo-Downloader");
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
              tool: "YouTube-Channel-Logo-Downloader",
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
        const ratingCount = reviews.filter(review => review.rating === rating).length;
        return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
    };

    const settings = {
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                }
            }
        ]
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
          <h2 className="text-3xl pt-5 text-white">YouTube Channel Logo Download</h2>
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
                            Congratulations! Now you can downlaod unlimited Logo.
                          </p>
                        ) : (
                          <p className="text-center p-3 alert-warning">
                            You are not upgraded. You can downlaod Logo{" "}
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
    
    
            <div className="row justify-content-center pt-5">
                <div className="col-md-6">
                    <div className="input-group mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter YouTube Channel URL..."
                            aria-label="YouTube Channel URL"
                            value={channelUrl}
                            onChange={handleUrlChange}
                        />
                        <button
                            className="btn btn-danger"
                            type="button"
                            onClick={fetchChannelLogo}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Fetch Logo'}
                        </button>
                    </div>
                    <small className="text-white">
                        Example:  https://www.youtube.com/channel/UCnUe75Y9iRieacBvWvn61fA
                    </small>
                    {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                    </div>
          </div>
          </div>
          </div>
                    <div className="max-w-7xl mx-auto p-4">
          {logoUrl && (
            <>
           
            <div className="d-flex">
              <div className='mx-auto'>
              <Image
                src={logoUrl}
                alt="Channel Banner"
                width={100}
                height={100}
              />
              </div>
              
            </div>
            <div className='text-center'>
        <button
                className="btn btn-danger mt-3"
                onClick={downloadLogo}
              >
                <FaDownload /> 
              </button>
        </div>
            </>
            
          )}
        
        <div className="text-center">
          <div className="flex gap-2">
            <FaShareAlt className="text-danger fs-3" />
            <span> Share On Social Media</span>
            <FaFacebook
              className="facebook-icon fs-3"
              onClick={() => shareOnSocialMedia("facebook")}
            />
            <FaInstagram
              className="instagram-icon fs-3"
              onClick={() => shareOnSocialMedia("instagram")}
            />
            <FaTwitter
              className="twitter-icon fs-3"
              onClick={() => shareOnSocialMedia("twitter")}
            />
            <FaLinkedin
              className="linkedin-icon fs-3"
              onClick={() => shareOnSocialMedia("linkedin")}
            />
          </div>
        </div>
               
             
         
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

export default YouTubeChannelLogoDownloader;
