import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/react';
import { defaultMetadata, siteConfig } from '@/lib/metadata';
import { KofiOverlayWidget } from '@/components/KofiOverlayWidget';
import { BackToTopFab } from '@/components/ui/BackToTopFab';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    alternateName: ['League of Legends Arena Tracker', 'LoL Arena Tracker'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'en-US'
  } as const;

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    sameAs: [
      `https://twitter.com/${siteConfig.creator.replace('@', '')}`,
    ],
    logo: `${siteConfig.url}/icon-192.png`
  } as const;
  return (
    <html lang="en">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col bg-gray-100 pt-[env(safe-area-inset-top)] md:pt-0 pb-[env(safe-area-inset-bottom)] md:pb-0`}>
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <KofiOverlayWidget />
        {children}
  <BackToTopFab />
        <Analytics />
      </body>
    </html>
  );
}
