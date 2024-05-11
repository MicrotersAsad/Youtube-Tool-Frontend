/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { FaShareAlt, FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaCog, FaCopy, FaDownload } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext'; // Importing custom AuthContext
import ReCAPTCHA from 'react-google-recaptcha';
import Link from 'next/link';

const DescriptionGenerator = () => {
    const { isLoggedIn } = useAuth(); // Using custom AuthContext hook
    const [tags, setTags] = useState([]); // State for tags
    const [input, setInput] = useState(''); // State for input field
    const [generateDescription, setGenerateDescription] = useState([]); // State for generated descriptions
    const [isLoading, setIsLoading] = useState(false); // State for loading indicator
    const [showCaptcha, setShowCaptcha] = useState(false); // State for showing captcha
    const [showShareIcons, setShowShareIcons] = useState(false); // State for showing share icons
    const recaptchaRef = useRef(null); // Ref for reCAPTCHA component
    const apiKey = process.env.NEXT_PUBLIC_API_KEY; // API key
    const [generateCount, setGenerateCount] = useState(0);
    useEffect(() => {
        if (!isLoggedIn) {
            setGenerateCount(5);
        }
    }, [isLoggedIn]);
    // Effect to set meta tags on component mount
    useEffect(() => {
        // Set document title for better SEO
        document.title = "YouTube Description Generator";
        // Add meta description for better SEO
        const metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = 'Generate SEO-friendly YouTube video descriptions based on your tags.';
        document.querySelector('head').appendChild(metaDesc);
        // Add Open Graph meta tags for social sharing
        const ogTitle = document.createElement('meta');
        ogTitle.property = 'og:title';
        ogTitle.content = 'YouTube Description Generator';
        document.querySelector('head').appendChild(ogTitle);
        const ogDesc = document.createElement('meta');
        ogDesc.property = 'og:description';
        ogDesc.content = 'Generate SEO-friendly YouTube video descriptions based on your tags.';
        document.querySelector('head').appendChild(ogDesc);
        const ogUrl = document.createElement('meta');
        ogUrl.property = 'og:url';
        ogUrl.content = window.location.href;
        document.querySelector('head').appendChild(ogUrl);
    }, []);

    // Function to handle key down event for adding tags
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            const newTag = input.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
                setInput('');
            }
        }
    };

    // Function to share on social media
    const shareOnSocialMedia = (socialNetwork) => {
        const url = encodeURIComponent(window.location.href);
        const socialMediaUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}`,
            instagram: 'You can share this page on Instagram through the Instagram app on your mobile device.',
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        };

        if (socialNetwork === 'instagram') {
            alert(socialMediaUrls[socialNetwork]);
        } else {
            window.open(socialMediaUrls[socialNetwork], '_blank');
        }
    };

    // Function to handle share icon click
    const handleShareClick = () => {
        setShowShareIcons(!showShareIcons);
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied: "${text}"`);
        }, (err) => {
            console.error('Failed to copy text: ', err);
        });
    };

    // Function to generate titles
    const generateTitles = async () => {
        setIsLoading(true);
        setShowCaptcha(true);
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-16k',
                    messages: [
                        { role: 'system', content: `Generate a Youtube Video description SEO-friendly for all keywords "${tags.join(', ')}".` },
                        { role: 'user', content: tags.join(', ') },
                    ],
                    temperature: 0.7,
                    max_tokens: 3500,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                }),
            });

            const data = await response.json();
            const titles = data.choices[0].message.content.trim().split('\n').map(title => ({
                text: title,
                selected: false,
            }));
            setGenerateDescription(titles);
        } catch (error) {
            console.error('Error generating titles:', error);
            setGenerateDescription([]);
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
            <h2 className='text-3xl'>YouTube Description Generator</h2>
            <div className="text-center pt-4 pb-4">
        {isLoggedIn ? (
          <p className="text-center p-3 alert-warning">
            You are logged in and can generate unlimited tags.
          </p>
        ) : (
          <p className="text-center p-3 alert-warning">
            You’re using free version of Ytubetool ||
            You can generate tags {5 - generateCount}{" "}
            more times.<button className="btn btn-warning ms-2"><Link href='/register'>Registration</Link></button>
          </p>
        )}
      </div>
            <div className="keywords-input center rounded">
                <div className="tags">
                    {tags.map((tag, index) => (
                        <div className="tag" key={index}>
                            {tag}
                            <button aria-label={`Remove ${tag}`} className="remove-btn" onClick={() => setTags(tags.filter((_, i) => i !== index))}>
                                ×
                            </button>
                        </div>
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
                <button className="btn btn-primary" onClick={generateTitles} disabled={isLoading || tags.length === 0}>
                    {isLoading ? 'Generating...' : 'Generate Description'} 
                </button>
                <button className="btn btn-primary ms-3" onClick={handleShareClick}>
                    <FaShareAlt />
                </button>
                {showShareIcons && (
                    <div className="share-icons ms-2">
                        <FaFacebook className="facebook-icon" onClick={() => shareOnSocialMedia('facebook')} />
                        <FaInstagram className="instagram-icon" onClick={() => shareOnSocialMedia('instagram')} />
                        <FaTwitter className="twitter-icon" onClick={() => shareOnSocialMedia('twitter')} />
                        <FaLinkedin className="linkedin-icon" onClick={() => shareOnSocialMedia('linkedin')} />
                    </div>
                )}
            </div>
            {showCaptcha && (
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_CAPTCHA_KEY}
                    onChange={(value) => setShowCaptcha(!value)}
                />
            )}
            <div className="generated-titles-container border">
                {generateDescription.map((title, index) => (
                    <div key={index}>
                        {title.text}
                        <br />
                        <button className="btn btn-primary" onClick={() => copyToClipboard(title.text)}>
                            Copy <FaCopy />
                        </button>
                        <button className="btn btn-primary ms-2" onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob([title.text], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = "GeneratedDescription.txt";
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                        }}>
                            Download <FaDownload />
                        </button>
                    </div>
                ))}
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
export default DescriptionGenerator;