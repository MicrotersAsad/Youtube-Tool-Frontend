const { i18n } = require('./next-i18next.config');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',  // Enables bundle analysis when ANALYZE is set to true
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,  // Strict mode to help identify potential issues in the app
  i18n,  // i18n configuration for language support
  swcMinify: true,  // Enables minification using SWC (faster and more optimized)
  trailingSlash: false,  // Ensures URL's trailing slashes are not included by default
  
  async rewrites() {
    // Rewrites API routes only if Amplify supports this configuration
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*', // Directly serve from public folder
      },
    ];
  },

  images: {
    domains: [
      'yt3.ggpht.com',  // Add all image domains you need to optimize and serve
      'yt3.googleusercontent.com',
      'i.ytimg.com',
      'ytubetools.s3.eu-north-1.amazonaws.com',
      'img.youtube.com'
    ],
  },

  webpack: (config, { isServer }) => {
    // Disable filesystem caching on serverless environments
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],  // Enable cache for faster builds
        },
      };
    } else {
      config.cache = false;  // Disable caching for serverless environment to avoid issues
    }

    // Other optimizations or configurations can go here if needed

    return config;
  },
});
