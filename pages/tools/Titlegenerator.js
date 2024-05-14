/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef, useEffect } from "react";
import { FaShareAlt, FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaCog, FaCopy, FaDownload, FaShare } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import Head from 'next/head'; // Import Head component

const TitleGenerator = () => {
    const { isLoggedIn } = useAuth();
    const [tags, setTags] = useState([]);
    const [input, setInput] = useState("");
    const [generatedTitles, setGeneratedTitles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [showShareIcons, setShowShareIcons] = useState(false);
    const recaptchaRef = useRef(null);
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const [selectAll, setSelectAll] = useState(false);
    const [generateCount, setGenerateCount] = useState(0);
    useEffect(() => {
        if (!isLoggedIn) {
            setGenerateCount(5);
        }
    }, [isLoggedIn]);
    // Function to handle key down event for adding tags
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

    // Function to handle select all checkbox
    const handleSelectAll = () => {
        const newSelection = !selectAll;
        setSelectAll(newSelection);
        setGeneratedTitles(generatedTitles.map(title => ({
            ...title,
            selected: newSelection
        })));
    };

    // Function to share on social media
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

    // Function to handle share button click
    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    // Function to toggle title selection
    const toggleTitleSelect = index => {
        const newTitles = [...generatedTitles];
        newTitles[index].selected = !newTitles[index].selected;
        setGeneratedTitles(newTitles);
        setSelectAll(newTitles.every(title => title.selected));
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied: "${text}"`);
        }, (err) => {
            console.error('Failed to copy text: ', err);
        });
    };
    
    // Function to copy selected titles
    const copySelectedTitles = () => {
        const selectedTitlesText = generatedTitles
            .filter(title => title.selected)
            .map(title => title.text)
            .join("\n");
        copyToClipboard(selectedTitlesText);
    };

    // Function to download selected titles
    const downloadSelectedTitles = () => {
        const selectedTitlesText = generatedTitles
            .filter(title => title.selected)
            .map(title => title.text)
            .join("\n");
        const element = document.createElement("a");
        const file = new Blob([selectedTitlesText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "selected_titles.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    // Function to generate titles
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
                        { role: "system", content: `Generate a list of at least 20 SEO-friendly titles for all keywords "${tags.join(", ")}". Each title must be 140-160 characters and use a list tag.` },
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
            <Head>
            {/* Open Graph meta tags */}
            <meta property="og:title" content="YouTube Title Generator" />
            <meta property="og:description" content="Generate SEO-friendly YouTube video titles based on your tags." />
            {typeof window !== 'undefined' && (
                <meta property="og:url" content={window.location.href} />
            )}
        </Head>
            {/* Component title */}
            <h2 className="text-3xl">YouTube Title Generator</h2>
            {/* Logged in status */}
            <div className="text-center pt-4 pb-4">
        {isLoggedIn ? (
          <p className="text-center p-3 alert-warning">
            You are logged in and can generate unlimited tags.
          </p>
        ) : (
          <p className="text-center p-3 alert-warning">
            You are not logged in. You can generate tags {5 - generateCount}{" "}
            more times.<button className="btn btn-warning">Registration</button>
          </p>
        )}
      </div>
            {/* Tags input */}
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
            {/* Buttons section */}
            <div className="center">
                <div className="d-flex pt-5">
                    <button className="btn btn-danger" onClick={generateTitles} disabled={isLoading|| tags.length === 0 }>
                        {isLoading ? "Generating..." : "Generate Title"}
                    </button>
                    <button className="btn btn-danger ms-5" onClick={handleShareClick}>
                        <FaShareAlt/> 
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
            {/* ReCAPTCHA component */}
            {showCaptcha && (
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_CAPTCHA_KEY}
                    onChange={value => setShowCaptcha(!value)}
                />
            )}
            {/* Container for generated titles */}
            <div className="generated-titles-container">
                <div className="select-all-checkbox">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                    <span>Select All</span>
                </div>
                {/* Display generated titles */}
                {generatedTitles.map((title, index) => (
                    <div key={index} className="title-checkbox">
                        <input
                            type="checkbox"
                            checked={title.selected}
                            onChange={() => toggleTitleSelect(index)}
                        />
                        {title.text}
                        <FaCopy className="copy-icon" onClick={() => copyToClipboard(title.text)} />
                    </div>
                ))}
                {/* Button to copy selected titles */}
                {generatedTitles.some(title => title.selected) && (
                    <button className="btn btn-primary" onClick={copySelectedTitles}>
                        Copy  <FaCopy />
                    </button>
                )}
                {/* Button to download selected titles */}
                {generatedTitles.some(title => title.selected) && (
                    <button className="btn btn-primary ms-2" onClick={downloadSelectedTitles}>
                        Download  <FaDownload />
                    </button>
                )}
            </div>
          
            {/* Inline CSS */}
            <style jsx>{styles}</style>
          
        </div>
    );
};

// CSS styles
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
