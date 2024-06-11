import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';

const YouTubeChannelScraper = () => {
  const { user, updateUserProfile } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [minSubscriber, setMinSubscriber] = useState(0);
  const [maxSubscriber, setMaxSubscriber] = useState(Infinity);
  const [page, setPage] = useState(0);
  const [meta, setMeta] = useState({ title: '', description: '', image: '' });
  const [isUpdated, setIsUpdated] = useState(false);
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
const apiKey=process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const [generateCount, setGenerateCount] = useState(0);
useEffect(() => {
  const fetchContent = async () => {
      try {
          const response = await fetch(`/api/content?category=YouTube-Channel-finder`);
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
  const handleSearchClick = async (e) => {
    e.preventDefault();
    setLoading(true);
    setChannels([]);
    setFilteredChannels([]);
    setError('');
    if (user && user.paymentStatus !== 'success' && user.role !== 'admin' && generateCount <= 0) {
      toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
      return;
  }
    try {
     

      let nextPageToken = '';
      let totalChannelsData = [];

      while (totalChannelsData.length < 200 && nextPageToken !== null) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(keyword)}&key=${apiKey}&pageToken=${nextPageToken}`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
          throw new Error(`HTTP error! status: ${searchResponse.status}`);
        }
        const searchData = await searchResponse.json();
        const channelIds = searchData.items.map(item => item.snippet.channelId);
        const uniqueChannelIds = [...new Set(channelIds)];
        const channelsData = await getChannelsData(uniqueChannelIds, apiKey);
        totalChannelsData = totalChannelsData.concat(channelsData);
        nextPageToken = searchData.nextPageToken || null;
      }

      const filtered = filterChannels(totalChannelsData);
      setFilteredChannels(filtered);
      setChannels(filtered.slice(0, 50));
    } catch (error) {
      console.error('Error:', error);
      setError(`An error occurred while fetching channel data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterChannels = (channels) => {
    return channels.filter(channel => {
      const subscribers = parseInt(channel.statistics.subscriberCount);
      return subscribers >= minSubscriber && subscribers <= maxSubscriber;
    });
  };

  const getChannelsData = async (channelIds, apiKey) => {
    const detailsPromises = channelIds.map(async channelId => {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${apiKey}`;
      const response = await fetch(detailsUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.items[0];
    });

    return Promise.all(detailsPromises);
  };

  const handlePagination = (pageIndex) => {
    const startIdx = pageIndex * 50;
    const endIdx = startIdx + 50;
    const currentPageChannels = filteredChannels.slice(startIdx, endIdx);
    setChannels(currentPageChannels);
    setPage(pageIndex);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
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
      <h1 className="text-center text-2xl font-bold mb-4">YouTube Channel Finder</h1>
      <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                <div className="flex">
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
      
      <form className="max-w-sm mx-auto" onSubmit={handleSearchClick}>
        <div className="mb-3">
          <label htmlFor="text" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Enter Keyword</label>
          <input
            type="text"
            id="text"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Enter Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="number" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Min Subscriber</label>
          <input
            type="number"
            id="number"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Min Subscriber"
            value={minSubscriber}
            onChange={(e) => setMinSubscriber(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="repeat-number" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Max Subscriber</label>
          <input
            type="number"
            id="repeat-number"
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Max Subscriber"
            value={maxSubscriber}
            onChange={(e) => setMaxSubscriber(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Search
        </button>
      </form>

      {loading && <div className="loader mt-4 mx-auto"></div>}
      {error && <div className="text-red-500 text-center mt-4">{error}</div>}
      <div id="channelList" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 channels-grid">
        {channels.map((channel, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-4 channel-card">
            <img src={channel.snippet.thumbnails.high.url} alt={channel.snippet.title} className="w-full h-auto rounded-md mb-4" />
            <div className="channel-info">
              <Link href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold text-xl">
                {channel.snippet.title}
              </Link>
              <p className="text-gray-700">Subscribers: {channel.statistics.subscriberCount}</p>
              <p className="text-gray-700">Total Views: {channel.statistics.viewCount}</p>
              <p className="text-gray-700">Videos: {channel.statistics.videoCount}</p>
            </div>
          </div>
        ))}
      </div>
      <div id="pagination" className="text-center mt-3">
        {[...Array(Math.ceil(filteredChannels.length / 50)).keys()].map((_, i) => (
          <button key={i} className={`btn btn-sm btn-outline-primary me-2 ${page === i ? 'active' : ''}`} onClick={() => handlePagination(i)}>
            {i + 1}
          </button>
        ))}
      </div>
      <div className="content pt-6 pb-5">
            <div dangerouslySetInnerHTML={{ __html: existingContent }} style={{ listStyleType: 'none' }}></div>
            </div>
      <ToastContainer />
    </div>
  );
};

export default YouTubeChannelScraper;
