import type { Metadata, Viewport } from 'next';
import { Geist, Space_Grotesk } from 'next/font/google';

import AppShell from '@/components/AppShell';
import ThemeProvider from '@/components/ThemeProvider';
import { allSections, groupsInSection } from '@/lib/content';
import type { NavSection } from '@/lib/nav';
import { LICENSE, SITE_NAME, SITE_TAGLINE, SITE_URL, UPSTREAM, absolute } from '@/lib/site';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

/** Headings only: a face with enough character to be an entry point on sight. */
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: High Level & Low Level System Design`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  keywords: [
    'system design',
    'system design interview',
    'high level design',
    'HLD',
    'low level design',
    'LLD',
    'object oriented design',
    'scalability',
    'distributed systems',
    'software architecture',
    'system design primer',
  ],
  authors: [{ name: 'Donne Martin', url: UPSTREAM }],
  creator: 'Donne Martin',
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME}: High Level & Low Level System Design`,
    description: SITE_TAGLINE,
    url: SITE_URL,
    images: [{ url: absolute('/images/jj3A5N8.png'), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME}: High Level & Low Level System Design`,
    description: SITE_TAGLINE,
    images: [absolute('/images/jj3A5N8.png')],
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
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_TAGLINE,
        inLanguage: 'en',
        license: LICENSE.url,
      },
      {
        '@type': 'EducationalOccupationalProgram',
        name: 'System Design Primer: HLD & LLD tracks',
        description: SITE_TAGLINE,
        url: `${SITE_URL}/`,
        provider: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
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
