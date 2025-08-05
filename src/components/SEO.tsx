import React from 'react';
import { siteConfig } from '@/lib/metadata';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

export function SEOHead({
  title = siteConfig.title,
  description = siteConfig.description,
  keywords = siteConfig.keywords,
  canonical,
  ogImage = siteConfig.ogImage,
  noIndex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;
  const canonicalUrl = canonical || siteConfig.url;

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteConfig.name} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content={siteConfig.creator} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* Additional SEO tags */}
      <meta name="author" content={siteConfig.creator.replace('@', '')} />
      <meta name="creator" content={siteConfig.creator} />
      <meta name="publisher" content={siteConfig.name} />
      <meta name="application-name" content={siteConfig.name} />
      
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
  "name": siteConfig.name,
  "description": siteConfig.description,
  "url": siteConfig.url,
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": siteConfig.creator.replace('@', '')
  },
  "screenshot": siteConfig.ogImage,
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
