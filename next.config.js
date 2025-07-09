/** @type {import('next').NextConfig} */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '[YOUR_SUPABASE_PROJECT_ID].supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Correctly configure CopyWebpackPlugin
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
              to: path.resolve(__dirname, 'public'),
            },
          ],
        })
      );
    }

    // Exclude the public directory from Terser minification
    if (config.optimization.minimizer) {
      config.optimization.minimizer.forEach(minimizer => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.exclude = [/\.next\//, /public\//];
        }
      });
    }

    return config;
  },
};

module.exports = nextConfig;
