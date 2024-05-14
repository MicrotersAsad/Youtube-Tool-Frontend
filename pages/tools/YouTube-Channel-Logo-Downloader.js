/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter } from 'react-icons/fa';
import Image from 'next/image';

const YouTubeChannelLogoDownloader = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [channelUrl, setChannelUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [showShareIcons, setShowShareIcons] = useState(false);

    const handleUrlChange = (e) => {
        setChannelUrl(e.target.value);
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    const extractChannelId = (link) => {
        const match = link.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/)?([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    const fetchChannelLogo = async () => {
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
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`);
            const logoUrl = response.data.items[0].snippet.thumbnails.default.url;
            setLogoUrl(logoUrl);
        } catch (error) {
            console.error('Failed to fetch channel logo:', error);
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
            <h2 className='text-3xl pt-5'>YouTube Channel Logo Downloader</h2>
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
                    <small className="text-muted">
                        Example: https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw
                    </small>
                    {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                    {logoUrl && (
                        <div className="text-center mt-3">
                            <Image src={logoUrl} alt="Channel Logo" style={{ maxWidth: '100%' }} />
                            <button className="btn btn-danger mt-3" onClick={downloadLogo}>
                                <FaDownload /> Download Logo
                            </button>
                        </div>
                    )}
                    <br/>
                    <button className="btn btn-danger mt-2" onClick={handleShareClick}>
                        <FaShareAlt />
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
            </div>
        </div>
    );
};

export default YouTubeChannelLogoDownloader;
