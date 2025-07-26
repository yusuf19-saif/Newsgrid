/** @type {import('next').NextConfig} */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                // This will be in the format of 'your-project-id.supabase.co'
                // We extract the hostname from the full URL environment variable.
                hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            },
        ],
    },
};

module.exports = nextConfig;
