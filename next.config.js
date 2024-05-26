// next.config.js

module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['yt3.ggpht.com'],
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
