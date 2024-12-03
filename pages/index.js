import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'next/router';
import { i18n } from 'next-i18next';
import axios from 'axios';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Home = ({ initialBlogs = [], availableLanguages, metaUrl, meta }) => {
  const router = useRouter();
  const { category: selectedCategory } = router.query;
  const [loading, setLoading] = useState(!initialBlogs.length);
  const blogsPerPage = 6;
  const [error, setError] = useState('');
  const [blogsData, setBlogsData] = useState(initialBlogs);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(meta?.currentPage || 1);  // Safe fallback
  const [currentCategory, setCurrentCategory] = useState(selectedCategory || '');
  const stats = [
    { value: '10M+', label: 'Global Users' },
    { value: '300+', label: 'AI-Powered Tools' },
    { value: '100%', label: 'Forever Free' },
    { value: '30+', label: 'Languages Available' }
  ];
  const allTools = [
    { 
      name: 'YouTube Tag Generator', 
      link: 'http://www.ytubetools.com/', 
      logo: TagGenerator, 
      description: 'Generate optimized YouTube tags to boost your video discoverability and SEO.'
    },
    { 
      name: 'Youtube Tag Extractor', 
      link: 'http://www.ytubetools.com/tools/tag-extractor', 
      logo: TagExtractor, 
      description: 'Extract tags from any YouTube video for easy reference and analysis.'
    },
    { 
      name: 'Youtube Title Generator', 
      link: 'http://www.ytubetools.com/tools/title-generator', 
      logo: TitleGenerator, 
      description: 'Generate attention-grabbing YouTube titles that increase click-through rates.'
    },
    { 
      name: 'Youtube Description Generator', 
      link: 'http://www.ytubetools.com/tools/description-generator', 
      logo: DescriptionGenerator, 
      description: 'Create compelling video descriptions to improve your YouTube video SEO.'
    },
    { 
      name: 'Youtube Title&Description Extractor', 
      link: 'http://www.ytubetools.com/tools/youtube-title-and-description-extractor', 
      logo: TitleDescriptionExtractor, 
      description: 'Extract YouTube video titles and descriptions for quick access and analysis.'
    },
    { 
      name: 'YouTube Channel Banner Downloader', 
      link: 'http://www.ytubetools.com/tools/youtube-channel-banner-downloader', 
      logo: BannerDownloader, 
      description: 'Download high-quality YouTube channel banners with just one click.'
    },
    { 
      name: 'YouTube Hashtag Generator', 
      link: 'http://www.ytubetools.com/tools/youtube-hashtag-generator', 
      logo: Hashtag, 
      description: 'Generate relevant hashtags to boost the visibility of your YouTube videos.'
    },
    { 
      name: 'YouTube Channel Logo Downloader', 
      link: 'http://www.ytubetools.com/tools/youtube-channel-logo-downloader', 
      logo: LogoDownloader, 
      description: 'Download high-resolution YouTube channel logos easily.'
    },
    { 
      name: 'YouTube Thumbnail Downloader', 
      link: 'http://www.ytubetools.com/tools/youtube-thumbnail', 
      logo: ThumbnailDownloader, 
      description: 'Download the thumbnails of any YouTube video in high resolution.'
    },
    { 
      name: 'YouTube Channel ID Finder', 
      link: 'http://www.ytubetools.com/tools/channel-id-finder', 
      logo: ChannelIDFinder, 
      description: 'Find the YouTube channel ID for any given YouTube channel URL.'
    },
    { 
      name: 'YouTube Video Data Viewer', 
      link: 'http://www.ytubetools.com/tools/video-data-viewer', 
      logo: VideoDataViewer, 
      description: 'View detailed data and stats about any YouTube video.'
    },
    { 
      name: 'YouTube Monetization Checker', 
      link: 'http://www.ytubetools.com/tools/monetization-checker', 
      logo: MonetizationChecker, 
      description: 'Check if a YouTube channel or video is eligible for monetization.'
    },
    { 
      name: 'YouTube Channel Search', 
      link: 'http://www.ytubetools.com/tools/youtube-channel-search', 
      logo: ChannelSearch, 
      description: 'Search for YouTube channels based on keywords or names.'
    },
    { 
      name: 'YouTube Video Summary Generator', 
      link: 'http://www.ytubetools.com/tools/youtube-video-summary-generator', 
      logo: SummaryGenerator, 
      description: 'Generate a concise summary of any YouTube video for quick insights.'
    },
    { 
      name: 'YouTube Trending Videos', 
      link: 'http://www.ytubetools.com/tools/trending-videos', 
      logo: TrendingVideos, 
      description: 'Discover the latest trending YouTube videos from around the world.'
    },
    { 
      name: 'YouTube Money Calculator', 
      link: 'http://www.ytubetools.com/tools/youtube-money-calculator', 
      logo: MoneyCalculator, 
      description: 'Estimate the potential earnings of YouTube videos based on views and engagement.'
    },
    { 
      name: 'Youtube Comment Picker', 
      link: 'http://www.ytubetools.com/tools/youtube-comment-picker', 
      logo: Comment, 
      description: 'Pick random comments from any YouTube video for giveaways or contests.'
    },
    { 
      name: 'YouTube Keyword Research', 
      link: 'http://www.ytubetools.com/tools/keyword-research', 
      logo: research, 
      description: 'Conduct keyword research for YouTube to identify high-ranking search terms.'
    },
    { 
      name: 'YouTube Embed Code Generator', 
      link: 'http://www.ytubetools.com/tools/youtube-embed-code-generator', 
      logo: Embed, 
      description: 'Generate embed codes for YouTube videos for easy sharing on websites and blogs.'
    }
    // Add more tools as needed
  ];
  const currentLanguage = i18n.language || 'en';
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/yt-categories');
      const filteredCategories = response.data.map((category) => {
        const translation = category.translations[currentLanguage];
        return {
          ...category,
          name: translation ? translation.name : category.name,
          slug: translation ? translation.slug : category.slug,
        };
      });
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  }, [currentLanguage]);;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const extractFirstImage = (content) => {
    const regex = /<img.*?src="(.*?)"/;
    const match = regex.exec(content);
    return match ? match[1] : null;
  };
  const fetchBlogs = useCallback(
    async (page = 1, category = '') => {
      setLoading(true);
      try {
        const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Example token
  
        if (!token) {
          throw new Error('No authorization token found');
        }
  
        const response = await axios.get(`/api/youtube`, {
         
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const { data: blogs, meta = { currentPage: 1, totalPages: 1 } } = response.data;
  
        // Ensure blogsData is always an array
        setBlogsData(Array.isArray(blogs) ? blogs : []);
        setCurrentPage(meta.currentPage || 1);
        setTotalPages(meta.totalPages || 1);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to fetch blogs.');
      } finally {
        setLoading(false);
      }
    },
    [blogsPerPage]
  );
  
  const processedBlogs = useMemo(() => {
    return blogsData
      .map((blog) => {
        const translation = blog.translations[currentLanguage];
        if (!translation) return null;

        const { title, category } = translation;

        // Normalize category and currentCategory for comparison
        const normalizedCategory = category ? category.toLowerCase().replace(/\s+/g, '-') : '';
        const normalizedCurrentCategory = currentCategory ? currentCategory.toLowerCase() : '';

        // Generate slug if it doesn't exist
        if (!translation.slug && title) {
          translation.slug = createSlug(title);
        }

        // Extract first image if it doesn't exist
        if (!translation.image && translation.content) {
          translation.image = extractFirstImage(translation.content);
        }

        

     

        return {
          _id: blog._id,
          createdAt: blog.createdAt,
          author: blog.author,
          ...blog,
          translations: {
            ...blog.translations,
            [currentLanguage]: translation,
          },
        };
      })
      .filter((blog) => blog); // Remove null entries after filtering
  }, [blogsData, currentLanguage, currentCategory]);

  useEffect(() => {
    fetchBlogs(currentPage, currentCategory);
  }, [currentPage, currentCategory, fetchBlogs]);
  return (
    <div className="bg-white">
    {/* Top Bar */}
    <div className="topbar bg-indigo-600 py-3">
      <h6 className="text-white text-center">Empower Your Work and Learning with Our Free AI Tools →</h6>
    </div>

    {/* Main Content */}
    <div className="w-full py-12 text-center lg:px-8 lg:py-20">
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">
        YtubeTools: Unlimited Creation,
        <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">100% Free</span>
      </h1>
      <p className="mt-6 text-lg leading-8 text-neutral-500">
        ytubetools.com is a free AI website designed to enhance your work and learning by offering free, unlimited access to all our tools.
      </p>
    </div>

    {/* Search Bar */}
    <div className="mx-auto mb-6 max-w-2xl rounded-full border border-indigo-100 bg-gray-50 px-4 py-2 xl:mb-10">
      <div className="relative mt-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-8 w-8 text-indigo-500">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd"></path>
          </svg>
        </div>
        <input
          className="block w-full border-0 bg-transparent py-1.5 pl-14 pr-24 text-gray-500 ring-0 placeholder:text-xl placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6 md:text-xl md:leading-7 lg:text-2xl lg:leading-7"
          aria-label="Search"
          type="text"
          placeholder="Search..."
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full bg-indigo-500 px-4 py-1.5 text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          Search
        </button>
      </div>
    </div>
{/* Statistics Section */}
<div className="my-16 bg-gradient-to-b from-white to-indigo-50/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <li key={index} className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative flex flex-col items-center justify-center">
                    <span className="mb-2 text-6xl font-black tracking-tight text-indigo-600">{stat.value}</span>
                    <span className="text-lg font-medium text-zinc-600">{stat.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
   

    

    <div class="mt-4 bg-indigo-50 py-4 md:mt-8 md:py-8 xl:mt-12">
        <div class="mx-auto max-w-7xl px-4 py-4 lg:py-12">
        <div class="mx-auto my-4 max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">AI Tools That Work For You</h2><p class="mt-6 text-lg leading-8 text-gray-600">Exceptionally Useful, Completely Free — No Hidden Costs.</p></div>
        <div class="mb-8 flex items-center justify-between">
  {/* <!-- Left Section: Icon + Title --> */}
  <div class="flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="mr-3 h-8 w-8 text-yellow-500">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"></path>
    </svg>
    <div>
      <h2 class="text-2xl font-semibold text-gray-900">Featured Tools</h2>
    </div>
  </div>


</div>

<div class="mb-16">


  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {allTools.map(tool => (
       <a href={tool?.link}>
       <div class="group h-full cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[102%] hover:shadow-xl hover:ring-2 hover:ring-indigo-500">
         <div class="mb-4 flex items-center">
           <div class="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm group-hover:shadow-md">
             <img alt="AI Story Generator" class="rounded-full"  src={tool?.logo?.src} height="28"/>
           </div>
           <h3 class="ml-4 text-lg font-bold text-gray-900 group-hover:text-indigo-600">{tool?.name}</h3>
         </div>
         <p class="text-sm leading-relaxed text-gray-600">{tool?.description}</p>
       </div>
     </a>
      ))}
  

  </div>
</div>
</div>
</div>
 {/* Blogs Grid */}
 <div class="mx-auto max-w-7xl px-4 py-4 lg:py-12">
 <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {processedBlogs.length === 0 ? (
        <p>No blogs found</p>
      ) : (
        processedBlogs.slice(0,6).map((blog) => (
          <div key={blog._id} className="group cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[102%] hover:shadow-xl hover:ring-2 hover:ring-indigo-500">
          <img src={blog.translations[currentLanguage]?.image}/>
          <div class="flex items-center gap-x-4 text-xs">
            <time datetime="9/18/2024, 10:29:50 AM" class="rounded-full bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-4 py-1.5 font-medium text-indigo-600 ring-1 ring-indigo-100/50">{blog?.createdAt}</time></div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600">{blog.translations[currentLanguage]?.title}</h3>
           
          </div>
        ))
      )}
    </div>
    </div>

  </div>
  );
};
export async function getServerSideProps({ locale = 'en', req, query }) {
  const { page = 1, category = '' } = query;

  // Get the base URL from the request headers
  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  // Fetch the token securely (e.g., from cookies, environment variables)
  const token ='AZ-fc905a5a5ae08609ba38b046ecc8ef00';  // Replace with a secure way of managing the token

  if (!token) {
    throw new Error('No authorization token found');
  }

  try {
    // Make the API request to fetch data
    const { data } = await axios.get(`${baseUrl}/api/youtube`, {
      headers: {
        Authorization: `Bearer ${token}`,  // Add the Bearer token
      },
      params: { page, limit: 9, category },
    });

    // Construct the meta URL (to avoid duplication and ensure correct locale)
    const metaUrl = `${baseUrl}${req.url}`;

    return {
      props: {
        initialBlogs: data.data || [],  // Safely access `data`
        meta: data.meta || { currentPage: 1, totalPages: 0 },
        availableLanguages: ['en', 'es'],  // Add any other languages you want to support
        metaUrl,
        ...(await serverSideTranslations(locale, ['blog', 'navbar', 'footer'])),  // Add translations
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialBlogs: [],
        meta: { currentPage: 1, totalPages: 0 },
        availableLanguages: [],  // If error occurs, return an empty languages array
        metaUrl: `${baseUrl}${req.url}`,
      },
    };
  }
}
export default Home;
