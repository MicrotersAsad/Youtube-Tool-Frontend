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
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Channel Name:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{channelInfo.channelTitle}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Subscriber Count:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{channelInfo.subscriberCount}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Video Count:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{channelInfo.channelVideo}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Description:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{channelInfo.channelDescription}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Total Views:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{channelInfo.additionalInfo?.totalViews}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Joined Date:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{channelInfo.additionalInfo?.joinedDate}</td>
              </tr>
              <tr>
               
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>External Links:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {channelInfo.externalLinks?.length > 0 ? (
                    <ul style={{ paddingLeft: '16px' }}>
                      {channelInfo.externalLinks.map((link, index) => (
                        <li key={index}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
