import { SITE_CONFIG } from './metadata';

/**
 * Generates structured data for the web application
 */
export const generateWebApplicationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": SITE_CONFIG.name,
  "description": SITE_CONFIG.description,
  "url": SITE_CONFIG.url,
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": SITE_CONFIG.creator.replace('@', '')
  },
  "screenshot": `${SITE_CONFIG.url}/og-image.jpg`,
  "featureList": [
    "Champion progress tracking",
    "Match history analysis",
    "Arena mode statistics",
    "Champion synergy discovery"
  ]
});

/**
 * Generates breadcrumb structured data
 */
export const generateBreadcrumbSchema = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

/**
 * Generates game-specific structured data
 */
export const generateGameSchema = (gameName: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": gameName,
  "description": description,
  "genre": "MOBA",
  "gamePlatform": "PC",
  "publisher": {
    "@type": "Organization",
    "name": "Riot Games"
  }
});
