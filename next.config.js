const { i18n } = require('./next-i18next.config');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  i18n,
  swcMinify: true,
  trailingSlash: false,

  async rewrites() {
    // Rewrites API routes only if Amplify supports this configuration
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*', // সরাসরি public ফোল্ডার থেকে পরিবেশন করবে
      },
    ];
  },

  images: {
    domains: [
      'yt3.ggpht.com',
      'yt3.googleusercontent.com',
      'i.ytimg.com',
      'ytubetools.s3.eu-north-1.amazonaws.com',
    ],
  },

  webpack: (config, { isServer }) => {
    // Disable filesystem caching on serverless environments
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    } else {
      config.cache = false; // serverless environment এর জন্য caching off
    }

    return config;
  },
});
