import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import sanitizeHtml from 'sanitize-html';

const MonetizationChecker = () => {
    const { user, updateUserProfile } = useAuth(); // Custom hook for authentication
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    const [generateCount, setGenerateCount] = useState(5);
    const [meta, setMeta] = useState({}); // Ensure meta is an object
    const [isUpdated, setIsUpdated] = useState(false);
    const recaptchaRef = useRef(null);
    const [quillContent, setQuillContent] = useState('');
    const [existingContent, setExistingContent] = useState('');
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=monetization-checker`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
                const data = await response.json();
                
                setQuillContent(data[0]?.content || ''); // Ensure content is not undefined
                setExistingContent(data[0]?.content || ''); // Ensure existing content is not undefined
                setMeta(data[0])
               
            } catch (error) {
                toast.error("Error fetching content");
                console.error('Error fetching content:', error);
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


    const handleInputChange = (e) => {
        setError('');
        setUrl(e.target.value);
    };

    const handleFetchClick = async () => {
        if (!url.trim()) {
            toast.error('Please enter a valid URL.');
            return;
        }

        if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount <= 0) {
            toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
            return;
        }
        setLoading(true);
        setError('');
        setData(null);

        try {
            const response = await fetch('/api/monetization-checker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Failed to fetch data');
            }

            const data = await response.json();
            setData(data);
            toast.success('Data fetched successfully!');

            if (user && user.paymentStatus !== 'success') {
                setGenerateCount(generateCount - 1);
            }
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const convertDuration = (duration) => {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (parseInt(match[1], 10) || 0);
        const minutes = (parseInt(match[2], 10) || 0);
        const seconds = (parseInt(match[3], 10) || 0);

        return `${hours > 0 ? hours + ' hours, ' : ''}${minutes > 0 ? minutes + ' minutes, ' : ''}${seconds > 0 ? seconds + ' seconds' : ''}`.trim();
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page head metadata */}
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:image" content={meta.image} />
                <meta name="twitter:card" content={meta.image} />
                <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
                <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/monetization-checker" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content={meta.image} />
            </Head>
            {/* Toast container for notifications */}
            <ToastContainer />
            {/* Page title */}
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">YouTube Monetization Checker</h1>
            {/* Alert message for logged in/out users */}
            <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
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
            {/* Input field and button */}
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <input
                        type="text"
                        className="form-control block w-full px-3 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter YouTube Video or Channel URL..."
                        value={url}
                        onChange={handleInputChange}
                    />
                    <small className='text-muted'>Example:https://www.youtube.com/watch?v=FoU6-uRAmCo&t=1s</small>
                </div>
                <button
                    className={`btn btn-danger w-full py-2 text-white font-bold rounded transition-colors duration-200 ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'} focus:outline-none focus:shadow-outline`}
                    onClick={handleFetchClick}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Check Monetization'}
                </button>
            </div>
            {/* Error message */}
            {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
            {/* Display fetched data */}
            {data && (
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    {data.type === 'video' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <Image
                                    src={data.thumbnails.high.url}
                                    alt="Video Thumbnail"
                                    width={300}
                                    height={300}
                                    className="rounded-lg"
                                />
                            </div>
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 border">Property</th>
                                        <th className="px-4 py-2 border">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-2 border">Video URL</td>
                                        <td className="px-4 py-2 border"><a href={data.videoUrl} target="_blank" rel="noopener noreferrer">{data.videoUrl}</a></td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Channel URL</td>
                                        <td className="px-4 py-2 border"><a href={data.channelUrl} target="_blank" rel="noopener noreferrer">{data.channelUrl}</a></td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Title</td>
                                        <td className="px-4 py-2 border">{data.title}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Description</td>
                                        <td className="px-4 py-2 border">{data.description}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">View Count</td>
                                        <td className="px-4 py-2 border">{data.viewCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Like Count</td>
                                        <td className="px-4 py-2 border">{data.likeCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Dislike Count</td>
                                        <td className="px-4 py-2 border">{data.dislikeCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Comment Count</td>
                                        <td className="px-4 py-2 border">{data.commentCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Duration</td>
                                        <td className="px-4 py-2 border">{convertDuration(data.duration)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Published At</td>
                                        <td className="px-4 py-2 border">{data.publishedAt}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Channel Title</td>
                                        <td className="px-4 py-2 border">{data.channelTitle}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Monetization Status</td>
                                        <td className="px-4 py-2 border">{data.isMonetized}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    )}
                    {data.type === 'channel' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <Image
                                    src={data.thumbnails.high.url}
                                    alt="Channel Thumbnail"
                                    width={300}
                                    height={300}
                                    className="rounded-lg"
                                />
                            </div>
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 border">Property</th>
                                        <th className="px-4 py-2 border">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-2 border">Channel URL</td>
                                        <td className="px-4 py-2 border"><a href={data.channelUrl} target="_blank" rel="noopener noreferrer">{data.channelUrl}</a></td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Channel Title</td>
                                        <td className="px-4 py-2 border">{data.title}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Description</td>
                                        <td className="px-4 py-2 border">{data.description}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">View Count</td>
                                        <td className="px-4 py-2 border">{data.viewCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Subscriber Count</td>
                                        <td className="px-4 py-2 border">{data.subscriberCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Video Count</td>
                                        <td className="px-4 py-2 border">{data.videoCount}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 border">Monetization Status</td>
                                        <td className="px-4 py-2 border">{data.isMonetized}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}
            {/* Render content from API */}
            <div className="content pt-6 pb-5">
            <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
            </div>
            <ToastContainer autoClose={5000} position="top-right" />
        </div>
    );
};

export default MonetizationChecker;
