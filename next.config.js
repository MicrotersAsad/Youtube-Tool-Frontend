// // next.config.js

const { i18n } = require("./next-i18next.config");

module.exports = {
  reactStrictMode: true,
  i18n,
  
  async rewrites() {
    return [
      {
        source: '/:locale(en|fr|es)/:path*',
        destination: '/:path*',
      },
    ];
  },
  
  images: {
    domains: ['yt3.ggpht.com','yt3.googleusercontent.com', 'i.ytimg.com','https://lobster-app-2vkuu.ondigitalocean.app/'],
  },
  
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/public/uploads/:path*',
      },
    ];
  },
};


// // next.config.js
// // const { i18n } = require('./next-i18next.config');

// // module.exports = {
// //   i18n,
// // };
