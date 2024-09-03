import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import TagGenerator from "../public/tagGenerator.png";
import TagExtractor from "../public/youtube-tag-extractor.png";
import TitleGenerator from "../public/title-bar.png";
import DescriptionGenerator from "../public/description.png";
import TitleDescriptionExtractor from "../public/title-and-description-extractor.png";
import BannerDownloader from "../public/youtube-channel-banner-download.png";
import LogoDownloader from "../public/Youtube-channel-logo-downloader.png";
import ThumbnailDownloader from "../public/Youtube-thumbnail-downloader.png";
import ChannelIDFinder from "../public/Channel-ID-Finder.png";
import VideoDataViewer from "../public/Video-Data-Viewer.png";
import MonetizationChecker from "../public/Monetization-Checker.png";
import ChannelSearch from "../public/Youtube-channel-search.png";
import SummaryGenerator from "../public/Youtube-Video-Summary-generator.png";
import TrendingVideos from "../public/youtube-trending-videos.png";
import MoneyCalculator from "../public/Youtube-Money-Calculator.png";
import research from "../public/youtube-keyword-research.png";
import Comment from "../public/Comment-Picker-icon.png";
import Hashtag from "../public/youtube-hastag-generator.png";
import Embed from "../public/youtube-embad-code-generator.png";

const SavedChannels = () => {
  const [savedChannels, setSavedChannels] = useState([]);

  const allTools = [
    { name: 'YouTube Tag Generator', link: 'http://www.ytubetools.com/', logo: TagGenerator },
    { name: 'Youtube Tag Extractor', link: 'http://www.ytubetools.com/tools/tag-extractor', logo: TagExtractor },
    { name: 'Youtube Title Generator', link: 'http://www.ytubetools.com/tools/title-generator', logo: TitleGenerator },
    { name: 'Youtube Description Generator', link: 'http://www.ytubetools.com/tools/description-generator', logo: DescriptionGenerator },
    { name: 'Youtube Title&Description Extractor', link: 'http://www.ytubetools.com/tools/youtube-title-and-description-extractor', logo: TitleDescriptionExtractor },
    { name: 'YouTube Channel Banner Downloader', link: 'http://www.ytubetools.com/tools/youtube-channel-banner-downloader', logo: BannerDownloader },
    { name: 'YouTube Hashtag Geneartor', link: 'http://www.ytubetools.com/tools/youtube-hashtag-generator', logo: Hashtag },
    { name: 'YouTube Channel Logo Downloader', link: 'http://www.ytubetools.com/tools/youtube-channel-logo-downloader', logo: LogoDownloader },
    { name: 'YouTube Thumbnail Downloader', link: 'http://www.ytubetools.com/tools/youtube-thumbnail', logo: ThumbnailDownloader },
    { name: 'YouTube Channel ID Finder', link: 'http://www.ytubetools.com/tools/channel-id-finder', logo: ChannelIDFinder },
    { name: 'YouTube Video Data Viewer', link: 'http://www.ytubetools.com/tools/video-data-viewer', logo: VideoDataViewer },
    { name: 'YouTube Monetization Checker', link: 'http://www.ytubetools.com/tools/monetization-checker', logo: MonetizationChecker },
    { name: 'YouTube Channel Search', link: 'http://www.ytubetools.com/tools/youtube-channel-search', logo: ChannelSearch },
    { name: 'YouTube Video Summary Generator', link: 'http://www.ytubetools.com/tools/youtube-video-summary-generator', logo: SummaryGenerator },
    { name: 'YouTube Trending Videos', link: 'http://www.ytubetools.com/tools/trending-videos', logo: TrendingVideos },
    { name: 'YouTube Money Calculator', link: 'http://www.ytubetools.com/tools/youtube-money-calculator', logo: MoneyCalculator },
    { name: 'Youtube Comment Picker', link: 'http://www.ytubetools.com/tools/youtube-comment-picker', logo: Comment },
    { name: 'YouTube Keyword Research', link: 'http://www.ytubetools.com/tools/keyword-research', logo: research },
    { name: 'YouTube Embed Code Generator', link: 'http://www.ytubetools.com/tools/youtube-embed-code-generator', logo: Embed },
    // Add more tools as needed
  ];

  useEffect(() => {
    const channels = JSON.parse(localStorage.getItem('savedChannels') || '[]');

    // Enhance saved channels with tool details from allTools
    const enhancedChannels = channels.map(channel => {
      const matchedTool = allTools.find(tool => tool.name === channel.toolName);
      return {
        ...channel,
        toolImage: matchedTool ? matchedTool.logo.src : null,
        toolUrl: matchedTool ? matchedTool.link : channel.toolUrl, // Default to saved URL if no match
      };
    });

    setSavedChannels(enhancedChannels);
  }, []);

  if (savedChannels.length === 0) {
    return <p>No channels saved.</p>;
  }
  return (
    <div className="related-tools max-w-7xl mx-auto   mt-10 shadow-lg  p-5 rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-5 text-center">Saved Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedChannels.map((channel, index) => (
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
        ))}
      </div>
    </div>
  );
};

export default SavedChannels;
