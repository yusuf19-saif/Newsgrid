/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const patterns = supabaseUrl
  ? [
      {
        protocol: 'https',
        hostname: new URL(supabaseUrl).hostname,
        pathname: '/storage/v1/object/public/article-images/**',
      },
    ]
  : [];

const nextConfig = {
  images: { remotePatterns: patterns },
};

module.exports = nextConfig;