import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';



const SavedChannels = () => {
  const [savedChannels, setSavedChannels] = useState([]);

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
    const channels = JSON.parse(localStorage.getItem('savedChannels') || '[]');

    const enhancedChannels = channels.map(channel => {
      const matchedTool = allTools.find(tool => tool.name === channel.toolName);
      return {
        ...channel,
        toolImage: matchedTool ? matchedTool.logo.src : null,
        toolUrl: matchedTool ? matchedTool.link : channel.toolUrl,
      };
    });

    setSavedChannels(enhancedChannels);
  }, []);

  return (
    <div className="related-tools max-w-7xl mx-auto mt-10 shadow-lg p-5 rounded-lg bg-white">
      <Head>
        {/* SEO Meta Tags */}
        <title>Saved YouTube Tools - Ytubetools</title>
        <meta name="description" content="Access all your saved YouTube tools and channels from Ytubetools in one place for easy access." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />

        {/* Canonical URL */}
        <link rel="canonical" href="http://www.ytubetools.com/saved-channels" />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://www.ytubetools.com/saved-channels" />
        <meta property="og:title" content="Saved YouTube Tools - Ytubetools" />
        <meta property="og:description" content="Access all your saved YouTube tools and channels from Ytubetools in one place for easy access." />
        <meta property="og:image" content="https://www.ytubetools.com/images/saved-channels-thumbnail.jpg" />
        <meta property="og:image:secure_url" content="https://www.ytubetools.com/images/saved-channels-thumbnail.jpg" />
        <meta property="og:site_name" content="Ytubetools" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:domain" content="ytubetools.com" />
        <meta property="twitter:url" content="http://www.ytubetools.com/saved-channels" />
        <meta name="twitter:title" content="Saved YouTube Tools - Ytubetools" />
        <meta name="twitter:description" content="Access all your saved YouTube tools and channels from Ytubetools in one place for easy access." />
        <meta name="twitter:image" content="https://www.ytubetools.com/images/saved-channels-thumbnail.jpg" />
        <meta name="twitter:site" content="@ytubetools" />
        <meta name="twitter:image:alt" content="Saved YouTube Tools Thumbnail" />
      </Head>

      <h2 className="text-2xl font-bold mb-5 text-center">Saved Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedChannels.length > 0 ? (
          savedChannels.map((channel, index) => (
            <a
              key={index}
              href={channel.toolUrl}
              className="flex items-center border rounded-lg p-4 bg-gray-100 transition"
            >
              {channel.toolImage && (
                <Image
                  src={channel.toolImage}
                  alt={`${channel.toolName} Icon`}
                  width={64}
                  height={64}
                  className="mr-4"
                />
              )}
              <span className="text-blue-600 font-medium">{channel.toolName}</span>
            </a>
          ))
        ) : (
          <p>No channels saved.</p>
        )}
      </div>
    </div>
  );
};

export default SavedChannels;
