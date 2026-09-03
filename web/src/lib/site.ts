export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://systemdesignprimer.github.io').replace(
  /\/$/,
  '',
);

export const BASE_PATH = new URL(SITE_URL).pathname.replace(/\/$/, '');

export const SITE_NAME = 'System Design Primer';

export const SITE_TAGLINE = 'Learn how to design large-scale systems. Prep for the system design interview.';

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
