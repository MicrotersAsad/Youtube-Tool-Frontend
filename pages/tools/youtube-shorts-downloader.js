import React, { useState, useEffect } from "react";
import axios from "axios";

const YtShorttdw = () => {
    const [url, setUrl] = useState("");
  const [formats, setFormats] = useState([]);
  const [thumbnail, setThumbnail] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState("video");

  useEffect(() => {
    let timer;
    if (loading) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const fetchFormats = async () => {
    setError("");
    setFormats([]);
    setThumbnail("");
    setVideoTitle("");

    if (!url) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("https://ytd.mhnazmul.com/getFormats", { url });
      setFormats(response.data.formats);
      setThumbnail(response.data.thumbnail);
      setVideoTitle(response.data.videoTitle);
    } catch (err) {
      setError("Error fetching video formats.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type, itag) => {
    const downloadUrl = `https://ytd.mhnazmul.com/download${type}?url=${encodeURIComponent(
      url
    )}&itag=${itag}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <div className="  p-6">
        <form
          className="flex flex-col md:flex-row gap-4 items-center justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            fetchFormats();
          }}
        >
          <div className="flex-1">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <span className="px-4 py-3">
                <img
                  src="https://img.icons8.com/color/48/000000/youtube-play.png"
                  alt="YouTube Icon"
                  className="w-12 h-12"
                />
              </span>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-4 py-3 border-l focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium text-white ${
              loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? `Loading... ${countdown}s` : "Search"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-red-600 font-medium">{error}</div>
        )}

        {thumbnail && (
          <div className="mt-6 text-center">
            <img
              src={thumbnail}
              alt="Video Thumbnail"
              className="w-full max-h-100 object-cover rounded-lg"
            />
            <h3 className="mt-4 text-lg font-bold">{videoTitle}</h3>
          </div>
        )}

        {formats.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-center space-x-4">
              <button
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "video"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("video")}
              >
                Video
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "audio"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("audio")}
              >
                Audio
              </button>
            </div>

            <div className="mt-4">
              {activeTab === "video" && (
                <div>
                  <h5 className="text-center font-medium mb-4">Available Video Formats</h5>
                  {formats
                    .filter((format) => format.type === "video")
                    .map((format, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b"
                      >
                        <span>{`${format.qualityLabel} (mp4)`}</span>
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                          onClick={() => handleDownload("Video", format.itag)}
                        >
                          Download
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === "audio" && (
                <div>
                  <h5 className="text-center font-medium mb-4">Available Audio Formats</h5>
                  {formats
                    .filter((format) => format.type === "audio")
                    .map((format, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b"
                      >
                        <span>{`Audio (mp3)`}</span>
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                          onClick={() => handleDownload("Audio", format.itag)}
                        >
                          Download
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default YtShorttdw;