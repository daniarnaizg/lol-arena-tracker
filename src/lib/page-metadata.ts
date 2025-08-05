import { Metadata } from 'next';
import { SITE_CONFIG } from './metadata';

export interface PageMetadataOptions {
  title?: string;
  description?: string;
  keywords?: readonly string[];
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Generates page-specific metadata with consistent structure
 */
export function generatePageMetadata({
  title,
  description = SITE_CONFIG.description,
  keywords = [],
  path = '',
  image,
  noIndex = false,
}: PageMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title;
  const url = `${SITE_CONFIG.url}${path}`;
  const ogImage = image || SITE_CONFIG.ogImage;
  const allKeywords = [...SITE_CONFIG.keywords, ...keywords];

  return {
    title: pageTitle,
    description,
    keywords: allKeywords,
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [ogImage],
      creator: SITE_CONFIG.creator,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}

// Predefined metadata for common pages
export const homePageMetadata = generatePageMetadata({
  title: 'Home',
  description: 'Track your League of Legends Arena mode progress, discover champion synergies, and monitor your match history in the fast-paced 2v2v2v2 game mode.',
  keywords: ['arena tracker', 'lol stats', 'champion progress'],
});

export const championsPageMetadata = generatePageMetadata({
  title: 'Champions',
  description: 'Browse all League of Legends champions, track your Arena mode progress, and discover powerful champion synergies for the 2v2v2v2 format.',
  path: '/champions',
  keywords: ['champions', 'lol champions', 'arena champions', 'champion synergies'],
});

export const matchHistoryPageMetadata = generatePageMetadata({
  title: 'Match History',
  description: 'View your League of Legends Arena match history, analyze your performance, and track your progress across different champion combinations.',
  path: '/match-history',
  keywords: ['match history', 'arena matches', 'lol history', 'game stats'],
});
