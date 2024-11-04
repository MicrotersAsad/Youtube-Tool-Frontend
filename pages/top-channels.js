// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [channelId, setChannelId] = useState('');
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setChannelInfo(null);

    try {
      const response = await fetch(`/api/topChannels?channelId=${encodeURIComponent(channelId)}`);
      const data = await response.json();
      console.log(data);
      
      setChannelInfo(data);
    } catch (error) {
      console.error("Error fetching channel info:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>YouTube Channel Scraper</h1>
      <input
        type="text"
        placeholder="Enter Channel ID"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        style={{ padding: '10px', marginRight: '10px' }}
      />
      <button onClick={handleSearch} disabled={loading} style={{ padding: '10px' }}>
        {loading ? "Searching..." : "Search"}
      </button>

      {channelInfo && (
        <div style={{ marginTop: '20px' }}>
          <h2>Channel Info</h2>
          <p><strong>Channel Name:</strong> {channelInfo.channelTitle}</p>
          <p><strong>Subscriber Count:</strong> {channelInfo.subscriberCount}</p>
        </div>
      )}
    </div>
  );
}
