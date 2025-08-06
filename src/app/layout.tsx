import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'LoL Arena Tracker',
    template: '%s | LoL Arena Tracker'
  },
  description: 'Track your League of Legends Arena champion mastery progress. Monitor which champions you\'ve played, won with, and mastered in Arena mode.',
  keywords: [
    'League of Legends',
    'LoL',
    'Arena',
    'Champion Tracker',
    'Arena Mode',
    'Champion Mastery',
    'League Arena',
    'LoL Stats',
    'Champion Progress'
  ],
  authors: [{ name: 'LoL Arena Tracker' }],
  creator: 'LoL Arena Tracker',
  publisher: 'LoL Arena Tracker',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lol-arena-tracker.vercel.app',
    siteName: 'LoL Arena Tracker',
    title: 'LoL Arena Tracker - Track Your Arena Champion Progress',
    description: 'Track your League of Legends Arena champion mastery progress. Monitor which champions you\'ve played, won with, and mastered in Arena mode.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LoL Arena Tracker - Champion Progress Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoL Arena Tracker - Track Your Arena Champion Progress',
    description: 'Track your League of Legends Arena champion mastery progress. Monitor which champions you\'ve played, won with, and mastered in Arena mode.',
    images: ['/og-image.png'],
    creator: '@yourtwitterhandle', // Replace with your actual Twitter handle
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-100`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
