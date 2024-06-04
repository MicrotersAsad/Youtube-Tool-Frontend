/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaShareAlt,
  FaTwitter,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";

const YtEmbedCode = () => {
  const { user, updateUserProfile } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateCount, setGenerateCount] = useState(2);
  const [showShareIcons, setShowShareIcons] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/api/content?category=YouTube-Embed-Code-Generator`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        console.log(data);
        if (data && data.length > 0 && data[0].content) {
          const sanitizedContent = sanitizeHtml(data[0].content, {
            allowedTags: ["h2", "h3", "p", "li", "a"],
            allowedAttributes: {
              a: ["href"],
            },
          });
          setContent(sanitizedContent);
          setMeta({
            title: data[0].title || "Youtube Embed Code Generator",
            description:
              data[0].description ||
              "Generate captivating YouTube titles instantly to boost your video's reach and engagement. Enhance your content strategy with our easy-to-use YouTube Title Generator.",
            image: data[0].image || "https://yourwebsite.com/og-image.png",
          });
        } else {
          toast.error("Content data is invalid");
        }
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
    if (user && user.paymentStatus !== 'success') {
      setGenerateCount(2);
    }
  }, [user]);

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  const fetchYouTubeData = async () => {
    if (!videoUrl) {
      setError('Please enter a valid YouTube URL');
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (user && user.paymentStatus !== 'success' && generateCount <= 0) {
      toast.error("You have reached the limit of generating embed codes. Please upgrade your plan for unlimited use.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const videoId = extractVideoId(videoUrl);
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );

      setEmbedCode(
        `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      );

      if (user && user.paymentStatus !== 'success') {
        setGenerateCount(generateCount - 1);
      }
    } catch (error) {
      setError("Failed to fetch YouTube data. Please check the video URL.");
      setEmbedCode("");
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    const match = url.match(regex);
    return match ? match[2] : null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta
          property="og:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta
          property="og:image"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
        <meta
          name="twitter:card"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
        <meta
          property="twitter:domain"
          content="https://youtube-tool-frontend.vercel.app/"
        />
        <meta
          property="twitter:url"
          content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator"
        />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta
          name="twitter:image"
          content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8"
        />
      </Head>
      <ToastContainer />
      <h2 className="text-3xl pt-5">Youtube Embed Code Generator</h2>
      <div
        className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3"
        role="alert"
      >
        <div className="flex">
          <div className="py-1">
            <svg
              className="fill-current h-6 w-6 text-yellow-500 mr-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            ></svg>
          </div>
          <div>
            {user ? (
              user.paymentStatus === 'success' ? (
                <p className="text-center p-3 alert-warning">
                  Congratulation!! Now You Got Unlimited Access.
                </p>
              ) : (
                <p className="text-center p-3 alert-warning">
                  You are not upgrade Package. You can generate embed codes {generateCount} more times. <Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link> for unlimited access.
                </p>
              )
            ) : (
              <p className="text-center p-3 alert-warning">
                Please log in to use this tool.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="row justify-content-center pt-5">
        <div className="col-md-6">
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter YouTube Video URL..."
              aria-label="YouTube Video URL"
              value={videoUrl}
              onChange={handleUrlChange}
            />
            <button
              className="btn btn-danger"
              type="button"
              onClick={fetchYouTubeData}
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch Video"}
            </button>
          </div>
          <small className="text-muted">
            Example: https://youtu.be/eUDKzw0gLg
          </small>
          <br />
          <div className="ms-5">
            <button className="btn btn-danger mt-3" onClick={handleShareClick}>
              <FaShareAlt />
            </button>
            {showShareIcons && (
              <div className="share-icons mt-3">
                <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                <FaInstagram className="instagram-icon" onClick={() => shareOnSocialMedia('instagram')} />
                <FaTwitter className="twitter-icon" onClick={() => shareOnSocialMedia('twitter')} />
                <FaLinkedin className="linkedin-icon" onClick={() => shareOnSocialMedia('linkedin')} />
              </div>
            )}
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {embedCode && (
            <div>
              <video width="320" height="240" controls preload="none">
                <source src={embedCode} type="video/mp4" />
              </video>
              <h4 className="mt-4">Embed Code:</h4>
              <textarea
                className="form-control"
                rows="3"
                readOnly
                value={embedCode}
              ></textarea>
            </div>
          )}
        </div>
        <div className="content pt-6 pb-5">
          <div dangerouslySetInnerHTML={{ __html: content }}></div>
        </div>
      </div>
    </div>
  );
};

export default YtEmbedCode;
