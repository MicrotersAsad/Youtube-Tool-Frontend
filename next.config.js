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
                destination: '/uploads/:path*', // Directly serve from public folder
            },
        ];
    },

    images: {
        // Correctly configured remote pattern to allow images from the Express server (localhost:4000)
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '4000', // Specify the port used by your Express server
                pathname: '/public/uploads/**', // Optionally restrict to this path
            },
        ],
        // Existing domains
        domains: [
            'yt3.ggpht.com', 
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
                    config: [__filename], 
                },
            };
        } else {
            config.cache = false; 
        }

        // Other optimizations or configurations can go here if needed

        return config;
    },
});