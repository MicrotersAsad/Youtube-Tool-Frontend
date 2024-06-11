import React, { useState, useEffect } from 'react';
import { FaCopy, FaDownload, FaFacebook, FaInstagram, FaLinkedin, FaShareAlt, FaTimes, FaTwitter } from 'react-icons/fa';
import { FaGrip } from 'react-icons/fa6';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sanitizeHtml from 'sanitize-html';
import Head from 'next/head';

const TagExtractor = () => {
    const { user, updateUserProfile } = useAuth(); // Get the user object from the AuthContext
    const [videoUrl, setVideoUrl] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showShareIcons, setShowShareIcons] = useState(false);
    const [fetchLimitExceeded, setFetchLimitExceeded] = useState(false);
    const [content, setContent] = useState('');
    const [meta, setMeta] = useState('');
    const [generateCount, setGenerateCount] = useState(2);
    const [isUpdated, setIsUpdated] = useState(false);
    const [quillContent, setQuillContent] = useState('');
    const [existingContent, setExistingContent] = useState('');
    // Fetch content from API on component mount
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=tagExtractor`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
                const data = await response.json();
                setQuillContent(data[0]?.content || ''); // Ensure content is not undefined
                setExistingContent(data[0]?.content || ''); // Ensure existing content is not undefined
                setMeta(data[0])
               
            } catch (error) {
                toast.error("Error fetching content");
            }
        };

        fetchContent();
    }, []);

  
  
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


    // Handle URL input change
    const handleUrlChange = (e) => {
        setVideoUrl(e.target.value);
    };

    // Copy all tags to clipboard
    const copyAllTagsToClipboard = () => {
        const textToCopy = tags.join(', ');
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('Tags copied to clipboard!');
        }, (err) => {
            toast.error('Failed to copy tags:', err);
        });
    };

    // Fetch tags from the API
    const fetchTags = async () => {
        if (!videoUrl) {
            setError('Please enter a valid YouTube URL');
            toast.error('Please enter a valid YouTube URL');
            return;
        }

        if (user && user.paymentStatus !== 'success' && generateCount <= 0) {
            toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/fetch-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    setFetchLimitExceeded(true);
                    setError('Fetch limit exceeded. Please try again later or register for unlimited access.');
                    toast.error('Fetch limit exceeded. Please try again later or register for unlimited access.');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch tags');
                }
                return;
            }

            const data = await response.json();
            setTags(data.tags || []);
            if (user && user.paymentStatus !== 'success') {
                setGenerateCount(generateCount - 1);
            }
        } catch (err) {
            setError(err.message);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    // Copy a single tag to clipboard
    const copyToClipboard = (tag) => {
        navigator.clipboard.writeText(tag).then(() => {
            toast.success(`Copied: "${tag}"`);
        }, (err) => {
            toast.error('Failed to copy text:', err);
        });
    };

    // Download tags as a text file
    const downloadTags = () => {
        const element = document.createElement("a");
        const file = new Blob([tags.join('\n')], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "YouTubeTags.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Remove a tag from the list
    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    // Share on social media
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

    // Handle share button click
    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    // Reset fetch limit if user has unlimited access
    useEffect(() => {
        if (user && user.paymentStatus === 'success') {
            setFetchLimitExceeded(false);
        }
    }, [user]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
            {/* Page head metadata */}
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:image" content={meta.image} />
                <meta name="twitter:card" content={meta.image} />
                <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
                <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content={meta.image} />
            </Head>
            <h2 className='text-3xl pt-5'>YouTube Tag Extractor</h2>
            <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                <ToastContainer />
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                    </div>
                    <div>
                    {user ? (
                            user.paymentStatus === 'success' || user.role === 'admin' ? (
                                <p className="text-center p-3 alert-warning">
                                    Congratulations!! Now you can generate unlimited tags.
                                </p>
                            ) : (
                                <p className="text-center p-3 alert-warning">
                                    You are not upgraded. You can generate Title {5 - generateCount}{" "}
                                    more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
                                </p>
                            )
                        ) : (
                            <p className="text-center p-3 alert-warning">
                                Please payment in to use this tool.
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
                            onClick={fetchTags}
                            disabled={loading || fetchLimitExceeded}
                        >
                            {loading ? 'Loading...' : 'Generate Tags'}
                        </button>
                    </div>
                    <small className="text-muted">
                        Example: https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s
                    </small>
                    <br />
                    <div className='ms-5'>
                        <button className="btn btn-danger mt-3" onClick={handleShareClick}>
                            <FaShareAlt />
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
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {tags.length > 0 && (
                        <div>
                            <h3>Tags:</h3>
                            <div className="d-flex flex-wrap">
                                {tags.map((tag, index) => (
                                    <div key={index} className="bg-light m-1 p-2 rounded-pill d-flex align-items-center extract">
                                        <FaGrip className='text-muted' />
                                        <span onClick={() => copyToClipboard(tag)} style={{ cursor: 'pointer' }}>{tag}</span>
                                        <FaTimes className="ms-2 text-danger" onClick={() => removeTag(index)} />
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-danger mt-3" onClick={downloadTags}>
                                Download <FaDownload />
                            </button>
                            <button className="btn btn-danger mt-3 ms-2" onClick={copyAllTagsToClipboard}>
                                Copy <FaCopy />
                            </button>
                        </div>
                    )}
                </div>
                <div className="content pt-6 pb-5">
                <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
                </div>
            </div>
        </div>
    );
};

export default TagExtractor;
