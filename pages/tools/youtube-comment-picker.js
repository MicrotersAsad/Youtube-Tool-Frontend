import React, { useState } from 'react';
import axios from 'axios';
import { FaHeart, FaComment } from 'react-icons/fa';
import Link from 'next/link';


const YouTubeCommentPicker = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [includeReplies, setIncludeReplies] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [comments, setComments] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickWinner = async () => {
    setLoading(true);
    try {
      const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
      const response = await axios.get('/api/commentswinner', {
        params: { videoId, includeReplies }
      });
      let allComments = response.data;

      if (filterDuplicates) {
        const uniqueUsers = new Set();
        allComments = allComments.filter(comment => {
          if (uniqueUsers.has(comment.user)) return false;
          uniqueUsers.add(comment.user);
          return true;
        });
      }

      if (filterText) {
        allComments = allComments.filter(comment => comment.text.includes(filterText));
      }

      if (allComments.length > 0) {
        const randomIndex = Math.floor(Math.random() * allComments.length);
        setWinner(allComments[randomIndex]);
      } else {
        setWinner(null);
      }
    } catch (error) {
      console.error('Error fetching comments:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className='text-center'>YouTube Comment Picker</h1>
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=example"
            className="border p-2 rounded sm:w-2/3"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <button
            onClick={handlePickWinner}
            className="bg-red-500 text-white p-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Pick a Winner'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-bold mb-2">YouTube Comment Options:</h3>
            <div className="flex items-center space-x-2 mb-2">
              <label>Include replies to comments</label>
              <input
                type="checkbox"
                checked={includeReplies}
                onChange={() => setIncludeReplies(!includeReplies)}
              />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <label>Filter duplicate users/names</label>
              <input
                type="checkbox"
                checked={filterDuplicates}
                onChange={() => setFilterDuplicates(!filterDuplicates)}
              />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <label>Filter comments on specific text</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">YouTube Raffle Options:</h3>
            <div className="flex items-center space-x-2 mb-2">
              <label>No. of winners:</label>
              <select
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(parseInt(e.target.value))}
                className="border p-2 rounded"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {winner && (
        <div className="bg-white p-4 rounded-lg sm:w-1/3 w center shadow-md mt-5 winner-card">
          <h3 className="text-xl font-bold text-center mb-4">Winner</h3>
          
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-4">
              <img src={winner.avatar} alt={winner.user} className="w-full h-full rounded-full object-cover" />
            </div>
            <p className="text-lg font-bold"><Link target='_blank' href={winner.channelUrl}>@{winner.user}</Link>  </p>
         
            <p className="text-gray-600">{winner.text}</p>
            <div className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-1 text-red-500">
                <FaHeart />
                <span>{winner.likes}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-500">
                <FaComment />
                <span>{winner.replies}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeCommentPicker;
