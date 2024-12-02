// pages/sitemap.xml.js
export default function Sitemap() {
    return null;  // This is a placeholder, the sitemap is generated server-side
  }
  
  export async function getServerSideProps({ req, res }) {
    const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;  // Define the base URL
    console.log('Base URL:', baseUrl);  // Check the base URL for debugging
  
    // Authorization token (replace this with your actual token)
    const authToken = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00';  // Replace with your token
  
    // List of language codes
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
  
    // Function to generate language-based routes
    const generateLanguageRoutes = (routes) => {
      return routes.flatMap(route => 
        languages.map(lang => `/${lang}${route}`)
      );
    };
  
    // Static routes (non-tool pages)
    const staticRoutes = [
      '',           // Home page
      '/pricing',   // Pricing page
      '/about',     // About Us page
      '/contact',   // Contact Us page
      '/terms',     // Terms page
      '/privacy',   // Privacy page
    ];
  
    // Combine static routes with language variations
    const languageBasedStaticRoutes = generateLanguageRoutes(staticRoutes);
  
    // Combine tool routes with language variations
    const languageBasedToolRoutes = generateLanguageRoutes(toolRoutes);
  
    try {
      // Fetch dynamic routes for blogs with authorization header
      const blogs = await fetch(`${baseUrl}/api/blogs`, {
        headers: {
          Authorization: `Bearer ${authToken}`, // Adding the Authorization header
        }
      }).then(res => res.json());
  
      // Check if blogs is an array
      if (!Array.isArray(blogs)) {
        console.error('Expected blogs to be an array, but got:', blogs);
        return { props: {} };
      }
  
      // Map over blogs to create routes
      const blogRoutes = blogs.flatMap(blog => {
        return Object.keys(blog.translations).map(lang => {
          const slug = blog.translations[lang].slug;
          return lang === 'en' ? `/blog/${slug}` : `/${lang}/blog/${slug}`;
        });
      });
  
      // Fetch dynamic routes for YouTube articles with authorization header
      const youtubeArticles = await fetch(`${baseUrl}/api/youtube`, {
        headers: {
          Authorization: `Bearer ${authToken}`, // Adding the Authorization header
        }
      }).then(res => res.json());
  
      // Check if youtubeArticles is an object with a data array
      if (!youtubeArticles || !Array.isArray(youtubeArticles.data)) {
        console.error('Expected youtubeArticles to have a "data" array, but got:', youtubeArticles);
        return { props: {} };
      }
  
      // Map over YouTube articles to create routes
      const youtubeRoutes = youtubeArticles.data.flatMap(article => {
        return Object.keys(article.translations).map(lang => {
          const slug = article.translations[lang].slug;
          return lang === 'en' ? `/youtube/${slug}` : `/${lang}/youtube/${slug}`;
        });
      });
  
      // Combine all routes
      const allRoutes = [
        ...staticRoutes.map(route => `${baseUrl}${route}`),       // Default static routes
        ...languageBasedStaticRoutes.map(route => `${baseUrl}${route}`), // Language variations of static routes
        ...toolRoutes.map(route => `${baseUrl}${route}`),         // Default tool routes
        ...languageBasedToolRoutes.map(route => `${baseUrl}${route}`),   // Language variations of tool routes
        ...blogRoutes.map(route => `${baseUrl}${route}`),         // Blog routes
        ...youtubeRoutes.map(route => `${baseUrl}${route}`)       // YouTube article routes
      ];
  
      console.log('Sitemap generated with the following routes:', allRoutes);  // Debugging output
  
      // Generate XML for the sitemap
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${allRoutes
            .map(route => {
              return `
                <url>
                  <loc>${route}</loc>
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
  
    return { props: {} };
  }
  