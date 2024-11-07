// pages/blog-sitemap.xml.js

export default function Sitemap() {
    return null;
  }
  
  export async function getServerSideProps({ req, res }) {
    const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
  
    const blogs = await fetch(`${baseUrl}/api/blogs`).then((res) => res.json());
    const blogRoutes = blogs.flatMap((blog) => {
      return Object.keys(blog.translations).map((lang) => {
        const slug = blog.translations[lang].slug;
        return `/${lang}/blog/${slug}`;
      });
    });
  
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${blogRoutes
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
  
    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();
  
    return { props: {} };
  }
  