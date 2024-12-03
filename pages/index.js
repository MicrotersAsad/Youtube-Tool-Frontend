import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import Link from "next/link";
import { i18n, useTranslation } from "next-i18next";
import axios from "axios";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Image from "next/image";
import { FaCalendar, FaUserCircle } from "react-icons/fa";
import CountUp from "react-countup";
import Head from "next/head";

const Home = ({ initialBlogs = [] }) => {
  const { t, i18n } = useTranslation("home");
  const [blogsData, setBlogsData] = useState(initialBlogs);
  const [categories, setCategories] = useState([]);
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
      name: t("YouTube Tag Generator"),
      link: "http://www.ytubetools.com/",
      logo: TagGenerator,
      description:
        "Generate optimized YouTube tags to boost your video discoverability and SEO.",
    },
    {
      name:t("Youtube Tag Extractor"),
      link: "http://www.ytubetools.com/tools/tag-extractor",
      logo: TagExtractor,
      description:
        "Extract tags from any YouTube video for easy reference and analysis.",
    },
    {
      name: "Youtube Title Generator",
      link: "http://www.ytubetools.com/tools/title-generator",
      logo: TitleGenerator,
      description:
        "Generate attention-grabbing YouTube titles that increase click-through rates.",
    },
    {
      name: "Youtube Description Generator",
      link: "http://www.ytubetools.com/tools/description-generator",
      logo: DescriptionGenerator,
      description:
        "Create compelling video descriptions to improve your YouTube video SEO.",
    },
    {
      name: "Youtube Title&Description Extractor",
      link: "http://www.ytubetools.com/tools/youtube-title-and-description-extractor",
      logo: TitleDescriptionExtractor,
      description:
        "Extract YouTube video titles and descriptions for quick access and analysis.",
    },
    {
      name: "YouTube Channel Banner Downloader",
      link: "http://www.ytubetools.com/tools/youtube-channel-banner-downloader",
      logo: BannerDownloader,
      description:
        "Download high-quality YouTube channel banners with just one click.",
    },
    {
      name: "YouTube Hashtag Generator",
      link: "http://www.ytubetools.com/tools/youtube-hashtag-generator",
      logo: Hashtag,
      description:
        "Generate relevant hashtags to boost the visibility of your YouTube videos.",
    },
    {
      name: "YouTube Channel Logo Downloader",
      link: "http://www.ytubetools.com/tools/youtube-channel-logo-downloader",
      logo: LogoDownloader,
      description: "Download high-resolution YouTube channel logos easily.",
    },
    {
      name: "YouTube Thumbnail Downloader",
      link: "http://www.ytubetools.com/tools/youtube-thumbnail",
      logo: ThumbnailDownloader,
      description:
        "Download the thumbnails of any YouTube video in high resolution.",
    },
    {
      name: "YouTube Channel ID Finder",
      link: "http://www.ytubetools.com/tools/channel-id-finder",
      logo: ChannelIDFinder,
      description:
        "Find the YouTube channel ID for any given YouTube channel URL.",
    },
    {
      name: "YouTube Video Data Viewer",
      link: "http://www.ytubetools.com/tools/video-data-viewer",
      logo: VideoDataViewer,
      description: "View detailed data and stats about any YouTube video.",
    },
    {
      name: "YouTube Monetization Checker",
      link: "http://www.ytubetools.com/tools/monetization-checker",
      logo: MonetizationChecker,
      description:
        "Check if a YouTube channel or video is eligible for monetization.",
    },
    {
      name: "YouTube Channel Search",
      link: "http://www.ytubetools.com/tools/youtube-channel-search",
      logo: ChannelSearch,
      description: "Search for YouTube channels based on keywords or names.",
    },
    {
      name: "YouTube Video Summary Generator",
      link: "http://www.ytubetools.com/tools/youtube-video-summary-generator",
      logo: SummaryGenerator,
      description:
        "Generate a concise summary of any YouTube video for quick insights.",
    },
    {
      name: "YouTube Trending Videos",
      link: "http://www.ytubetools.com/tools/trending-videos",
      logo: TrendingVideos,
      description:
        "Discover the latest trending YouTube videos from around the world.",
    },
    {
      name: "YouTube Money Calculator",
      link: "http://www.ytubetools.com/tools/youtube-money-calculator",
      logo: MoneyCalculator,
      description:
        "Estimate the potential earnings of YouTube videos based on views and engagement.",
    },
    {
      name: "Youtube Comment Picker",
      link: "http://www.ytubetools.com/tools/youtube-comment-picker",
      logo: Comment,
      description:
        "Pick random comments from any YouTube video for giveaways or contests.",
    },
    {
      name: "YouTube Keyword Research",
      link: "http://www.ytubetools.com/tools/keyword-research",
      logo: research,
      description:
        "Conduct keyword research for YouTube to identify high-ranking search terms.",
    },
    {
      name: "YouTube Embed Code Generator",
      link: "http://www.ytubetools.com/tools/youtube-embed-code-generator",
      logo: Embed,
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

      // Filter blogs
      const filteredBlogs = processedBlogs.filter(
        (blog) =>
          blog.translations[currentLanguage]?.title
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          blog.translations[currentLanguage]?.slug
            .toLowerCase()
            .includes(query.toLowerCase())
      );

      // Combine results from both tools and blogs
      const combinedResults = [
        ...filteredTools.map((tool) => ({
          title: tool?.name,
          link: tool?.link, // Adjust the URL based on your routing
          collectionName: "Tool",
        })),
        ...filteredBlogs.map((blog) => ({
          title: blog.translations[currentLanguage]?.title,
          link: `/youtube/${blog.translations[currentLanguage]?.slug}`, // Adjust the URL based on your routing
          collectionName: "Blog",
        })),
      ];

      setSearchResults(combinedResults);
    } else {
      // Clear results if search query is less than 3 characters
      setSearchResults([]);
    }
  };
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get("/api/yt-categories");
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
      console.error("Error fetching categories:", error.message);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const processedBlogs = useMemo(() => {
    return blogsData
      .map((blog) => {
        const translation = blog.translations[currentLanguage];
        if (!translation) return null;

        const { title, category } = translation;

        if (!translation.slug && title) {
          translation.slug = createSlug(title);
        }

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
      .filter((blog) => blog);
  }, [blogsData, currentLanguage]);

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
          <link rel="canonical" href="https://ytubetools.com/" />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:url"  content="https://ytubetools.com/"/>
          <meta property="og:title" content={t("Meta Title")} />
          <meta property="og:description" content={t("Meta Description")} />
          <meta property="og:image" content="" />
          <meta property="og:image:secure_url" content="" />
          <meta property="og:site_name" content="Ytubetools" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:domain" content="https://ytubetools.com/" />
          <meta property="twitter:url" content="https://ytubetools.com/"/>
          <meta name="twitter:title" content={t("Meta Title")} />
          <meta name="twitter:description" content={t("Meta Description")} />
          <meta name="twitter:image" content="" />
          <meta name="twitter:site" content="@ytubetools" />
          <meta name="twitter:image:alt" content="" />
   {/* Hreflang Meta Tags (for multilingual SEO) */}
   <link rel="alternate" hreflang="x-default" href="https://www.ytubetools.com"></link>
   <link rel="alternate" href="https://www.ytubetools.com" hreflang="en" />
        <link rel="alternate" href="https://www.ytubetools.com/fr" hreflang="fr" />
        <link rel="alternate" href="https://www.ytubetools.com/es" hreflang="es" />
        <link rel="alternate" href="https://www.ytubetools.com/zh-hans" hreflang="zh-HANS" />
        <link rel="alternate" href="https://www.ytubetools.com/de" hreflang="de" />
        <link rel="alternate" href="https://www.ytubetools.com/gu" hreflang="gu" />
        <link rel="alternate" href="https://www.ytubetools.com/hi" hreflang="hi" />
        <link rel="alternate" href="https://www.ytubetools.com/it" hreflang="it" />
        <link rel="alternate" href="https://www.ytubetools.com/ja" hreflang="ja" />
        <link rel="alternate" href="https://www.ytubetools.com/ko" hreflang="ko" />
        <link rel="alternate" href="https://www.ytubetools.com/nl" hreflang="nl" />
        <link rel="alternate" href="https://www.ytubetools.com/pl" hreflang="pl" />
        <link rel="alternate" href="https://www.ytubetools.com/ru" hreflang="ru" />
          {/* Alternate hreflang Tags for SEO */}
          {/* {hreflangs &&
            hreflangs.map((hreflang, index) => (
              <link
                key={index}
                rel={hreflang.rel}
                hreflang={hreflang.hreflang}
                href={`${hreflang.href}`}
              />
            ))} */}
          {/* <link
            rel="alternate"
            hreflang="en"
            href={meta?.url?.replace(/\/$/, "").replace(/\/$/, "")}
          /> */}
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
        {t("YtubeTools | Free YouTube Tools For Creators,")}
          <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            {t('100% Free')}
          </span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-500">
        {t("Access 50+ free AI-powered YouTube tools for creators with unlimited usage—no credit card required!")}
        </p>
      </div>

      {/* Search Input for Desktop */}

      <div className="relative mx-auto mb-6 max-w-2xl rounded-full border border-indigo-100 bg-gray-50 px-4 py-2 xl:mb-10">
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-8 w-8 text-indigo-500"
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
            aria-label="Search"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full bg-indigo-500 px-4 py-1.5 text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
           {t('Search')}
          </button>
        </div>

        {/* Display search results when query matches tools or blogs */}
        <div className="relative mt-2">
          {searchResults?.length > 0 ? (
            <ul className="absolute z-10 bg-white text-black w-full mt-1 max-h-60 overflow-auto shadow-lg rounded-lg border border-gray-200">
              {searchResults?.map((result, index) => (
                <li
                  key={index}
                  className="p-3 hover:bg-indigo-100 cursor-pointer transition-colors duration-200"
                >
                  <Link href={result.link}>
                    <span className="text-blue-600 font-medium">
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
                    <span className="mb-2 text-6xl font-black tracking-tight text-indigo-600">
                      {/* If the value contains only numbers, animate the count */}
                      {hasNonNumericChars(stat.value) ? (
                        // If the value contains non-numeric characters, do not animate, just display it
                        <>
                          <CountUp
                            end={parseInt(cleanValue(stat.value), 10)} // CountUp only on the numeric part
                            duration={2}
                          />
                          {stat.value.replace(cleanValue(stat.value), "")}{" "}
                          {/* Add the non-numeric part (like M, +) */}
                        </>
                      ) : (
                        // If the value contains only numbers, animate it
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
              {t("AI YouTube Tools That Work For You")}
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
                <a key={index} href={tool?.link}>
                  <div className="group h-full cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[102%] hover:shadow-xl hover:ring-2 hover:ring-indigo-500 hover:border-2 hover:border-indigo-500 hover:bg-indigo-500 hover:bg-opacity-10 hover:backdrop-blur-md">
                    <div className="mb-4 flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm group-hover:shadow-md">
                        <img
                          alt={tool?.name}
                          className="rounded-full"
                          src={tool?.logo?.src}
                          height="28"
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

      {/* Blogs Grid */}
      <div className="mx-auto max-w-7xl px-4 py-4 lg:py-12">
        <div class="mx-auto max-w-3xl text-center px-4">
          <h2 class="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            {t("YtubeTools Article")}
          </h2>

          <p class="mt-6 text-xs sm:text-sm font-medium  leading-8 sm:leading-9 md:text-sm md:leading-10">
            {t("Explore how AI enhances content creation, reshapes social media, and beyond. Dive in with us to discover AI's practical applications and its transformative impact on various industries.")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {processedBlogs.length === 0 ? (
            <p>{t("No blogs found")}</p>
          ) : (
            processedBlogs.slice(0, 6).map((blog) => (
              <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
                <div className="w-full" style={{ height: "260px" }}>
                  <Image
                    src={blog.translations[currentLanguage]?.image}
                    alt={blog.translations[currentLanguage]?.title}
                    width={400}
                    height={260}
                    className="blog-img"
                    quality={50} // Image quality reduced
                  />
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                    <span className="mr-2">
                      {blog.translations[currentLanguage]?.category ||
                        "Unknown category"}
                    </span>
                  </div>
                </div>

                <div className="pe-3 ps-3 pt-2">
                  <h6 className="text-lg font-semibold">
                    <Link
                      href={`/youtube/${blog.translations[currentLanguage]?.slug}`}
                    >
                      <span className="text-blue-500 text-xl font-bold hover:underline">
                        {blog.translations[currentLanguage]?.title}
                      </span>
                    </Link>
                  </h6>
                  <p className="text-xs mb-4">
                    {" "}
                    {blog.translations[currentLanguage]?.description}
                  </p>
                </div>
                <div className="ps-3 pe-3 pb-2 d-flex">
                  <p className="text-sm text-gray-500">
                    <FaUserCircle className="text-center fs-6 text-red-400 inline" />{" "}
                    {blog.author}
                  </p>
                  <p className="text-sm text-gray-500 ms-auto">
                    <FaCalendar className="text-center text-red-400 inline me-2" />
                    <span className="text-xs">{blog?.createdAt}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/youtube"
            contenteditable="false"
            style={{ cursor: "pointer" }}
            aria-label="View all blog posts"
          >
            <span className="group inline-flex items-center justify-center rounded-full bg-white/80 px-8 py-4 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-200 backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-md hover:shadow-indigo-100/40 hover:ring-indigo-300">
              {t('View All Posts')}
              <svg
                className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                ></path>
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
export async function getServerSideProps({ locale = "en", req, query }) {
  const { page = 1, category = "" } = query;

  // Get the base URL from the request headers
  const protocol =
    req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  // Fetch the token securely (e.g., from cookies, environment variables)
  const token = "AZ-fc905a5a5ae08609ba38b046ecc8ef00";  // Secure token retrieval

  if (!token) {
    throw new Error("No authorization token found");
  }

  try {
    // Make the API request to fetch data
    const { data } = await axios.get(`${baseUrl}/api/youtube`, {
      headers: {
        Authorization: `Bearer ${token}`, // Add the Bearer token
      },
      params: { page, limit: 9, category },
    });

    // Construct the meta URL (to avoid duplication and ensure correct locale)
    const metaUrl = `${baseUrl}${req.url}`;

    return {
      props: {
        initialBlogs: data.data || [], // Safely access `data`
        meta: data.meta || { currentPage: 1, totalPages: 0 },
        availableLanguages: ["en", "es", "fr", "de"], // Add any other languages you want to support
        metaUrl,
        ...(await serverSideTranslations(locale, ["home", "navbar", "footer"])), // Add translations
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);

    return {
      props: {
        initialBlogs: [],
        meta: { currentPage: 1, totalPages: 0 },
        availableLanguages: [], // If error occurs, return an empty languages array
        metaUrl: `${baseUrl}${req.url}`,
      },
    };
  }
}
export default Home;
