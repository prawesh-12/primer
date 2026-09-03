/** @type {import('next').NextConfig} */

// The whole site is prerendered to static HTML so every page is crawlable
// without running JavaScript.  Set NEXT_PUBLIC_SITE_URL to wherever it is
// deployed; a URL with a path (a GitHub Pages project site, say) also sets
// the basePath for you.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prawesh-12.github.io/system-design-primer';
const basePath = new URL(siteUrl).pathname.replace(/\/$/, '');

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
