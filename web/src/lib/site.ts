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
  'System Design Primer for beginners: learn high level system design, low level design, scalable architecture, distributed systems and system design interview patterns.';

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

/** The upstream repository every piece of content comes from. */
export const UPSTREAM = 'https://github.com/donnemartin/system-design-primer';

/** Who put this reading edition together. */
export const BUILDER = 'https://github.com/prawesh-12';

export const LICENSE = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  holder: 'Donne Martin',
};

/** Prefix a site-absolute path with the deployment basePath. */
export function asset(pathname: string): string {
  if (!pathname.startsWith('/')) return pathname;
  return `${BASE_PATH}${pathname}`;
}

/** Absolute URL for canonical tags, sitemaps and structured data. */
export function absolute(pathname: string): string {
  const origin = new URL(SITE_URL).origin;
  return `${origin}${asset(pathname)}`;
}
