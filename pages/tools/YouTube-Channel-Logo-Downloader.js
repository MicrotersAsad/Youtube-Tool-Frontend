/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTwitter } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import sanitizeHtml from 'sanitize-html';
import Head from 'next/head';

const YouTubeChannelLogoDownloader = () => {
    const { isLoggedIn } = useAuth(); // Destructure authentication state from context
    const [loading, setLoading] = useState(false); // Loading state for API requests
    const [error, setError] = useState(''); // Error state
    const [channelUrl, setChannelUrl] = useState(''); // State for input URL
    const [logoUrl, setLogoUrl] = useState(''); // State for fetched logo URL
    const [showShareIcons, setShowShareIcons] = useState(false); // State to toggle share icons visibility
    const [generateCount, setGenerateCount] = useState(5); // Count for how many times data is fetched
    const [content, setContent] = useState(''); // Content state for fetched HTML content
    const [meta, setMeta] = useState({ // Meta information for the page
        title: 'YouTube Channel Logo Downloader',
        description: "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
        image: 'https://yourwebsite.com/og-image.png',
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=YouTube-Channel-Logo-Downloader`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
                const data = await response.json();
                console.log(data);
                if (data && data.length > 0 && data[0].content) {
                    const sanitizedContent = sanitizeHtml(data[0].content, {
                        allowedTags: ['h2', 'h3', 'p', 'li', 'a'],
                        allowedAttributes: {
                            'a': ['href']
                        }
                    });
                    setContent(sanitizedContent);
                    setMeta({
                        title: data[0].title || 'YouTube Channel Logo Downloader',
                        description: data[0].description || meta.description,
                        image: data[0].image || meta.image
                    });
                } else {
                    toast.error("Content data is invalid");
                }
            } catch (error) {
                toast.error("Error fetching content");
            }
        };

        fetchContent();
    }, [meta.description, meta.image]);

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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
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
            <ToastContainer />
            <h2 className='text-3xl pt-5'>YouTube Channel Logo Downloader</h2>
            <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                    </div>
                    <div>
                        {isLoggedIn ? (
                            <p className="text-center p-3 alert-warning">
                                You are logged in and can generate unlimited tags.
                            </p>
                        ) : (
                            <p className="text-center p-3 alert-warning">
                                You are not logged in. You can generate tags {5 - generateCount}{" "}
                                more times.<Link href="/register" className="btn btn-warning ms-3">Registration</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
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
                        Example:  https://www.youtube.com/channel/UCnUe75Y9iRieacBvWvn61fA
                    </small>
                    {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                    {logoUrl && (
                        <div className="text-center mt-3">
                            <Image src={logoUrl} alt="Channel Logo" width={100} height={100} />
                            <button className="btn btn-danger mt-3" onClick={downloadLogo}>
                                <FaDownload /> Download Logo
                            </button>
                        </div>
                    )}
                    <br />
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
                <div className="content pt-6 pb-5">
                    <div dangerouslySetInnerHTML={{ __html: content }}></div>
                </div>
            </div>
        </div>
    );
};

export default YouTubeChannelLogoDownloader;
