/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const YtThumbnailDw = () => {
    const { isLoggedIn } = useAuth();
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [thumbnails, setThumbnails] = useState(null);
    const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState('');
    const [generateCount, setgenerateCount] = useState(0);
    const [showShareIcons, setShowShareIcons] = useState(false);
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
            console.log('Video ID:', videoId); // Log videoId
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`);
            console.log('API Response:', response.data); // Log API response
            const thumbnailData = response.data.items[0].snippet.thumbnails;
            console.log('Thumbnail Data:', thumbnailData); // Log thumbnail data
            setThumbnails(thumbnailData);
        } catch (error) {
            console.error('Error fetching YouTube data:', error); // Log error
            setError('Failed to fetch YouTube data. Please check the video URL.');
            setThumbnails(null);
            setSelectedThumbnailUrl('');
        } finally {
            setLoading(false);
        }
    };

    

    const extractVideoId = (url) => {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
        const match = url.match(regex);
        return match ? match[2] : null;
    };


    const downloadThumbnail = () => {
        if (!selectedThumbnailUrl) return;
    
        const fileName = 'YouTube_thumbnail.jpg';
    
        // Fetch the thumbnail image data
        fetch(selectedThumbnailUrl)
            .then(response => response.blob())
            .then(blob => {
                // Create a temporary URL for the image blob
                const url = window.URL.createObjectURL(new Blob([blob]));
    
                // Create a temporary anchor element to trigger the download
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName;
                document.body.appendChild(anchor);
                anchor.click();
    
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(anchor);
            })
            .catch(error => {
                console.error('Error downloading thumbnail:', error);
                // Handle error
            });
    };
    
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <h2 className='text-3xl pt-5'>Youtube Thumbnails Generator</h2>
            <p className="text-center p-3 mt-4 alert-warning">
  {isLoggedIn ? (
    "You are logged in and can generate unlimited tags."
  ) : (
    <span>
      You are not logged in. You can generate tags{" "}
      {isLoggedIn ? "unlimited" : `${5 - generateCount}`} more times.{" "}
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
                            {loading ? 'Loading...' : 'Fetch Thumbnail'}
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
                    <div className="d-flex flex-wrap justify-content-center">
                        {thumbnails && Object.entries(thumbnails).map(([resolution, { url }]) => (
                            <div key={resolution} className={`p-2 ${url === selectedThumbnailUrl ? 'selected' : ''}`} onClick={() => setSelectedThumbnailUrl(url)}>
                                <Image 
                                    src={url} 
                                    alt={`Thumbnail ${resolution}`} 
                                    className="img-thumbnail" 
                                    style={{ border: url === selectedThumbnailUrl ? '3px solid blue' : 'none', cursor: 'pointer' }}
                                />
                                <p className="text-center">{resolution}</p>
                            </div>
                        ))}
                    </div>
                    {selectedThumbnailUrl && (
                        <button className="btn btn-danger mt-3" onClick={downloadThumbnail}>
                            <FaDownload /> 
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YtThumbnailDw;
