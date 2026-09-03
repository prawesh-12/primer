/** @type {import('next').NextConfig} */

// The whole site is prerendered to static HTML so every page is crawlable
// without running JavaScript.  Vercel serves it from the root, so there is no
// basePath to derive; set NEXT_PUBLIC_SITE_URL to wherever it is deployed and
// canonicals, the sitemap and structured data follow.
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
