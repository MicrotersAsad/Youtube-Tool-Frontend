// pages/sitemap.xml.js

export default function Sitemap() {
    return null;
  }
  
  export async function getServerSideProps({ req, res }) {
    const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
  
    // List of language codes based on the provided language data
    const languages = [
      'en', 'fr', 'zh-HANT', 'zh-HANS', 'nl', 'gu', 'hi', 'it', 'ja', 'ko', 'pl', 'pt', 'ru', 'es', 'de'
    ];
  
    // List of tool routes
    const toolRoutes = [
        '/tools/tag-extractor',
        '/tools/description-generator',
        '/tools/title-generator',
        '/tools/youtube-title-and-description-extractor',
        '/tools/youtube-channel-banner-downloader',
        '/tools/youtube-hashtag-generator',
        '/tools/youtube-channel-logo-downloader',
        '/tools/youtube-thumbnail',
        '/tools/channel-id-finder',
        '/tools/video-data-viewer',
        '/tools/monetization-checker',
        '/tools/youtube-channel-search',
        '/tools/youtube-video-summary-generator',
        '/tools/trending-videos',
        '/tools/youtube-money-calculator',
        '/tools/youtube-comment-picker',
        '/tools/keyword-research',
        '/tools/youtube-embed-code-generator'
      ];
      
  
    // Generate language-based routes for each tool
    const languageBasedToolRoutes = toolRoutes.flatMap((route) => {
      return languages.map((lang) => `/${lang}${route}`);
    });
  
    // Define other static routes
    const staticRoutes = [
      '',          // Home page
      '/pricing',  // Pricing page
      '/about', // About Us page
      '/contact', // Contact Us page
      '/terms', // terms  page
      '/privacy', // privacy  page
    ];
  
    // Add language variations for the main static routes
    const languageBasedStaticRoutes = staticRoutes.flatMap((route) => {
      return languages.map((lang) => `/${lang}${route}`);
    });
  
    try {
      // Fetch dynamic routes for blogs with multiple languages
      const blogs = await fetch(`${baseUrl}/api/blogs`).then((res) => res.json());
      const blogRoutes = blogs.flatMap((blog) => {
        return Object.keys(blog.translations).map((lang) => {
          const slug = blog.translations[lang].slug;
          return `/${lang}/blog/${slug}`; // Assuming the URL structure includes the language code
        });
      });
  
      // Fetch dynamic routes for YouTube articles with multiple languages
      const youtubeArticles = await fetch(`${baseUrl}/api/youtube`).then((res) => res.json());
      const youtubeRoutes = youtubeArticles.flatMap((article) => {
        return Object.keys(article.translations).map((lang) => {
          const slug = article.translations[lang].slug;
          return `/${lang}/youtube/${slug}`; // Assuming the URL structure includes the language code
        });
      });
  
      // Combine all routes
      const allRoutes = [...languageBasedStaticRoutes, ...languageBasedToolRoutes, ...blogRoutes, ...youtubeRoutes];

  
      // Generate XML for the sitemap
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${allRoutes
            .map((route) => {
              return `
                <url>
                  <loc>${baseUrl}${route}</loc>
                  <lastmod>${new Date().toISOString()}</lastmod>
                </url>
              `;
            })
            .join('')}
        </urlset>
      `;
  
      // Set response headers and send the XML sitemap
      res.setHeader('Content-Type', 'text/xml');
      res.write(sitemap);
      res.end();
  
    } catch (error) {
      console.error("Error generating sitemap:", error);
    }
  
    return {
      props: {},
    };
  }
  