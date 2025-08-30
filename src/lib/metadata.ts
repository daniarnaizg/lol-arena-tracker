import { Metadata } from 'next';

export const SITE_CONFIG = {
  name: "LoL Arena Win Tracker",
  title: "LoL Arena Win Tracker | League of Legends Arena Tracker",
  description:
    "Track your League of Legends Arena mode wins, champions, tierlist, builds, and augments with this simple web app.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://arenatracker.app",
  ogImage: "/og-image.png",
  creator: "@daniarnaizg",
  keywords: [
    "LoL Arena win tracker",
    "League of Legends Arena tracker",
    "LoL Arena champions",
    "LoL Arena tierlist",
    "LoL Arena builds",
    "LoL Arena augments",
    "League Arena stats",
    "LoL Arena match history",
    "League of Legends Arena mode",
    "Arena 2v2v2v2 tracker"
  ]
} as const;

export const siteConfig = SITE_CONFIG;

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [
    {
      name: siteConfig.creator.replace('@', ''),
      url: `https://twitter.com/${siteConfig.creator.replace('@', '')}`
    }
  ],
  creator: siteConfig.creator,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
        type: "image/png"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.creator
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  category: "Gaming",
  classification: "Gaming Tool",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: siteConfig.url,
  },
  themeColor: "#212f47"
};
