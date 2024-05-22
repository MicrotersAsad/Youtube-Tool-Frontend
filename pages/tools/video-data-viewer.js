import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaClock, FaEye, FaThumbsUp, FaThumbsDown, FaComments, FaLanguage, FaCalendarAlt, FaVideo, FaTags, FaInfoCircle } from 'react-icons/fa';
import Image from 'next/image';

const VideoDataViewer = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!videoUrl) return; // Do nothing if the URL is not set
        const fetchVideoData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/monetization-checker', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ videoUrl }),
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch video data');
                }
                const data = await response.json();
                data.duration = formatDuration(data.duration); // Format the duration
                setVideoData(data);
                toast.success('Video data fetched successfully!');
            } catch (error) {
                setError(error.message);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVideoData();
    }, [videoUrl]);

    const handleInputChange = (e) => {
        setError('');
        setVideoUrl(e.target.value);
    };

    const handleFetchClick = () => {
        if (!videoUrl.trim()) {
            toast.error('Please enter a valid URL.');
            return;
        }
        setLoading(true);
        setError('');
    };

    const formatDuration = (isoDuration) => {
        const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (parseInt(match[1], 10) || 0);
        const minutes = (parseInt(match[2], 10) || 0);
        const seconds = (parseInt(match[3], 10) || 0);

        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">YouTube Video Data Fetcher</h1>
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <input
                        type="text"
                        className="form-control block w-full px-3 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter YouTube Video URL..."
                        value={videoUrl}
                        onChange={handleInputChange}
                    />
                </div>
                <button
                    className={`btn btn-danger w-full py-2 text-white font-bold rounded transition-colors duration-200 ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'} focus:outline-none focus:shadow-outline`}
                    onClick={handleFetchClick}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Fetch Data'}
                </button>
            </div>
            {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
            {videoData && (
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-center mb-4">
                        <Image
                            src={videoData.thumbnails.high.url}
                            alt="Video Cover"
                            width={880}
                            height={420}
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
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaVideo className="mr-2" /> Category
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.category}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaClock className="mr-2" /> Duration
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.duration}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaEye className="mr-2" /> View Count
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.viewCount}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaThumbsUp className="mr-2" /> <FaThumbsDown className="ml-2" /> Like/Dislike Count
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.likeCount} / {videoData.dislikeCount}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaComments className="mr-2" /> Comment Count
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.commentCount}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaLanguage className="mr-2" /> Audio Language
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.audioLanguage}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaCalendarAlt className="mr-2" /> Published At
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.publishedAt}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaVideo className="mr-2" /> Is Embeddable
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.isEmbeddable}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaTags className="mr-2" /> Video Tags
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.videoTags}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center">
                                        <FaInfoCircle className="mr-2" /> Description
                                    </div>
                                </td>
                                <td className="px-4 py-2 border">{videoData.description}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            <ToastContainer autoClose={5000} position="top-right" />
        </div>
    );
};

export default VideoDataViewer;
