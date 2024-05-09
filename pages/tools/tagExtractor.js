/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaSearch, FaShareAlt, FaTimes, FaTwitter } from 'react-icons/fa';
import { FaGrip } from 'react-icons/fa6';

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
            console.log('Please enter a valid YouTube URL');
            return;
        }
        setLoading(true);
        setError('');
        try {
            console.log('Request Payload:', { videoUrl });
            const response = await fetch('http://localhost:5000/api/fetch-tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch tags');
            }
            const data = await response.json();
            console.log(data);
            setTags(data.tags || []);
        } catch (err) {
            setError(err.message);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied "${text}" to clipboard!`);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
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
                        <button
                            className="btn btn-primary"
                            type="button"
                            id="button-addon2"
                            onClick={fetchTags}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Generate Tags'} <FaSearch />
                        </button>
                    </div>
                    <small className="text-muted">
                        Example: https://youtu.be/eUDKzw0gLg
                    </small>
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {tags.length > 0 && (
                        <div>
                            <h3>Tags:</h3>
                            <div className="d-flex flex-wrap">
                                {tags.map((tag, index) => (
                                    <div key={index} className="bg-light m-1 p-2 rounded-pill d-flex align-items-center extract">
                                      <FaGrip className='text-muted'/>    <span onClick={() => copyToClipboard(tag)} style={{ cursor: 'pointer' }}>{tag}</span> <FaTimes className="ms-2 text-danger" onClick={() => removeTag(index)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button className="btn btn-primary mt-3" onClick={handleShareClick}>
                        Share <FaShareAlt />
                    </button>
                    {showShareIcons && (
                        <div className="share-icons mt-3">
                            <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                            <FaInstagram className="instagram-icon" onClick={() => shareOnSocialMedia('instagram')} />
                            <FaTwitter className="twitter-icon" onClick={() => shareOnSocialMedia('twitter')} />
                            <FaLinkedin className="linkedin-icon" onClick={() => shareOnSocialMedia('linkedin')} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TagExtractor;
