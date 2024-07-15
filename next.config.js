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
      {
        source: '/uploads/:path*',
        destination: '/public/uploads/:path*',
      },
    ];
  },

  images: {
    domains: ['yt3.ggpht.com', 'yt3.googleusercontent.com', 'i.ytimg.com', 'lobster-app-2vkuu.ondigitalocean.app','learnmethods.com'],
  },
};
