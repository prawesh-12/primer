/** @type {import('next').NextConfig} */

// Canonicals, the sitemap and structured data all derive from this.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://systemdesignprimer.vercel.app';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
};

export default nextConfig;
