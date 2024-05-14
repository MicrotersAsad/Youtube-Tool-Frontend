/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

const YtEmbedCode = () => {
    const { isLoggedIn } = useAuth();
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generateCount, setGenerateCount] = useState(0);
    const [showShareIcons, setShowShareIcons] = useState(false);
    const [embedCode, setEmbedCode] = useState('');

    const handleUrlChange = (e) => {
        setVideoUrl(e.target.value);
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    const fetchYouTubeData = async () => {
        try {
            setLoading(true);
            setError('');
            const videoId = extractVideoId(videoUrl);
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`);
           
            setEmbedCode(`<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);
        } catch (error) {
            setError('Failed to fetch YouTube data. Please check the video URL.');
            setThumbnails(null);
            setSelectedThumbnailUrl('');
            setEmbedCode('');
        } finally {
            setLoading(false);
        }
    };

    const extractVideoId = (url) => {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
        const match = url.match(regex);
        return match ? match[2] : null;
    };



    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <h2 className='text-3xl pt-5'>Youtube  Embed Code Generator</h2>
            <p className="text-center p-3 mt-4 alert-warning">
                {isLoggedIn ? (
                    "You are logged in and can generate unlimited tags."
                ) : (
                    <span>
                        You are not logged in. You can generate tags {isLoggedIn ? "unlimited" : `${5 - generateCount}`} more times.{" "}
                        <button className="btn btn-warning">
                            <Link href="/register">Register</Link>
                        </button>
                    </span>
                )}
            </p>
            <div className="row justify-content-center pt-5">
                <div className="col-md-6">
                    <div className="input-group mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter YouTube Video URL..."
                            aria-label="YouTube Video URL"
                            value={videoUrl}
                            onChange={handleUrlChange}
                        />
                        <button
                            className="btn btn-danger"
                            type="button"
                            onClick={fetchYouTubeData}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Fetch Video'}
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
                  
                 
                    {embedCode && (
                        <div>
                             <video width="320" height="240" controls preload="none">
      <source src={embedCode} type="video/mp4" />
      
    
    </video>
                            <h4 className="mt-4">Embed Code:</h4>
                            <textarea className="form-control" rows="3" readOnly value={embedCode}></textarea>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YtEmbedCode;
