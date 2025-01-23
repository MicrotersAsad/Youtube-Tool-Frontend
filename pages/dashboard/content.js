import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';


// Dynamically import the QuillWrapper component with SSR disabled
const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function Content() {
  const [quillContent, setQuillContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('tagGenerator'); // Default category
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState(null); // State to hold the existing image URL
  const [faqs, setFaqs] = useState([]);
  const [relatedTools, setRelatedTools] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const { t } = useTranslation('navbar');

  // Static list of all tools
  const allTools = [
    {
      name: "YouTube Tag Generator",
      link: "https://ytubetools.com/tools/tag-generator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733289894208-taggenerator.png",
      description:
        "Generate optimized YouTube tags to boost your video discoverability and SEO.",
    },
    {
      name:"Youtube Tag Extractor",
      link: "http://www.ytubetools.com/tools/tag-extractor",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/title-and-description-extractor.png",
      description:
        "Extract tags from any YouTube video for easy reference and analysis.",
    },
    {
      name: "Youtube Title Generator",
      link: "http://www.ytubetools.com/tools/title-generator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/title-bar.png",
      description:
        "Generate attention-grabbing YouTube titles that increase click-through rates.",
    },
    {
      name: "Youtube Description Generator",
      link: "http://www.ytubetools.com/tools/description-generator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Title-And-Description-Generator.png",
      description:
        "Create compelling video descriptions to improve your YouTube video SEO.",
    },
    {
      name: "Youtube Title&Description Extractor",
      link: "http://www.ytubetools.com/tools/youtube-title-and-description-extractor",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/title-and-description-extractor.png",
      description:
        "Extract YouTube video titles and descriptions for quick access and analysis.",
    },
    {
      name: "YouTube Channel Banner Downloader",
      link: "http://www.ytubetools.com/tools/youtube-channel-banner-downloader",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/youtube-channel-banner-download.png",
      description:
        "Download high-quality YouTube channel banners with just one click.",
    },
    {
      name: "YouTube Hashtag Generator",
      link: "http://www.ytubetools.com/tools/youtube-hashtag-generator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/youtube-hastag-generator.png",
      description:
        "Generate relevant hashtags to boost the visibility of your YouTube videos.",
    },
    {
      name: "YouTube Channel Logo Downloader",
      link: "http://www.ytubetools.com/tools/youtube-channel-logo-downloader",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-channel-logo-downloader.png",
      description: "Download high-resolution YouTube channel logos easily.",
    },
    {
      name: "YouTube Thumbnail Downloader",
      link: "http://www.ytubetools.com/tools/youtube-thumbnail",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-thumbnail-downloader.png",
      description:
        "Download the thumbnails of any YouTube video in high resolution.",
    },
    {
      name: "YouTube Channel ID Finder",
      link: "http://www.ytubetools.com/tools/channel-id-finder",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Channel-ID-Finder.png",
      description:
        "Find the YouTube channel ID for any given YouTube channel URL.",
    },
    {
      name: "YouTube Video Data Viewer",
      link: "http://www.ytubetools.com/tools/video-data-viewer",
      logo: 'https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Video-Data-Viewer.png',
      description: "View detailed data and stats about any YouTube video.",
    },
    {
      name: "YouTube Monetization Checker",
      link: "http://www.ytubetools.com/tools/monetization-checker",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Monetization-Checker.png",
      description:
        "Check if a YouTube channel or video is eligible for monetization.",
    },
    {
      name: "YouTube Channel Search",
      link: "http://www.ytubetools.com/tools/youtube-channel-search",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-channel-search.png",
      description: "Search for YouTube channels based on keywords or names.",
    },
    {
      name: "YouTube Video Summary Generator",
      link: "http://www.ytubetools.com/tools/youtube-video-summary-generator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-Video-Summary-generator.png",
      description:
        "Generate a concise summary of any YouTube video for quick insights.",
    },
    {
      name: "YouTube Trending Videos",
      link: "http://www.ytubetools.com/tools/trending-videos",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/youtube-trending-videos.png",
      description:
        "Discover the latest trending YouTube videos from around the world.",
    },
    {
      name: "YouTube Money Calculator",
      link: "http://www.ytubetools.com/tools/youtube-money-calculator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-Money-Calculator.png",
      description:
        "Estimate the potential earnings of YouTube videos based on views and engagement.",
    },
    {
      name: "Youtube Comment Picker",
      link: "http://www.ytubetools.com/tools/youtube-comment-picker",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Comment-Picker-icon.png",
      description:
        "Pick random comments from any YouTube video for giveaways or contests.",
    },
    {
      name: "YouTube Keyword Research",
      link: "http://www.ytubetools.com/tools/keyword-research",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/youtube-keyword-research.png",
      description:
        "Conduct keyword research for YouTube to identify high-ranking search terms.",
    },
    {
      name: "YouTube Embed Code Generator",
      link: "http://www.ytubetools.com/tools/youtube-embed-code-generator",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/youtube-embad-code-generator.png",
      description:
        "Generate embed codes for YouTube videos for easy sharing on websites and blogs.",
    },
  ];

  useEffect(() => {
    fetchContent();
  }, [selectedCategory, selectedLanguage]); // Fetch content and FAQs when category or language changes

  const fetchContent = async () => {
    try {
      const response = await fetch(
        `/api/content?category=${selectedCategory}&language=${selectedLanguage}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer AZ-fc905a5a5ae08609ba38b046ecc8ef00`, // Add Authorization header
            'Content-Type': 'application/json', // Optional: Include Content-Type if needed
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
  
      const data = await response.json();
  
      if (data?.translations?.[selectedLanguage]) {
        const contentData = data.translations[selectedLanguage].content || '';
        const faqsData = data.translations[selectedLanguage].faqs || [];
        const relatedToolsData = data.translations[selectedLanguage].relatedTools || [];
        const metatitle = data.translations[selectedLanguage].title || '';
        const metaDescription = data.translations[selectedLanguage].description || '';
        const imageUrl = data.translations[selectedLanguage].image || '';
 
  
        setQuillContent(contentData);
        setExistingContent(contentData);
        setTitle(metatitle);
        setDescription(metaDescription);
        setImage(null); // Reset the image state to ensure it updates correctly
        setExistingImage(imageUrl); // Set the existing image URL from the fetched data
        setFaqs(faqsData);
        setRelatedTools(relatedToolsData);
        setIsEditing(!!contentData); // Set editing mode based on whether content exists
        setAvailableLanguages(Object.keys(data.translations));
      } else {
        // Clear the input fields if no content is available for the selected language
        clearFields();
        setAvailableLanguages(Object.keys(data.translations || {}));
      }
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setError(error.message);
      clearFields(); // Clear fields if there's an error
      setAvailableLanguages([]);
    }
  };
  

  const clearFields = () => {
    setQuillContent('');
    setExistingContent('');
    setTitle('');
    setDescription('');
    setImage(null);
    setExistingImage(null);
    setFaqs([]);
    setRelatedTools([]);
    setIsEditing(false);
  };

  const handleSubmit = useCallback(async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST';
  
      // Prepare form data
      const formData = new FormData();
      formData.append('content', quillContent);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('language', selectedLanguage); // Add language to form data
      if (image) {
        formData.append('image', image);
      }
      formData.append('faqs', JSON.stringify(faqs));
      formData.append('relatedTools', JSON.stringify(relatedTools));
  
      const response = await fetch(
        `/api/content?category=${selectedCategory}&language=${selectedLanguage}`, 
        {
          method,
          headers: {
            'Authorization': `Bearer AZ-fc905a5a5ae08609ba38b046ecc8ef00`, // Add Authorization header
          },
          body: formData,
        }
      );
  console.log(response);
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }
  
      // Handle success
      setError(null);
      setExistingContent(quillContent);
      setExistingImage(image ? URL.createObjectURL(image) : existingImage); // Set the existing image after upload
      toast.success('Content uploaded successfully!');
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  }, [
    quillContent, 
    selectedCategory, 
    selectedLanguage, 
    isEditing, 
    title, 
    description, 
    image, 
    faqs, 
    relatedTools, 
    existingImage,
  ]);
  

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
  }, []);

  const handleLanguageChange = useCallback((e) => {
    setSelectedLanguage(e.target.value);
  }, []);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleFaqChange = (index, key, value) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][key] = value;
    setFaqs(updatedFaqs);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
  };

  const handleRelatedToolChange = (index, key, value) => {
    const updatedTools = [...relatedTools];
    if (key === 'logo') {
      updatedTools[index][key] = value.target.files[0];
    } else {
      updatedTools[index][key] = value;
    }
    setRelatedTools(updatedTools);
  };

  const addRelatedTool = () => {
    setRelatedTools([...relatedTools, { name: '', link: '', logo: null }]);
  };

  const removeRelatedTool = (index) => {
    const updatedTools = relatedTools.filter((_, i) => i !== index);
    setRelatedTools(updatedTools);
  };

  const handleToolSelection = (tool) => {
    if (relatedTools.some((relatedTool) => relatedTool.name === tool.name)) {
      setRelatedTools(relatedTools.filter((relatedTool) => relatedTool.name !== tool.name));
    } else {
      setRelatedTools([...relatedTools, tool]);
    }
  };

  const renderHeader = () => {
    switch(selectedCategory) {
      case 'tagGenerator':
        return 'Tag Generator';
      case 'tagExtractor':
        return 'Tag Extractor';
      case 'Titlegenerator':
        return 'Title Generator';
      case 'DescriptionGenerator':
        return 'Description Generator';
      case 'YouTube-Channel-Banner-Downloader':
        return 'YouTube Channel Banner Downloader';
      case 'YouTube-Channel-Logo-Downloader':
        return 'YouTube Channel Logo Downloader';
      case 'YouTube-Embed-Code-Generator':
        return 'YouTube Embed Code Generator';
      case 'YouTube-Hashtag-Generator':
        return 'YouTube Hashtag Generator';
      case 'youtube-title-and-description-extractor':
        return 'YouTube Title and Description Extractor';
      case 'channel-id-finder':
        return 'YouTube Channel ID Finder';
      case 'Youtube-Thumbnails-Generator':
        return 'Youtube Thumbnails Generator';
      case 'video-data-viewer':
        return 'YouTube Video Data Viewer';
      case 'monetization-checker':
        return 'YouTube Monetization Checker';
      case 'YouTube-Channel-Search':
        return 'YouTube Channel Search';
      case 'YouTube-Video-Summary-Generator':
        return 'YouTube Video Summary Generator';
      case 'case-converter':
        return 'Case Converter';
      case 'trendingVideos':
        return 'YouTube Trending Videos';
      case 'YouTube-Money-Calculator':
        return 'YouTube Money Calculator';
      case 'youtube-comment-picker':
        return 'Youtube Comment Picker';
      case 'keyword-research':
        return 'YouTube Keyword Research';
      case 'youtube-shorts-downloader':
        return 'YouTube Shorts Downloader';
      case 'youtube-video-downloader':
        return 'YouTube Video Downloader';
      case 'youtube-shorts-to-mp3-downloader':
        return 'Youtube Shorts To mp3 Downloader';
      case 'youtube-to-mp3-downloader':
        return 'Youtube To mp3 Downloader';
      case 'youtube-to-mp4-downloader':
        return 'Youtube To mp4 Downloader';
      case 'youtube-shorts-to-mp4-downloader':
        return 'Youtube Shorts To mp4 Downloader';
      default:
        return 'Unknown Category';
    }
  };

  return (
    <Layout>
      <div className='container p-5'>
        <h2>Content Add For {renderHeader()}</h2>
        <div className="mb-3 flex items-center">
          <label htmlFor="category" className="mr-2 text-sm font-medium">Select Category:</label>
          <div className="relative">
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="tagGenerator">Tag Generator</option>
              <option value="tagExtractor">Tag Extractor</option>
              <option value="Titlegenerator">Title Generator</option>
              <option value="DescriptionGenerator">Description Generator</option>
              <option value="YouTube-Channel-Banner-Downloader">YouTube Channel Banner Downloader</option>
              <option value="YouTube-Channel-Logo-Downloader">YouTube Channel Logo Downloader</option>
              <option value="YouTube-Embed-Code-Generator">YouTube Embed Code Generator</option>
              <option value="YouTube-Hashtag-Generator">YouTube Hashtag Generator</option>
              <option value="youtube-title-and-description-extractor">YouTube Title and Description Extractor</option>
              <option value="channel-id-finder">YouTube Channel ID Finder</option>
              <option value="Youtube-Thumbnails-Generator">Youtube Thumbnails Generator</option>
              <option value="video-data-viewer">YouTube Video Data Viewer</option>
              <option value="monetization-checker">YouTube Monetization Checker</option>
              <option value="YouTube-Channel-Search">YouTube Channel Search</option>
              <option value="YouTube-Video-Summary-Generator">YouTube Video Summary Generator</option>
              <option value="case-converter">Case Converter</option>
              <option value="trendingVideos">YouTube Trending Videos</option>
              <option value="YouTube-Money-Calculator">YouTube Money Calculator</option>
              <option value="youtube-comment-picker">Youtube Comment Picker</option>
              <option value="keyword-research">YouTube Keyword Research</option>
              <option value="youtube-shorts-downloader">YouTube Shorts Downloader</option>
              <option value="youtube-video-downloader">YouTube Video Downloader</option>
              <option value="youtube-shorts-to-mp3-downloader">Youtube Shorts To mp3 Downloader</option>
              <option value="youtube-to-mp3-downloader">Youtube To mp3 Downloader</option>
              <option value="youtube-shorts-to-mp4-downloader">Youtube Shorts To mp4 Downloader</option>
              <option value="youtube-to-mp4-downloader">Youtube To mp4 Downloader</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.293 7.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L7 9.414V17a1 1 0 11-2 0V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="mb-3 flex items-center">
          <label htmlFor="language" className="mr-2 text-sm font-medium">Select Language:</label>
          <div className="relative">
            <select
              id="language"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="zh-HANT">中国传统的</option>
              <option value="zh-HANS">简体中文</option>
              <option value="nl">Nederlands</option>
              <option value="gu">ગુજરાતી</option>
              <option value="hi">हिंदी</option>
              <option value="it">Italiano</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="pl">Polski</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              {/* Add more languages as needed */}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.293 7.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L7 9.414V17a1 1 0 11-2 0V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label htmlFor="title" className="block text-sm font-medium">Meta Title:</label>
            <input 
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-gray-600 text-xs italic">Recommended length: 60 characters</p>
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="block text-sm font-medium">Meta Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
          />
          <p className="text-gray-600 text-xs italic">Recommended length: 155-160 characters</p>
        </div>
        <div className="mb-5">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Upload Image:</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            className="mt-1 block w-full text-gray-700"
          />
          {existingImage && (
            <div className="mt-2">
              <p className="text-gray-600 text-xs italic">Current Image:</p>
              <img src={existingImage} alt="Existing" className="w-32 h-32 object-cover mt-1" />
            </div>
          )}
          <p className="text-gray-600 text-xs italic">Recommended dimension: 1200 x 630</p>
        </div>
        {error && <div className="text-red-500">Error: {error}</div>}
        <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
        
        <div className='faq-section mt-10'>
          <h2>Manage FAQs</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="mb-3">
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                  className="flex-1 border rounded py-2 px-3 mr-2"
                />
                <button onClick={() => removeFaq(index)} className="text-red-500 hover:text-red-700">Remove</button>
              </div>
              <textarea
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                className="w-full border rounded py-2 px-3"
              />
            </div>
          ))}
          <button onClick={addFaq} className="btn btn-secondary p-2 mt-3">Add New FAQ</button>
        </div>

        <div className='related-tools-section mt-10'>
          <h2>Manage Related Tools</h2>
          <div className="grid grid-cols-3 gap-4">
            {allTools.map((tool, index) => (
              <div key={index} className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={relatedTools.some(relatedTool => relatedTool.name === tool.name)}
                  onChange={() => handleToolSelection(tool)}
                  className="mr-2"
                />
                <span>{tool.name}</span>
               <Image
                              alt={tool?.name}
                              className="rounded-full"
                              src={tool?.logo}
                              height={28}
                              width={28} // Add width for proper optimization
                              quality={50} // reduce quality if needed
                loading="lazy" // lazy load
                            />
              </div>
            ))}
          </div>
        </div>
       
        <button className='btn btn-primary p-2 mt-3' onClick={handleSubmit}>Submit Content</button>
        <div className='existing-content-section mt-10'>
          <h2>{renderHeader()} Content</h2>
          <div dangerouslySetInnerHTML={{ __html: existingContent }}></div>
        </div>

      
      </div>
      <ToastContainer />
    </Layout>
  );
}

export default Content;
