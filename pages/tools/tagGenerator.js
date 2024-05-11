/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef, useEffect } from "react";
import {
  FaShareAlt,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaCog,
  FaCopy,
  FaDownload,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";

const TitleGenerator = () => {
  // State variables
  const { isLoggedIn } = useAuth();
  const [tags, setTags] = useState([]); // Array to store entered tags
  const [input, setInput] = useState(""); // Input value for adding new tag
  const [generatedTitles, setGeneratedTitles] = useState([]); // Array to store generated titles
  const [isLoading, setIsLoading] = useState(false); // Loading state for API requests
  const [showCaptcha, setShowCaptcha] = useState(false); // Whether to show ReCAPTCHA
  const [showShareIcons, setShowShareIcons] = useState(false); // Whether to show social media share icons
  const [generateCount, setGenerateCount] = useState(0); // generated count show 
  const recaptchaRef = useRef(null); // Reference to ReCAPTCHA component
  const apiKey = process.env.NEXT_PUBLIC_API_KEY; // API key for OpenAI
  const [selectAll, setSelectAll] = useState(false); // Whether all titles are selected

  useEffect(() => {
    // Update document title for better SEO
    document.title = "YouTube Tag Generator";
    // Add meta description for better SEO
    const metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    metaDesc.content = "Generate SEO-friendly tags for your YouTube videos.";
    document.querySelector("head").appendChild(metaDesc);
    // Add Open Graph meta tags for social sharing
    const ogTitle = document.createElement("meta");
    ogTitle.property = "og:title";
    ogTitle.content = "YouTube Tag Generator";
    document.querySelector("head").appendChild(ogTitle);
    const ogDesc = document.createElement("meta");
    ogDesc.property = "og:description";
    ogDesc.content = "Generate SEO-friendly tags for your YouTube videos.";
    document.querySelector("head").appendChild(ogDesc);
    const ogUrl = document.createElement("meta");
    ogUrl.property = "og:url";
    ogUrl.content = window.location.href;
    document.querySelector("head").appendChild(ogUrl);
  
    // Update generate count if user is not logged in
    if (!isLoggedIn) {
      setGenerateCount(5);
    }
  }, [isLoggedIn]);
  

  // Function to handle user input for adding tags
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const newTag = input.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setInput("");
      }
    }
  };

  // Function to handle selecting all titles
  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setGeneratedTitles(
      generatedTitles.map((title) => ({
        ...title,
        selected: newSelection,
      }))
    );
  };

  // Function to share on social media
  const shareOnSocialMedia = (socialNetwork) => {
    const url = encodeURIComponent(window.location.href);
    const socialMediaUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      instagram:
        "You can share this page on Instagram through the Instagram app on your mobile device.",
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    if (socialNetwork === "instagram") {
      alert(socialMediaUrls[socialNetwork]);
    } else {
      window.open(socialMediaUrls[socialNetwork], "_blank");
    }
  };

  // Function to handle share button click
  const handleShareClick = () => {
    setShowShareIcons(!showShareIcons);
  };

  // Function to toggle title selection
  const toggleTitleSelect = (index) => {
    const newTitles = [...generatedTitles];
    newTitles[index].selected = !newTitles[index].selected;
    setGeneratedTitles(newTitles);
    setSelectAll(newTitles.every((title) => title.selected));
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert(`Copied: "${text}"`);
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      }
    );
  };

  // Function to copy selected titles
  const copySelectedTitles = () => {
    const selectedTitlesText = generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text)
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  // Function to download selected titles
  const downloadSelectedTitles = () => {
    const selectedTitlesText = generatedTitles
      .filter((title) => title.selected)
      .map((title) => title.text)
      .join("\n");
    const element = document.createElement("a");
    const file = new Blob([selectedTitlesText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "selected_titles.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to generate titles
  const generateTitles = async () => {
    setIsLoading(true);
    setShowCaptcha(true);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-16k",
            messages: [
              {
                role: "system",
                content: `Generate a list of at least 20 SEO-friendly Tag for all keywords "${tags.join(
                  ", "
                )}".`,
              },
              { role: "user", content: tags.join(", ") },
            ],
            temperature: 0.7,
            max_tokens: 3500,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          }),
        }
      );

      const data = await response.json();
      const titles = data.choices[0].message.content
        .trim()
        .split("\n")
        .map((title) => ({
          text: title,
          selected: false,
        }));
      setGeneratedTitles(titles);
    } catch (error) {
      console.error("Error generating titles:", error);
      setGeneratedTitles([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl">YouTube Tag Generator</h2>
      <div className="text-center pt-4 pb-4">
      <p className="text-center p-3 alert-warning">
  {isLoggedIn ? (
    "You are logged in and can generate unlimited tags."
  ) : (
    <span>
      You are not logged in. You can generate tags{" "}
      {isLoggedIn ? "unlimited" : `${5 - generateCount}`} more times.{" "}
      <button className="btn btn-warning">
        <Link href="/register">Register</Link>
      </button>
    </span>
  )}
</p>
      </div>
      <div className="keywords-input center rounded">
        <div className="tags">
          {tags.map((tag, index) => (
            <span className="tag" key={index}>
              {tag}
              <span
                className="remove-btn"
                onClick={() => setTags(tags.filter((_, i) => i !== index))}
              >
                ×
              </span>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add a keyword"
          className="rounded w-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          required
        />
      </div>
      <div className="center">
        <div className="d-flex justify-between items-center pt-5">
          <button
            className="btn btn-danger"
            onClick={generateTitles}
            disabled={isLoading || tags.length === 0}
          >
            <span>
              {" "}
              {isLoading ? "Generating..." : "Generate Tag"} 
            </span>
          </button>
          <div className="share-button-container">
            <button className="btn btn-danger ms-5" onClick={handleShareClick}>
           
              <FaShareAlt className="share-button-icon" />
            </button>
            {showShareIcons && (
              <div className="share-icons ms-2">
                <FaFacebook
                  className="facebook-icon"
                  onClick={() => shareOnSocialMedia("facebook")}
                />
                <FaInstagram
                  className="instagram-icon"
                  onClick={() => shareOnSocialMedia("instagram")}
                />
                <FaTwitter
                  className="twitter-icon"
                  onClick={() => shareOnSocialMedia("twitter")}
                />
                <FaLinkedin
                  className="linkedin-icon"
                  onClick={() => shareOnSocialMedia("linkedin")}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showCaptcha && (
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_CAPTCHA_KEY}
          onChange={(value) => setShowCaptcha(!value)}
        />
      )}
      <div className="generated-titles-container">
        <div className="select-all-checkbox">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
          />
          <span>Select All</span>
        </div>
        {generatedTitles.map((title, index) => (
          <div key={index} className="title-checkbox">
            <input
              type="checkbox"
              checked={title.selected}
              onChange={() => toggleTitleSelect(index)}
            />
           <span className="ms-2"> {title.text}</span>
            <FaCopy
              className="copy-icon"
              onClick={() => copyToClipboard(title.text)}
            />
          </div>
        ))}
        {generatedTitles.some((title) => title.selected) && (
          <button className="btn btn-danger" onClick={copySelectedTitles}>
            Copy <FaCopy />
          </button>
        )}
        {generatedTitles.some((title) => title.selected) && (
          <button
            className="btn btn-danger ms-2"
            onClick={downloadSelectedTitles}
          >
            Download <FaDownload />
          </button>
        )}
      </div>

      <style jsx>{styles}</style>
    </div>
  );
};

const styles = `
    .keywords-input {
        border: 2px solid #ccc;
        padding: 5px;
        border-radius: 10px;
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        min-height: 100px;
        margin: auto;
        width: 50%;
    }

    .keywords-input input {
        flex: 1;
        border: none;
        height: 100px;
        font-size: 14px;
        padding: 4px 8px;
        width: 50%;
    }
    .keywords-input .tag {
        width: auto;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff!important;
        padding: 0 8px;
        font-size: 14px;
        list-style: none;
        border-radius: 6px;
        background-color: #0d6efd;
        margin-right: 8px;
        margin-bottom: 8px;
    }
    .tags {
        display: flex;
        flex-wrap: wrap;
        margin-right: 8px;
    }

    .tag, .generated-tag {
        display: flex;
        align-items: center;

        color: #000000!important;
        border-radius: 6px;
        padding: 5px 10px;
        margin-right: 5px;
        margin-bottom: 5px;
    }

    .remove-btn {
        margin-left: 8px;
        cursor: pointer;
    }

    input:focus {
        outline: none;
    }

    @media (max-width: 600px) {
        .keywords-input, .center {
            width: 100%;
        }

        .btn {
            width: 100%;
            margin-top: 10px.
        }
    }

    .generated-tags-display {
        background-color: #f2f2f2;
        border-radius: 8px;
        padding: 10px.
        margin-top: 20px.
    }
`;
export default TitleGenerator;
