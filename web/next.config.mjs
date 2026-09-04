import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */

// Canonicals, the sitemap and structured data all derive from this.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://systemdesignprimer.vercel.app';

const nextConfig = {
  // There is a second lockfile above this one; say which root is meant.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
};

export default nextConfig;
