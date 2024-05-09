/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaShareAlt, FaFacebook, FaLinkedin, FaInstagram, FaTwitter } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

const TagGenerator = () => {
    const { isLoggedIn } = useAuth();
    const [tags, setTags] = useState([]);
    const [input, setInput] = useState("");
    const [generatedTags, setGeneratedTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generateCount, setGenerateCount] = useState(0);
    const [captchaValidated, setCaptchaValidated] = useState(false);
    const [showShareIcons, setShowShareIcons] = useState(false);
    const tagsRef = useRef(null);
    const recaptchaRef = useRef(null);
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    useEffect(() => {
        // Sync UI with URL state or perform actions that should only happen client-side
    }, []);

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

    const handleCaptchaChange = (value) => {
        setCaptchaValidated(Boolean(value));
    };

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const generateText = async () => {
        if (!captchaValidated) {
            alert("Please complete the CAPTCHA to prove you are not a robot.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo-16k",
                    messages: [
                        { role: "system", content: `Generate a list of at least 20 SEO-friendly tags for all keywords "${tags.join(", ")}".` },
                        { role: "user", content: tags.join(", ") },
                    ],
                    temperature: 0.7,
                    max_tokens: 3500,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                }),
            });

            const data = await response.json();
            if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                setGeneratedTags(data.choices[0].message.content.trim());
            } else {
                console.error("No usable tags generated:", data);
                setGeneratedTags([]);
            }
        } catch (error) {
            console.error("Error generating text:", error);
            setGeneratedTags([]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (tagsRef.current) {
            window.getSelection().selectAllChildren(tagsRef.current);
            document.execCommand("copy");
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

    return (
        <div className="container p-5">
            <h2>Youtube Tag Generator</h2>
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
                            <span className="remove-btn" onClick={() => removeTag(index)}>
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
                />
            </div>

            <div className="text-center">
                <small className="text-muted">Example : travel, dance, animal</small>
            </div>
            <div className="center">
                <div className="d-flex pt-5">
                    <button
                        className="btn btn-primary"
                        onClick={generateText}
                        disabled={isLoading}
                    >
                        {isLoading ? "Generating..." : "Generate Tags"} <FaSearch />
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
            {process.env.NEXT_PUBLIC_CAPTCHA_KEY && (
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_CAPTCHA_KEY}
                    onChange={handleCaptchaChange}
                />
            )}
            {generatedTags.length > 0 && (
                <div className="generated-tags-display" ref={tagsRef}>
                    <h3 className="text-muted">Results</h3>
                    <h5 className="fw-bold">List Of Tags Found</h5>
                    <div className="tags">
                        <span className="generated-tag">{generatedTags}</span>
                    </div>
                    <button className="btn btn-primary" onClick={copyToClipboard}>
                        Copy
                    </button>
                </div>
            )}

            <style jsx>{styles}</style>
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

export default TagGenerator