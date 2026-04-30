const { i18n } = require('./next-i18next.config');

// ✅ Safe bundle analyzer (won’t crash if not installed)
let withBundleAnalyzer = (config) => config;

if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  } catch (err) {
    console.warn('Bundle analyzer not installed');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  swcMinify: true,
  trailingSlash: false,

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/public/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'ytubetools.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.ytubetools.com',
        pathname: '/public/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
    ],

    domains: [
      'yt3.ggpht.com',
      'yt3.googleusercontent.com',
      'i.ytimg.com',
      'ytubetools.s3.eu-north-1.amazonaws.com',
      'img.youtube.com',
      'img.ytubetools.com',
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    } else {
      config.cache = false;
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);