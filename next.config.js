const { i18n } = require("./next-i18next.config");
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  i18n,
  swcMinify: true, // Enable SWC-based minification

  async rewrites() {
    return [
      {
        source: '/:locale(en|fr|es)/:path*',
        destination: '/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: '/public/uploads/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
              img-src 'self' data:;
              style-src 'self' 'unsafe-inline';
              font-src 'self' data:;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },

  images: {
    domains: [
      'yt3.ggpht.com',
      'yt3.googleusercontent.com',
      'i.ytimg.com',
      'lobster-app-2vkuu.ondigitalocean.app',
      'learnmethods.com',
      '161.35.10.124'
    ],
  },
});
