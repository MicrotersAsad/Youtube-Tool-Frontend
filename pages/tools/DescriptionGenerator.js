
/* eslint-disable react/no-unescaped-entities */

import React, { useState, useRef } from "react";
import { FaShareAlt, FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaCog, FaCopy, FaDownload } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

const  DescriptionGenerator= () => {
    const { isLoggedIn } = useAuth();
    const [tags, setTags] = useState([]);
    const [input, setInput] = useState("");
    const [generateDescription, setgenerateDescription] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [showShareIcons, setShowShareIcons] = useState(false);
    const recaptchaRef = useRef(null);
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const [generateCount, setGenerateCount] = useState(0);
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

 
    const shareOnSocialMedia = (socialNetwork) => {
        const url = encodeURIComponent(window.location.href);
        const socialMediaUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}`,
            instagram: "You can share this page on Instagram through the Instagram app on your mobile device.",
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        };

        if (socialNetwork === 'instagram') {
            alert(socialMediaUrls[socialNetwork]);
        } else {
            window.open(socialMediaUrls[socialNetwork], "_blank");
        }
    };

    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };



    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied: "${text}"`);
        }, (err) => {
            console.error('Failed to copy text: ', err);
        });
    };
    
 
    const generateTitles = async () => {
        setIsLoading(true);
        setShowCaptcha(true);
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo-16k",
                    messages: [
                        { role: "system", content: `Generate a Youtube Video description  SEO-friendly  for all keywords "${tags.join(", ")}".` },
                        { role: "user", content: tags.join(", ") }
                    ],
                    temperature: 0.7,
                    max_tokens: 3500,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            const data = await response.json();
            const titles = data.choices[0].message.content.trim().split("\n").map(title => ({
                text: title,
                selected: false
            }));
            setgenerateDescription(titles);
        } catch (error) {
            console.error("Error generating titles:", error);
            setgenerateDescription([]);
        } finally {
            setIsLoading(false);
        }
    };
    const copySelectedTitles = () => {
        const titlesText = generateDescription.map(title => title.text).join("\n");
        copyToClipboard(titlesText);
    };
    
    const downloadSelectedTitles = () => {
        const element = document.createElement("a");
        const file = new Blob([generateDescription.map(title => title.text).join("\n")], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "GeneratedDescription.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };
    

    return (
        <div className="container p-5">
            <h2>YouTube Description Generator</h2>
            {isLoggedIn ? (
                <p>You are logged in and can generate unlimited tags.</p>
            ) : (
                <p>You are not logged in. You can generate tags {5 - generateCount} more times.</p>
            )}
            <div className="keywords-input center rounded">
                <div className="tags">
                    {tags.map((tag, index) => (
                        <span className="tag" key={index}>
                            {tag}
                            <span className="remove-btn" onClick={() => setTags(tags.filter((_, i) => i !== index))}>
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
                <div className="d-flex pt-5">
                    <button className="btn btn-primary" onClick={generateTitles} disabled={isLoading|| tags.length === 0 }>
                        {isLoading ? "Generating..." : "Generate Description"} <FaCog />
                    </button>
                    <button className="btn btn-primary ms-5" onClick={handleShareClick}>
                        Share <FaShareAlt />
                    </button>
                    {showShareIcons && (
                        <div className="share-icons ms-2">
                            <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                            <FaInstagram
                                className="instagram-icon"
                                onClick={() => shareOnSocialMedia('instagram')}
                            />
                            <FaTwitter className="twitter-icon" onClick={() => shareOnSocialMedia('twitter')} />
                            <FaLinkedin className="linkedin-icon" onClick={() => shareOnSocialMedia('linkedin')} />
                        </div>
                    )}
                   
                </div>
                
            </div>
            {showCaptcha && (
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_CAPTCHA_KEY}
                    onChange={value => setShowCaptcha(!value)}
                />
            )}
            <div className="generated-titles-container border">
                
                {generateDescription.map((title, index) => (
                    <div key={index}>
                       
                        {title.text}
                        <br/>
                        <button className="btn btn-primary" onClick={copySelectedTitles}>
                        Copy  <FaCopy />
                    </button>
                    
              
             
                    <button className="btn btn-primary ms-2" onClick={downloadSelectedTitles}>
                        Download  <FaDownload />
                    </button>
                    </div>
                    
                ))}
              
                   
               
            </div>
            <h3>Introduction to Our YouTube Tag Generator</h3>
            <p>
                Tags are super descriptive keywords, or we can use phrases that can
                help content creators market their content; on the other hand, with
                the help of tags, viewers can reach out to the correct video content.
                With the proper tags, a YouTube channel owner can grow their audience
                and increase views on their content.
            </p>
            <h3>What is a YouTube Tag?</h3>
            <p>
                YouTube tags are known as &apos;Video Tags&apos;. They are a collection of words
                and phrases used to describe YouTube videos. Tags are a crucial ranking factor
                in the YouTube algorithm.
            </p>
            <p>
                Why are tags important? Tags help to categorize content and improve its discoverability,
                making it easier for viewers to find relevant videos based on their interests.
            </p>

            <h3>Why Are YouTube Tags Important?</h3>
            <p>
                Generally, tags are an opportunity to increase your video content
                reachability, including your video content topics, category, and many
                more. Tags connect directly relate to the YouTube ranking.
            </p>
            <h3>Why Should We Use a YouTube Tag Generator?</h3>
            <p>
                YouTube Video tags generator is a tool you can get free and paid for,
                which can help you generate SEO-optimized keywords and tags for your
                videos. With the help of that tags, you can make your video content
                easily.
            </p>
            <p>
                Now, you know that with the help of that tags, you can create YouTube
                tags to get more reach, but which tool will be best for you that can
                produce your result accurately? There are many Tags generators for
                YouTube in the market, and more options must be clarified.
            </p>
            <p>
                Now that we've outlined everything you need to know about YTubeTool,
                we'd like to make your decision simple. We will show you how it will
                simplify your work.
            </p>
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
export default DescriptionGenerator;