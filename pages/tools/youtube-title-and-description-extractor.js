
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaShareAlt, FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaCopy, FaDownload } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';

const TitleDescriptionExtractor = () => {
    const { isLoggedIn, user, updateUserProfile } = useAuth();
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showShareIcons, setShowShareIcons] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [generateCount, setGenerateCount] = useState(5); // Set initial count to 5
    const [isUpdated, setIsUpdated] = useState(false);
    useEffect(() => {
        if (user && user.paymentStatus !== 'success' && !isUpdated) {
          updateUserProfile().then(() => setIsUpdated(true));
        }
      }, [user, updateUserProfile, isUpdated]);
    
      useEffect(() => {
        if (user && user.paymentStatus !== 'success') {
          setGenerateCount(2);
        }
      }, [user]);

    const handleUrlChange = (e) => {
        setVideoUrl(e.target.value);
    };

    const fetchYouTubeData = async () => {
        if (generateCount <= 0) {
            toast.error('You have reached the limit of generating titles. Please upgrade your plan for unlimited use.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const videoId = extractVideoId(videoUrl);
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`);
            const { title, description } = response.data.items[0].snippet;
            setTitle(title);
            setDescription(description);

            if (user && user.paymentStatus !== 'success') {
                setGenerateCount(generateCount - 1); // Decrease count if not paid
            }
        } catch (error) {
            setError('Failed to fetch YouTube data. Please check the video URL.');
        } finally {
            setLoading(false);
        }
    };

    const extractVideoId = (url) => {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
    
        if (match && match[1]) {
            return match[1];
        } else {
            throw new Error('Invalid YouTube video URL');
        }
    };
    
    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Copied to clipboard!');
        }, (err) => {
            toast.error('Failed to copy:', err);
        });
    };

    const downloadText = (text, filename) => {
        const element = document.createElement('a');
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <h2 className='text-3xl pt-5'>Youtube Tile & Description Extractor</h2>
            <ToastContainer/>
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
                user.paymentStatus === 'success' ? (
                  <p className="text-center p-3 alert-warning">
                   Congratulation!! Now You Got Full Access.
                  </p>
                ) : (
                  <p className="text-center p-3 alert-warning">
                    You are not Upgrade. You can generate HashTag {5 - generateCount}{" "}
                    more times.<Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
                  </p>
                )
              ) : (
                <p className="text-center p-3 alert-warning">
                  Please log in to use this tool.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
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
                            {loading ? 'Loading...' : 'Fetch YouTube Data'}
                        </button>
                    </div>
                    <small className="text-muted">
                        Example: https://youtu.be/eUDKzw0gLg
                    </small>
                    <br />
                    <div className='ms-5'>
                        <button className="btn btn-danger mt-3" onClick={handleShareClick}>
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
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    
                    {title && (
                        <div className="mt-3">
                            <h6 className='pt-3 fw-bold'>Title Found:</h6>
                            <h3 className='border p-3'>{title}</h3>
                            <div className='pt-3'>
                            <button className="btn btn-danger me-2" onClick={() => copyToClipboard(title)}>
                                <FaCopy />
                            </button>
                            <button className="btn btn-danger" onClick={() => downloadText(title, 'title.txt')}>
                                <FaDownload />
                            </button>
                            </div>
                        </div>
                    )}
                   {description && (
                        <div className="mt-3">
                             <h6 className='pt-3 fw-bold'>Description Found:</h6>
                            <p>{description}</p>
                            <div className='pt-3'>
                            <button className="btn btn-danger me-2" onClick={() => copyToClipboard(description)}>
                                <FaCopy />
                            </button>
                            <button className="btn btn-danger" onClick={() => downloadText(description, 'description.txt')}>
                                <FaDownload />
                            </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TitleDescriptionExtractor;
