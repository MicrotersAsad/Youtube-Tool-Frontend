import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

const MonetizationChecker = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setError('');
        setUrl(e.target.value);
    };

    const handleFetchClick = async () => {
        if (!url.trim()) {
            toast.error('Please enter a valid URL.');
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
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">YouTube Monetization Checker</h1>
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <input
                        type="text"
                        className="form-control block w-full px-3 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter YouTube Video or Channel URL..."
                        value={url}
                        onChange={handleInputChange}
                    />
                </div>
                <button
                    className={`btn btn-danger w-full py-2 text-white font-bold rounded transition-colors duration-200 ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-700'} focus:outline-none focus:shadow-outline`}
                    onClick={handleFetchClick}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Check Monetization'}
                </button>
            </div>
            {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
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
                                        <td className="px-4 py-2 border">{data.duration}</td>
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
            <ToastContainer autoClose={5000} position="top-right" />
        </div>
    );
};

export default MonetizationChecker;
