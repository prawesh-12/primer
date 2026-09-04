export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://systemdesignprimer.vercel.app').replace(
  /\/$/,
  '',
);

export const BASE_PATH = new URL(SITE_URL).pathname.replace(/\/$/, '');

export const SITE_NAME = 'System Design Primer';

export const SITE_TITLE = 'System Design Primer: System Design for Beginners';

export const SITE_TAGLINE =
  'Learn high level system design and low level design from the open source System Design Primer. Study scalable architecture, interview trade-offs and worked examples.';

export const SITE_DESCRIPTION =
  'System Design Primer for beginners: high level design, low level design, scalable architecture, distributed systems and system design interview patterns.';

export const SITE_KEYWORDS = [
  'system design primer',
  'system design for beginners',
  'high level system design',
  'high level design',
  'HLD',
  'low level design',
  'LLD',
  'system design interview',
  'scalable system design',
  'distributed systems',
  'software architecture',
  'object oriented design',
];

export const SITE_ALTERNATE_NAMES = [
  'The System Design Primer',
  'System Design for Beginners',
  'High Level System Design Guide',
  'HLD and LLD Primer',
];

// Shaped exactly like an Open Graph image entry: any extra key here is
// emitted as its own `og:image:*` tag.
export const SITE_OG_IMAGE = {
  url: absolute('/images/og-system-design-primer.png'),
  width: 1200,
  height: 630,
  alt: 'System Design Primer: HLD, LLD and interviews',
};

export const SITE_ICONS = {
  ico: '/favicon.ico',
  svg: '/favicon.svg',
  png192: '/icon-192.png',
  png512: '/icon-512.png',
  apple: '/apple-touch-icon.png',
  manifest: '/site.webmanifest',
};

export const UPSTREAM = 'https://github.com/donnemartin/system-design-primer';

export const BUILDER = 'https://github.com/prawesh-12';

export const LICENSE = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  holder: 'Donne Martin',
};

export function asset(pathname: string): string {
  if (!pathname.startsWith('/')) return pathname;
  return `${BASE_PATH}${pathname}`;
}

export function absolute(pathname: string): string {
  const origin = new URL(SITE_URL).origin;
  return `${origin}${asset(pathname)}`;
}
