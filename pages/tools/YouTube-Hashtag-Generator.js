
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
import sanitizeHtml from 'sanitize-html';


const YouTubeHashtagGenerator = () => {
  // State variables
  const { isLoggedIn } = useAuth();
  const [tags, setTags] = useState([]); // Array to store entered tags
  const [keyword, setKeyword] = useState(""); // keyword value for adding new tag
  const [generateHashTag, setgenerateHashTag] = useState([]); // Array to store generated titles
  const [isLoading, setIsLoading] = useState(false); // Loading state for API requests
  const [showCaptcha, setShowCaptcha] = useState(false); // Whether to show ReCAPTCHA
  const [showShareIcons, setShowShareIcons] = useState(false); // Whether to show social media share icons
  const [generateCount, setGenerateCount] = useState(0); // generated count show 
  const recaptchaRef = useRef(null); // Reference to ReCAPTCHA component
  const apiKey = process.env.NEXT_PUBLIC_API_KEY; // API key for OpenAI
  const [selectAll, setSelectAll] = useState(false); // Whether all titles are selected
const [prompt,setPromot]=useState('')
const [content,setContent]=useState('')


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
  
useEffect(()=>{
  fetch('/api/deal')
  .then(res=>res.json())
  .then(data=>setPromot(data[0]))
},[])

useEffect(() => {
  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      console.log("Content data:", data); // Check the fetched data
      
      // Check if data is an array and contains content
      if (Array.isArray(data) && data.length > 0 && data[0].content) {
        // Sanitize the content while allowing certain tags
        const sanitizedContent = sanitizeHtml(data[0].content, {
          allowedTags: ['h2', 'h3', 'p', 'li', 'a'],
          allowedAttributes: {
            'a': ['href']
          }
        });

        setContent(sanitizedContent);
      } else {
        // Handle the case when data or data[0].content is not available
        console.error("Content data is invalid:", data);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setError(error.message);
    }
  };

  fetchContent();
}, []);


console.log(content);
  // Function to handle user input for adding tags
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const newTag = keyword.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setKeyword("");
      }
    }
  };

  // Function to handle selecting all titles
  const handleSelectAll = () => {
    const newSelection = !selectAll;
    setSelectAll(newSelection);
    setgenerateHashTag(
      generateHashTag.map((title) => ({
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
    const newTitles = [...generateHashTag];
    newTitles[index].selected = !newTitles[index].selected;
    setgenerateHashTag(newTitles);
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
    const selectedTitlesText = generateHashTag
      .filter((title) => title.selected)
      .map((title) => title.text)
      .join("\n");
    copyToClipboard(selectedTitlesText);
  };

  // Function to download selected titles
  const downloadSelectedTitles = () => {
    const selectedTitlesText = generateHashTag
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
  const generatedHashTag = async () => {
    setIsLoading(true);
    setShowCaptcha(true);
    console.log(tags.join(", ") );
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
                content: `${prompt.outline}`,
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
      setgenerateHashTag(titles);
    } catch (error) {
      console.error("Error generating titles:", error);
      setgenerateHashTag([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl pt-5">YouTube Hashtag Generator</h2>
      <div className="text-center pt-4 pb-4">
      <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                    </div>
                    <div>
                        {isLoggedIn ? (
                            <p className="text-center p-3 alert-warning">
                                You are logged in and can generate unlimited tags.
                            </p>
                        ) : (
                            <p className="text-center p-3 alert-warning">
                                You are not logged in. You can generate tags {5 - generateCount}{" "}
                                more times.<Link href="/register" className="btn btn-warning ms-3">Registration</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
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
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          required
        />
      </div>
      <p className="text-muted text-center"> Example : php, html, css</p>
      <div className="center">
        <div className="d-flex justify-between items-center pt-5">
          <button
            className="btn btn-danger"
            onClick={generatedHashTag}
            disabled={isLoading || tags.length === 0}
          >
            <span>
              {" "}
              {isLoading ? "Generating..." : "Generate HashTag"} 
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
        {generateHashTag.map((title, index) => (
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
        {generateHashTag.some((title) => title.selected) && (
          <button className="btn btn-danger" onClick={copySelectedTitles}>
            Copy <FaCopy />
          </button>
        )}
        {generateHashTag.some((title) => title.selected) && (
          <button
            className="btn btn-danger ms-2"
            onClick={downloadSelectedTitles}
          >
            Download <FaDownload />
          </button>
        )}
      </div>
      <div>
      
</div>
<div className="content pt-6 pb-5">
    <div dangerouslySetInnerHTML={{ __html: content }} />
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
    .content {
      color: #333; // Change the color to match your design
      font-size: 16px; // Adjust the font size as needed
      line-height: 1.6; // Adjust the line height for readability
      // Add any other styles you want to apply to the content
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
export default YouTubeHashtagGenerator;
