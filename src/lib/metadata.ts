import { Metadata } from 'next';

// Site configuration constants
export const SITE_CONFIG = {
  name: "LoL Arena Tracker",
  title: "League of Legends Arena Tracker",
  description: "Track your League of Legends Arena mode progress, discover champion synergies, and monitor your match history.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://lol-arena-tracker.vercel.app",
  ogImage: "/og-image.jpg",
  creator: "@daniarnaizg",
  keywords: [
    "League of Legends",
    "LoL Arena",
    "Arena Mode",
    "Champion Tracker",
    "Match History",
    "2v2v2v2",
    "League Tracker",
    "LoL Stats",
    "Champion Synergies",
    "Riot Games",
    "Gaming Tracker"
  ]
} as const;

// For backward compatibility
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
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
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
    canonical: "/",
  }
};
