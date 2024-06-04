import React, { useState, useRef, useEffect } from "react";
import { FaShareAlt, FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaCopy, FaDownload } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import Head from 'next/head';
import sanitizeHtml from 'sanitize-html';
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const TagGenerator = () => {
    const { user, updateUserProfile } = useAuth();
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
    const [content, setContent] = useState('');
    const [meta, setMeta] = useState({ title: '', description: '', image: '' });
    const [isUpdated, setIsUpdated] = useState(false);
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(`/api/content?category=tagGenerator`);
                if (!response.ok) {
                    throw new Error('Failed to fetch content');
                }
                const data = await response.json();
                console.log(data);
                if (data && data.length > 0 && data[0].content) {
                    const sanitizedContent = sanitizeHtml(data[0].content, {
                        allowedTags: ['h2', 'h3', 'p', 'li', 'a'],
                        allowedAttributes: {
                            'a': ['href']
                        }
                    });
                    setContent(sanitizedContent);
                    setMeta({
                        title: data[0].title || 'YouTube Tag Generator',
                        description: data[0].description || 'Generate YouTube tags instantly with our Tag Generator. Boost your video\'s visibility and engagement by finding the best tags. Try it now for free!',
                        image: data[0].image || 'https://yourwebsite.com/og-image.png'
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
            setGenerateCount(5);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { value } = e.target;
        setInput(value);

        const delimiters = [',', '.'];
        const parts = value.split(new RegExp(`[${delimiters.join('')}]`)).map(part => part.trim()).filter(part => part);
        
        if (parts.length > 1) {
            const newTags = [...tags, ...parts];
            setTags(newTags);
            setInput("");
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === "," || event.key === ".") {
            event.preventDefault();
            const newTag = input.trim();
            if (newTag) {
                const newTags = [...tags, ...newTag.split(/[,\.]/).map(tag => tag.trim()).filter(tag => tag)];
                setTags(newTags);
                setInput("");
            }
        }
    };

    const handleSelectAll = () => {
        const newSelection = !selectAll;
        setSelectAll(newSelection);
        setGeneratedTitles(generatedTitles.map(title => ({
            ...title,
            selected: newSelection
        })));
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

    const toggleTitleSelect = index => {
        const newTitles = [...generatedTitles];
        newTitles[index].selected = !newTitles[index].selected;
        setGeneratedTitles(newTitles);
        setSelectAll(newTitles.every(title => title.selected));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`Copied: "${text}"`);
        }, (err) => {
            toast.error('Failed to copy text: ', err);
        });
    };

    const copySelectedTitles = () => {
        const selectedTitlesText = generatedTitles
            .filter(title => title.selected)
            .map(title => title.text)
            .join("\n");
        copyToClipboard(selectedTitlesText);
    };

    const downloadSelectedTitles = () => {
        const selectedTitlesText = generatedTitles
            .filter(title => title.selected)
            .map(title => title.text)
            .join("\n");
        const element = document.createElement("a");
        const file = new Blob([selectedTitlesText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "selected_titles.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const generateTitles = async () => {
        if (user && user.paymentStatus !== 'success' && generateCount <= 0) {
            toast.error("You have reached the limit of generating tags. Please upgrade your plan for unlimited use.");
            return;
        }

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
                        { role: "system", content: `Generate a list of at least 20 SEO-friendly tags for all keywords "${tags.join(", ")}".` },
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

            if (user && user.paymentStatus !== 'success') {
                setGenerateCount(generateCount - 1);
            }
        } catch (error) {
            toast.error("Error generating titles:", error);
            setGeneratedTitles([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta property="og:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:image" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
                <meta name="twitter:card" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
                <meta property="twitter:domain" content="https://youtube-tool-frontend.vercel.app/" />
                <meta property="twitter:url" content="https://youtube-tool-frontend.vercel.app/tools/tagGenerator" />
                <meta name="twitter:title" content={meta.title} />
                <meta name="twitter:description" content={meta.description} />
                <meta name="twitter:image" content="https://unsplash.com/photos/a-green-cloud-floating-over-a-lush-green-field-yb8L9I0He_8" />
            </Head>
            <h2 className="text-3xl">YouTube Tag Generator</h2>
            <ToastContainer/>
            <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-700 px-4 py-3 shadow-md mb-6 mt-3" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>
                    </div>
                    <div>
                        {user ? (
                            user.paymentStatus === 'success' ? (
                                <p className="text-center p-3 alert-warning">
                                    Congratulation!! Now You can generate unlimited tags.
                                </p>
                            ) : (
                                <p className="text-center p-3 alert-warning">
                                You are not Upgrade. You can generate Title {5 - generateCount}{" "}
                                more times.<Link href="/pricing" className="btn btn-warning ms-3">Upgrade</Link>
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
            <div className="keywords-input-container">
                <div className="tags-container">
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
                    className="input-box"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    required
                />
            </div>
            <div className="center">
                <div className="flex flex-wrap gap-2 justify-center pt-5">
                    <button className="btn btn-danger whitespace-nowrap" onClick={generateTitles} disabled={isLoading || tags.length === 0} style={{ minWidth: '50px' }}>
                        {isLoading ? "Generating..." : "Generate Titles"}
                    </button>
                    <button className="btn btn-danger whitespace-nowrap" onClick={handleShareClick} style={{ minWidth: '50px' }}>
                        <FaShareAlt />
                    </button>
                    {showShareIcons && (
                        <div className="flex gap-2">
                            <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                            <FaInstagram className="instagram-icon" onClick={() => shareOnSocialMedia('instagram')} />
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
            <div className="generated-titles-container">
                {generatedTitles.length > 0 && (
                    <div className="select-all-checkbox">
                        <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        <span>Select All</span>
                    </div>
                )}
                {generatedTitles.map((title, index) => (
                    <div key={index} className="title-checkbox">
                        <input
                            className="me-2"
                            type="checkbox"
                            checked={title.selected}
                            onChange={() => toggleTitleSelect(index)}
                        />
                        {title.text}
                        <FaCopy className="copy-icon" onClick={() => copyToClipboard(title.text)} />
                    </div>
                ))}
                {generatedTitles.some(title => title.selected) && (
                    <button className="btn btn-primary" onClick={copySelectedTitles}>
                        Copy <FaCopy />
                    </button>
                )}
                {generatedTitles.some(title => title.selected) && (
                    <button className="btn btn-primary ms-2" onClick={downloadSelectedTitles}>
                        Download <FaDownload />
                    </button>
                )}
            </div>
            <div>
                <div className="content pt-6 pb-5">
                    <div dangerouslySetInnerHTML={{ __html: content }}></div>
                </div>
            </div>
     


            <style jsx>{`
              .keywords-input-container {
                border: 2px solid #ccc;
                padding: 10px;
                border-radius: 10px;
                display: flex;
                align-items: flex-start;
                flex-wrap: wrap;
                min-height: 100px;
                margin: auto;
                width: 100%;
                max-width: 600px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                background-color: #fff;
            }
        
            .tags-container {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 8px;
            }
        
            .tag {
                display: flex;
                align-items: center;
                color: #fff;
                background-color: #0d6efd;
                border-radius: 6px;
                padding: 5px 10px;
                margin-right: 8px;
                margin-bottom: 8px;
                font-size: 14px;
            }
        
            .remove-btn {
                margin-left: 8px;
                cursor: pointer;
                font-weight: bold;
            }
        
            .input-box {
                flex: 1;
                border: none;
                height: 40px;
                font-size: 16px;
                padding: 8px;
                border-radius: 6px;
                width: 100%;
                box-sizing: border-box;
                outline: none;
                margin-top: 8px;
            }
        
            .input-box::placeholder {
                color: #aaa;
            }
        
            @media (max-width: 600px) {
                .keywords-input-container {
                    width: 100%;
                    padding: 8px;
                }
        
                .input-box {
                    height: 35px;
                    font-size: 14px;
                    padding: 6px;
                }
            }
        
            .generated-tags-display {
                background-color: #f2f2f2;
                border-radius: 8px;
                padding: 10px;
                margin-top: 20px;
            }
            `}</style>
        </div>
    );
};

export default TagGenerator;
