import React, { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaSearch, FaShare, FaShareAlt, FaTwitter } from 'react-icons/fa';

const TagExtractor = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showShareIcons, setShowShareIcons] = useState(false);

    const handleUrlChange = (e) => {
        setVideoUrl(e.target.value);
    };

    const fetchTags = async () => {
        if (!videoUrl) {
            setError('Please enter a valid YouTube URL');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/fetch-tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch tags');
            setTags(data.tags || []);
        } catch (err) {
            setError(err.message);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    const shareOnFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            "_blank"
        );
    };

    const shareOnTwitter = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?url=${url}`, "_blank");
    };

    const shareOnInstagram = () => {
        // Instagram doesn't allow direct sharing via URL, it can be achieved through mobile app integrations.
        // You may want to provide instructions for users to share on Instagram.
        alert(
            "You can share this page on Instagram through the Instagram app on your mobile device."
        );
    };

    const shareOnLinkedIn = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            "_blank"
        );
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
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
                       
                    </div>
                    <small className="text-muted">
                        Example: https://youtu.be/eUDKzw0gLg
                    </small>
                    <div className='mt-3'>
                    <button
                            className="btn btn-primary"
                            type="button"
                            id="button-addon2"
                            onClick={fetchTags}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Generate Tags'} <FaSearch/>
                        </button>
                        <button className="btn btn-primary ms-5" onClick={handleShareClick}>
            Share <FaShareAlt />
          </button>
          {showShareIcons && (
            <div className="share-icons ms-2">
              <FaFacebook className="facebook-icon" onClick={shareOnFacebook} />
              <FaInstagram
                className="instagram-icon"
                onClick={shareOnInstagram}
              />
              <FaTwitter className="twitter-icon" onClick={shareOnTwitter} />
              <FaLinkedin className="linkedin-icon" onClick={shareOnLinkedIn} />
            </div>
          )}
                    </div>
                    
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {tags.length > 0 && (
                        <div>
                            <h3>Tags:</h3>
                            <ul>
                                {tags.map((tag, index) => (
                                    <li key={index}>{tag}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                   
                </div>
                
            </div>
        </div>
    );
};

export default TagExtractor;
