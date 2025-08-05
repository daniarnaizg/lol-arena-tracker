import React from 'react';
import { SITE_CONFIG } from '@/lib/metadata';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: readonly string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

export function SEOHead({
  title = SITE_CONFIG.title,
  description = SITE_CONFIG.description,
  keywords = SITE_CONFIG.keywords,
  canonical,
  ogImage = SITE_CONFIG.ogImage,
  noIndex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes(SITE_CONFIG.name) ? title : `${title} | ${SITE_CONFIG.name}`;
  const canonicalUrl = canonical || SITE_CONFIG.url;

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={[...keywords].join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content={SITE_CONFIG.creator} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* Additional SEO tags */}
      <meta name="author" content={SITE_CONFIG.creator.replace('@', '')} />
      <meta name="creator" content={SITE_CONFIG.creator} />
      <meta name="publisher" content={SITE_CONFIG.name} />
      <meta name="application-name" content={SITE_CONFIG.name} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
    </>
  );
}

// Pre-built structured data schemas
export const getWebApplicationSchema = () => ({
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
  "screenshot": SITE_CONFIG.ogImage,
  "featureList": [
    "Champion progress tracking",
    "Match history analysis", 
    "Arena mode statistics",
    "Champion synergy discovery"
  ]
});

export const getBreadcrumbSchema = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const getGameSchema = (gameName: string, description: string) => ({
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
