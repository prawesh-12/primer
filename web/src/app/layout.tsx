import type { Metadata, Viewport } from 'next';
import { Geist, Space_Grotesk } from 'next/font/google';

import AppShell from '@/components/AppShell';
import ThemeProvider from '@/components/ThemeProvider';
import { allSections, groupsInSection, manifest } from '@/lib/content';
import type { NavSection } from '@/lib/nav';
import {
  LICENSE,
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_ICONS,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
  UPSTREAM,
  asset,
} from '@/lib/site';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'Donne Martin', url: UPSTREAM }],
  creator: 'Donne Martin',
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  // Shipping the files in `public/` is not enough: crawlers only look for a
  // favicon that is declared in the markup.
  manifest: asset(SITE_ICONS.manifest),
  icons: {
    icon: [
      { url: asset(SITE_ICONS.ico), sizes: '48x48', type: 'image/x-icon' },
      { url: asset(SITE_ICONS.svg), type: 'image/svg+xml' },
      { url: asset(SITE_ICONS.png192), sizes: '192x192', type: 'image/png' },
      { url: asset(SITE_ICONS.png512), sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: asset(SITE_ICONS.ico) }],
    apple: [{ url: asset(SITE_ICONS.apple), sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [SITE_OG_IMAGE],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE.url],
  },
  category: 'technology',
  verification: { google: 'IDix7jtEtUJ9Rx3H9YZPGKn-zI8Wf3GNoMcCIQFKMPc' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

function buildNav(): NavSection[] {
  return allSections().map((section) => ({
    id: section.id,
    route: section.route,
    title: section.title,
    kicker: section.kicker,
    groups: groupsInSection(section.id).map((group) => ({
      name: group.name,
      pages: group.pages.map((page) => ({ route: page.route, navTitle: page.navTitle })),
    })),
  }));
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = buildNav();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // One node every other page type references by @id.
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        logo: {
          '@type': 'ImageObject',
          '@id': `${SITE_URL}/#logo`,
          url: `${SITE_URL}${SITE_ICONS.png512}`,
          width: 512,
          height: 512,
          caption: SITE_NAME,
        },
        image: { '@id': `${SITE_URL}/#logo` },
        sameAs: [UPSTREAM],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        license: LICENSE.url,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'LearningResource',
        '@id': `${SITE_URL}/#learning-resource`,
        name: SITE_TITLE,
        alternateName: SITE_ALTERNATE_NAMES,
        description: SITE_TAGLINE,
        url: `${SITE_URL}/`,
        inLanguage: 'en',
        isAccessibleForFree: true,
        educationalLevel: ['Beginner', 'Intermediate'],
        learningResourceType: ['Guide', 'Tutorial', 'Interview preparation'],
        teaches: [
          'system design for beginners',
          'high level system design',
          'low level design',
          'distributed systems',
          'scalable architecture',
        ],
        keywords: SITE_KEYWORDS.join(', '),
        license: LICENSE.url,
        dateModified: manifest().dates['/'],
        provider: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', geist.variable, display.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell nav={nav}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
