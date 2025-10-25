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
        return [
            {
                source: '/uploads/:path*',
                destination: '/uploads/:path*', // Serve directly from public folder
            },
        ];
    },

    images: {
        // ✅ Remote patterns to allow images from external and internal sources
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

        // ✅ Domains fallback for older Next.js versions or when remotePatterns not enough
        domains: [
            'yt3.ggpht.com',
            'yt3.googleusercontent.com',
            'i.ytimg.com',
            'ytubetools.s3.eu-north-1.amazonaws.com',
            'img.youtube.com',
            'img.ytubetools.com', // Added custom CDN
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
});
