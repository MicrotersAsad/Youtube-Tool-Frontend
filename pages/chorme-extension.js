import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { i18n, useTranslation } from "next-i18next";
import axios from "axios";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Image from "next/image";
import { FaCalendar, FaUserCircle } from "react-icons/fa";
import CountUp from "react-countup";
import Head from "next/head";

const Home = () => {
  const { t, i18n } = useTranslation("home");
  const [searchQuery, setSearchQuery] = useState();
  const [searchResults, setSearchResults] = useState([]); // Search results state
  const stats = [
    { value: "100K+", label: "Global Users" },
    { value: "50+", label: "AI-Powered Tools" },
    { value: "100%", label: "Forever Free" },
    { value: "30+", label: "Languages Available" },
  ];

  // Helper function to clean the numeric value (remove non-numeric characters)
  const cleanValue = (value) => {
    // Extracts the numeric part only
    return value.replace(/[^0-9]/g, ""); // Remove all non-numeric characters (like '+', 'M', '%')
  };

  // Function to check if the value is purely numeric or contains other characters
  const hasNonNumericChars = (value) => {
    return /[^\d]/.test(value); // Check if there's any character other than digits
  };
  const allTools = [
    {
      name: "YouTube Tag Generator",
      link: "https://chromewebstore.google.com/detail/ai-youtube-tag-generator/bofpfhcblfdkodoooaklfkadepoofjod?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733289894208-taggenerator.png",
      description:
        "Generate optimized YouTube tags to boost your video discoverability and SEO.",
    },
    {
      name:"Youtube Tag Extractor",
      link: "https://chromewebstore.google.com/detail/youtube-tag-extractor/kikmhokjeblggelmngaepeaoldkinhbg?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/title-and-description-extractor.png",
      description:
        "Extract tags from any YouTube video for easy reference and analysis.",
    },
    {
      name: "Youtube Title Generator",
      link: "https://chromewebstore.google.com/detail/ai-youtube-title-generato/iegmiegkfhomepkgcgpncjgbkblokmil?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/title-bar.png",
      description:
        "Generate attention-grabbing YouTube titles that increase click-through rates.",
    },
    {
      name: "Youtube Description Generator",
      link: "https://chromewebstore.google.com/detail/ai-youtube-description-ge/imholbioccoombamaifcenainhafnpfa?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Title-And-Description-Generator.png",
      description:
        "Create compelling video descriptions to improve your YouTube video SEO.",
    },
    {
      name: "Youtube Title&Description Extractor",
      link: "https://chromewebstore.google.com/detail/youtube-title-subtitle-do/lgepenkbcbkglbncnchpefogdnbhnmba?authuser=0&hl=en",
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
      link: "https://chromewebstore.google.com/detail/ai-youtube-hashtag-genera/ohlhodfehelgpgbninfbofbapnkkipek?authuser=0&hl=en",
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
      link: "https://chromewebstore.google.com/detail/youtube-thumnail-download/pifongabajoiekpodnfoooahdccgakhp?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-thumbnail-downloader.png",
      description:
        "Download the thumbnails of any YouTube video in high resolution.",
    },
    {
      name: "YouTube Channel ID Finder",
      link: "https://chromewebstore.google.com/detail/youtube-channel-id-finder/bfkbgahmplemjmengbjlncclgcnckogb?authuser=0&hl=en",
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
      link: "https://chromewebstore.google.com/detail/youtube-money-calculator/denknlgpjoagihlkbpbkncocjjlpodhj?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/Youtube-Money-Calculator.png",
      description:
        "Estimate the potential earnings of YouTube videos based on views and engagement.",
    },
    {
      name: "Youtube Comment Picker",
      link: "https://chromewebstore.google.com/detail/youtube-comment-picker/mobjgghidolibaadbgbhoiocdpegnenn?authuser=0&hl=en",
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
      link: "https://chromewebstore.google.com/detail/youtube-embed-code-genera/nngaggpeedoelehgkmlmedogmdojelmh?authuser=0&hl=en",
      logo: "https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/youtube-embad-code-generator.png",
      description:
        "Generate embed codes for YouTube videos for easy sharing on websites and blogs.",
    },
  ];

  const currentLanguage = i18n.language || "en";



  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      // Filter tools
      const filteredTools = allTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query.toLowerCase()) ||
          tool.description.toLowerCase().includes(query.toLowerCase())
      );

   
      // Combine results from both tools and blogs
      const combinedResults = [
        ...filteredTools.map((tool) => ({
          title: tool?.name,
          link: tool?.link, // Adjust the URL based on your routing
          collectionName: "Tool",
        })),
     
      ];

      setSearchResults(combinedResults);
    } else {
      // Clear results if search query is less than 3 characters
      setSearchResults([]);
    }
  };
 


  return (
    <div className="">
      <Head>
          {/* SEO Meta Tags */}
          <title>{t("Meta Title")}</title>
          <meta name="description" content={t("Meta Description")} />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="robots" content="index, follow" />

          {/* Canonical URL */}
          <link rel="canonical" href="https://ytubetools.com/chorme-extension" />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:url"  content="https://ytubetools.com/chorme-extension"/>
          <meta property="og:title" content={t("Meta Title")} />
          <meta property="og:description" content={t("Meta Description")} />
          <meta property="og:image" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733308755615-ytubetools-homepage.png" />
          <meta property="og:image:secure_url" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733308755615-ytubetools-homepage.png" />
          <meta property="og:site_name" content="Ytubetools" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:domain" content="https://ytubetools.com/chorme-extension" />
          <meta property="twitter:url" content="https://ytubetools.com/chorme-extension"/>
          <meta name="twitter:title" content={t("Meta Title")} />
          <meta name="twitter:description" content={t("Meta Description")} />
          <meta name="twitter:image" content="" />
          <meta name="twitter:site" content="@ytubetools" />
          <meta name="twitter:image:alt" content="https://ytubetools.s3.eu-north-1.amazonaws.com/uploads/1733308755615-ytubetools-homepage.png" />
   {/* Hreflang Meta Tags (for multilingual SEO) */}
   <link rel="alternate" hreflang="x-default" href="https://ytubetools.com/chorme-extension"></link>
   <link rel="alternate" href="https://ytubetools.com/chorme-extension" hreflang="en" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/fr" hreflang="fr" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/es" hreflang="es" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/de" hreflang="de" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/gu" hreflang="gu" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/hi" hreflang="hi" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/it" hreflang="it" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/ja" hreflang="ja" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/ko" hreflang="ko" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/nl" hreflang="nl" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/pl" hreflang="pl" />
        <link rel="alternate" href="https://ytubetools.com/chorme-extension/ru" hreflang="ru" />
          
        </Head>
      {/* Top Bar */}
      <div className="topbar bg-indigo-600 py-2">
        <p className="text-white text-center">
        {t('Access 50+ free AI-powered YouTube tools | Unlimited | No Credit Card Required')}
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full py-12 text-center lg:px-8 lg:py-20">
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">
        {t("YouTube Extension For Chrome | YtubeTools")}
          <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            {t('100% Free')}
          </span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-500">
        {t("Get 100% free 5 star voted chrome extension for YouTube creators, Like: YouTube Tag generator, YouTube Summary generator etc.")}
        </p>
      </div>

      {/* Search Input for Desktop */}
       <div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative mx-auto mb-6 max-w-2xl rounded-full border border-indigo-100 bg-gray-50 px-4 py-2 xl:mb-10">
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="h-8 w-8 text-[#f86540]"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <input
              className="block w-full border-0 bg-transparent py-1.5 pl-14 pr-24 text-gray-500 ring-0 placeholder:text-xl placeholder:text-gray-400 focus:outline-none sm:text-sm sm:leading-6 md:text-xl md:leading-7 lg:text-2xl lg:leading-7"
              aria-label={t('Search')}
              type="text"
              placeholder={t('Search...')}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full bg-[#f86540] px-4 py-1.5 text-white hover:bg-[#f86540] disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {t('Search')}
            </button>
          </div>

    
          <div className="relative mt-2">
            {searchResults?.length > 0 ? (
              <ul className="absolute z-10 bg-white text-black w-full mt-1 max-h-60 overflow-auto shadow-lg rounded-lg border border-gray-200">
                {searchResults?.map((result, index) => (
                  <li
                    key={index}
                    className="p-3 hover:bg-indigo-100 cursor-pointer transition-colors duration-200"
                  >
                    <Link href={result.link}>
                      <span className="text-[#f86540] font-medium">
                        {result.title}
                        <span className="text-sm text-gray-500">
                          {" "}
                          - {result.collectionName}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              searchQuery?.length > 2 && (
                <div className="absolute z-10 bg-white text-gray-500 w-full mt-1 max-h-60 overflow-auto shadow-lg rounded-lg border border-gray-200 p-3">
                  {t('No results found')}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div> 
 

 

      {/* Statistics Section */}
      <div className="my-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <li
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative flex flex-col items-center justify-center">
                  <span className="mb-2 text-6xl font-black tracking-tight text-[#f86540]">
                    {/* If the value contains non-numeric characters, animate the count */}
                    {hasNonNumericChars(stat.value) ? (
                      <>
                        <CountUp
                          end={parseInt(cleanValue(stat.value), 10)} // Only animate the numeric part
                          duration={2}
                        />
                        {stat.value.replace(cleanValue(stat.value), "")}{" "}
                        {/* Add the non-numeric part (like M, +) */}
                      </>
                    ) : (
                      // If the value contains only numbers, animate it normally
                      <CountUp end={parseInt(stat.value, 10)} duration={2} />
                    )}
                  </span>
                  <span className="text-lg font-medium text-zinc-600">
                    {stat.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
      {/* AI Tools Section */}
      <div className="mt-4 bg-indigo-50 py-4 md:mt-8 md:py-8 xl:mt-12">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:py-12">
          <div className="mx-auto my-4 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("AI YouTube Tools Chorme Extension That Work For You")}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t("Exceptionally Useful, Completely Free — No Hidden Costs.")}
            </p>
          </div>
          <div className="mb-8 flex items-center justify-between">
            {/* Left Section: Icon + Title */}
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="mr-3 h-8 w-8 text-yellow-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                ></path>
              </svg>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t("Featured Tools")}
              </h2>
            </div>
          </div>

          <div className="mb-16">
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {allTools.map((tool, index) => (
      <a key={tool?.id || index} href={tool?.link}>
        <div className="group h-full cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[102%] hover:shadow-xl hover:ring-2 hover:ring-indigo-500 hover:border-2 hover:border-indigo-500 hover:bg-indigo-500 hover:bg-opacity-10 hover:backdrop-blur-md">
          <div className="mb-4 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm group-hover:shadow-md">
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
            <h3 className="ml-4 text-lg font-bold text-gray-900 group-hover:text-indigo-600">
              {tool?.name}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            {tool?.description}
          </p>
        </div>
      </a>
    ))}
  </div>
</div>

        </div>
      </div>

      

    </div>
  );
};
export async function getServerSideProps({ locale = "en" }) {
  try {
    // Load translations for the current locale
    return {
      props: {
        ...(await serverSideTranslations(locale, ["home", "navbar", "footer"])), // Add required namespaces
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);

    return {
      props: {
        ...(await serverSideTranslations(locale, ["home", "navbar", "footer"])), // Ensure translations are still loaded
      },
    };
  }
}
export default Home;
