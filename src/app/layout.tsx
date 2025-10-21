import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { defaultMetadata, siteConfig } from "@/lib/metadata";
import { KofiOverlayWidget } from "@/components/KofiOverlayWidget";
import { BackToTopFab } from "@/components/ui/BackToTopFab";

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
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": ["WebSite", "WebApplication"],
      name: "LoL Arena Win Tracker",
      url: siteConfig.url,
      description:
        "Track your League of Legends Arena mode wins, champions, tierlist, builds, and augments with this simple web app.",
      alternateName: [
        "League of Legends Arena Tracker",
        "LoL Arena Tracker",
        "LoL Arena Win Tracker",
        "LoL Arena Champion Tracker",
      ],
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      inLanguage: "en-US",
      keywords: [
        "LoL Arena win tracker",
        "League of Legends Arena champions",
        "LoL Arena tierlist",
        "LoL Arena builds",
        "LoL Arena augments",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: {
        "@type": "Organization",
        name: "LoL Arena Tracker",
        url: siteConfig.url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is LoL Arena Win Tracker?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoL Arena Win Tracker is a free web app to track your wins, champions, builds, tierlist, and augments in League of Legends Arena mode.",
          },
        },
        {
          "@type": "Question",
          name: "Is LoL Arena Win Tracker free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, the tracker is completely free to use. You can log your Arena wins, review tierlists, and explore builds and augments without cost.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use LoL Arena Win Tracker to find the best champions?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The tracker helps you review champion performance, compare tierlists, and discover effective builds and augments to improve your Arena gameplay.",
          },
        },
        {
          "@type": "Question",
          name: "How can I track LoL Arena wins?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can track your LoL Arena wins by just searching for your match history and applying the results or manually importing them.",
          },
        },
      ],
    },
  ] as const;

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    sameAs: [`https://twitter.com/${siteConfig.creator.replace("@", "")}`],
    logo: `${siteConfig.url}/icon-192.png`,
  } as const;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col bg-gray-100 pt-[env(safe-area-inset-top)] md:pt-0 pb-[env(safe-area-inset-bottom)] md:pb-0`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KZLK43M4W0"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KZLK43M4W0');
            `
          }}
        />
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2604711888144159"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <KofiOverlayWidget />
        {children}
        <BackToTopFab />
        <Analytics />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="4d347230-cdc7-4930-8bf9-ca5cd56c3f27"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
