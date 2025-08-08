import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/react';
import { defaultMetadata } from '@/lib/metadata';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh md:min-h-screen flex flex-col bg-gray-100 pt-[env(safe-area-inset-top)] md:pt-0 pb-[env(safe-area-inset-bottom)] md:pb-0`}>
        <KofiOverlayWidget />
        {children}
  <BackToTopFab />
        <Analytics />
      </body>
    </html>
  );
}
