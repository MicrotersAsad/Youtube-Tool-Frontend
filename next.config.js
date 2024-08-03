const { i18n } = require('./next-i18next.config');
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
    ],
  },

  webpack: (config, { isServer }) => {
    // Enable filesystem caching for webpack builds
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
});
