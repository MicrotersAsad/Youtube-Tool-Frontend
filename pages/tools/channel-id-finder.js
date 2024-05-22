import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChannelIdFinder = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [channelData, setChannelData] = useState(null);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=tagExtractor`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
                const data = await response.json();
                if (data && data.length > 0 && data[0].content) {
                    const sanitizedContent = sanitizeHtml(data[0].content, {
                        allowedTags: ['h2', 'h3', 'p', 'li', 'a'],
                        allowedAttributes: {
                            'a': ['href']
                        }
                    });
                    setContent(sanitizedContent);
                } else {
                    toast.error("Content data is invalid");
                }
            } catch (error) {
                toast.error("Error fetching content");
            }
        };

        fetchContent();
    }, []);
    const fetchVideoData = async (videoUrl) => {
        try {
            const response = await fetch('/api/fetch-channel-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch channel data');
            }
            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Unknown error occurred');
        }
    };

    const handleFetch = async () => {
        if (!videoUrl) {
            toast.error('Please enter a YouTube video URL.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await fetchVideoData(videoUrl);
            setChannelData(data);
            console.log(data);
            toast.success('Channel data fetched successfully!');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-center mb-6">YouTube Channel Data Fetcher</h1>
            <div className="max-w-md mx-auto">
                <div className="input-group mb-4">
                    <input
                        type="text"
                        className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="Enter YouTube Video URL..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        onKeyPress={(event) => {
                            if (event.key === 'Enter') handleFetch();
                        }}
                    />
                </div>
                <button
                    className={`btn btn-danger w-full text-white font-bold py-2 px-4 rounded hover:bg-red-700 focus:outline-none focus:shadow-outline ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
                    onClick={handleFetch}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Fetch Data'}
                </button>
            </div>
            {error && <div className="alert alert-danger text-red-500 text-center mt-4">{error}</div>}
            {channelData && (
                <div className="mt-8">
                    <p><strong>Channel ID:</strong>{channelData.channelId}</p>
                    <p className="text-2xl font-semibold"><strong>channel Name :</strong> {channelData.channelName}</p>
                    <p><strong>Channel URL:</strong> <a href={channelData.channelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">{channelData.channelUrl}</a></p>
                    <p><strong>Description:</strong> {channelData.channelDescription}</p>
                    <p><strong>Subscribers:</strong> {channelData.subscribers}</p>
                    <p><strong>Total Views:</strong> {channelData.totalViews}</p>
                    <p><strong>Video Count:</strong> {channelData.videoCount}</p>
                    <p><strong>Tags:</strong> {channelData.channelTags}</p>
                    <div className="flex flex-wrap justify-center mt-4">
                        <img src={channelData.channelProfileImage} alt="Channel Profile" className="w-24 h-24 rounded-full mx-2" />
                        <img src={channelData.channelBannerImage} alt="Channel Banner" className="w-full rounded-lg" />
                    </div>
                </div>
            )}
            <ToastContainer autoClose={5000} />
        </div>
    );
};

export default ChannelIdFinder;
