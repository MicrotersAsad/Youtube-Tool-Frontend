const { i18n } = require("./next-i18next.config");

module.exports = {
  reactStrictMode: true,
  i18n,

  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [
          {
            type: 'host',
            value: 'www.ytubetools.com',
          },
        ],
        destination: 'https://ytubetools.com/:1',
        permanent: true,
      },
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://ytubetools.com/:1',
        permanent: true,
      },
    ];
  },

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

  images: {
    domains: [
      'yt3.ggpht.com', 
      'yt3.googleusercontent.com', 
      'i.ytimg.com', 
      'https://lobster-app-2vkuu.ondigitalocean.app/',
      'learnmethods.com',
      '161.35.10.124',
      'ytubetools.com'
    ],
  },
};
