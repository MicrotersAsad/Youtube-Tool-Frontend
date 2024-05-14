/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter } from 'react-icons/fa';
import Image from 'next/image';

const YtChannelDw = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [channelUrl, setChannelUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [showShareIcons, setShowShareIcons] = useState(false);

    const handleUrlChange = (e) => {
        setChannelUrl(e.target.value);
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    const fetchYouTubeData = async () => {
        try {
            setLoading(true);
            setError('');
            const channelId = extractChannelId(channelUrl);
            if (!channelId) {
                throw new Error('Invalid YouTube channel URL. Please enter a valid URL.');
            }
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=${channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
            );
            const brandingSettings = response.data?.items[0]?.brandingSettings;
            if (!brandingSettings) {
                throw new Error('Brand settings not found for this channel.');
            }
            const image = brandingSettings.image;
            if (!image) {
                throw new Error('Image settings not found for this channel.');
            }
            const bannerUrl = image.bannerExternalUrl;
            if (!bannerUrl) {
                throw new Error('Banner image URL not found for this channel.');
            }
            setBannerUrl(bannerUrl);
        } catch (error) {
            setError(error.message || 'Failed to fetch YouTube data. Please check the channel URL.');
            setBannerUrl('');
        } finally {
            setLoading(false);
        }
    };
    
    
    const extractChannelId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/){1,2}|(?:youtube\.com\/)?(?:channel|c)\/)([^/?]+)/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const downloadChannelBanner = () => {
        if (!bannerUrl) return;
    
        const fileName = 'YouTube_Channel_Banner.jpg';
    
        // Fetch the image data
        fetch(bannerUrl)
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
                console.error('Error downloading image:', error);
                // Handle error
            });
    };
    
    // Function to share on social media
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


    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <h2 className='text-3xl pt-5'>YouTube Channel Banner Downloader</h2>
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
                            onClick={fetchYouTubeData}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Fetch Banner'}
                        </button>
                    </div>
                    <small className="text-muted">
                        Example: https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw
                    </small>
                    <br />
                    <div className='ms-5'>
                    <button className="btn btn-danger ms-5 mt-2" onClick={handleShareClick}>
                        <FaShareAlt/> 
                    </button>
                    {showShareIcons && (
                        <div className="share-icons ms-2">
                            <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                            <FaInstagram
                                className="instagram-icon"
                                onClick={() => shareOnSocialMedia('instagram')}
                            />
                            <FaTwitter className="twitter-icon" onClick={() => shareOnSocialMedia('twitter')} />
                            <FaLinkedin className="linkedin-icon" onClick={() => shareOnSocialMedia('linkedin')} />
                        </div>
                    )}
                    </div>

                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {bannerUrl && (
                        <div className="text-center mt-3">
                            <Image src={bannerUrl} alt="Channel Banner" style={{ maxWidth: '100%' }} />
                            <button className="btn btn-danger mt-3" onClick={downloadChannelBanner}>
                                <FaDownload /> Download Channel Banner
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YtChannelDw;
