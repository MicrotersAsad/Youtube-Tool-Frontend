import { useState } from 'react';
import axios from 'axios';

export default function HomePage() {
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState('');
    const [imageCount, setImageCount] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`/api/scrapet?keyword=${encodeURIComponent(keyword)}`);
            console.log('API Response:', response.data); // Log the API response for debugging
            setVideos(response.data.videos);
            setImageCount(response.data.image_count);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>YouTube Video Scraper</h1>
            <div>
                <label>
                    Keyword:
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </label>
            </div>
            <button onClick={fetchData} disabled={loading}>
                {loading ? 'Fetching...' : 'Fetch Videos'}
            </button>
            {error && <p>{error}</p>}
            {videos.length > 0 && (
                <div>
                    <h2>Videos for "{keyword}"</h2>
                    <div>Total Images: {imageCount}</div>
                    <div className="video-grid">
                        {videos.map((video, index) => (
                            <div key={index} className="video-card">
                                <img src={video.thumbnail} alt={video.title} />
                                <h3><a href={video.url} target="_blank" rel="noopener noreferrer">{video.title}</a></h3>
                                <p>{video.channel}</p>
                                <p>{video.views}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <style jsx>{`
                .video-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                }
                .video-card {
                    border: 1px solid #ddd;
                    padding: 16px;
                    border-radius: 8px;
                    text-align: center;
                }
                .video-card img {
                    max-width: 100%;
                    border-radius: 8px;
                }
                .video-card h3 {
                    font-size: 16px;
                    margin: 8px 0;
                }
                .video-card p {
                    font-size: 14px;
                    color: #555;
                }
            `}</style>
        </div>
    );
}
