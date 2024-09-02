import { useEffect, useState } from 'react';
import Link from 'next/link';

const SavedChannels = () => {
  const [savedChannels, setSavedChannels] = useState([]);

  useEffect(() => {
    const channels = JSON.parse(localStorage.getItem('savedChannels') || '[]');
    console.log(channels);
    
    setSavedChannels(channels);
  }, []);

  if (savedChannels.length === 0) {
    return <p>No channels saved.</p>;
  }

  return (
    <div className="saved-channels">
      <h1>Saved Tools</h1>
      <div className="grid-container">
        {savedChannels.map((channel, index) => (
          <div key={index} className="card">
            <div className="card-content">
              <h3 className="card-title">{channel.toolName}</h3>
              <p>
                <strong>Tool URL:</strong>{" "}
                <Link href={channel.toolUrl}>
                  <span target="_blank" rel="noopener noreferrer">
                    {channel.toolUrl}
                  </span>
                </Link>
              </p>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 20px;
        }

        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          background-color: #fff;
        }

        .card-content {
          text-align: center;
        }

        .card-title {
          font-size: 1.25rem;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SavedChannels;
