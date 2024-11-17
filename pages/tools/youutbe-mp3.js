// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!url) {
      setMessage('Please enter a valid YouTube URL');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch(`/api/youtube-mp3?url=${encodeURIComponent(url)}`);
  
      if (!response.ok) {
        const error = await response.text(); // Read the error as plain text (HTML or JSON)
        setMessage(`Error: ${error}`);
        return;
      }
  
      // Convert the response into a Blob and trigger a download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'download.mp3'; // Default file name
      link.click();
  
      setMessage('Download complete!');
    } catch (error) {
      console.error('Download Error:', error);
      setMessage('An error occurred while downloading.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>YouTube to MP3 Converter</h1>
      <input
        type="text"
        placeholder="Enter YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{
          padding: '10px',
          width: '300px',
          marginBottom: '10px',
        }}
      />
      <br />
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007BFF',
          color: '#fff',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Downloading...' : 'Download MP3'}
      </button>
      {message && <p style={{ marginTop: '20px', color: '#d9534f' }}>{message}</p>}
    </div>
  );
}
