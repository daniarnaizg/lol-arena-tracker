/**
 * Centralized exports for lib utilities
 */

// Metadata exports
export { SITE_CONFIG, siteConfig, defaultMetadata } from './metadata';
export { generatePageMetadata, type PageMetadataOptions } from './page-metadata';

// Structured data exports
export {
  generateWebApplicationSchema,
  generateBreadcrumbSchema,
  generateGameSchema
} from './structured-data';

// Constants
export { ROUTES, SEO_DEFAULTS, EXTERNAL_URLS, PERFORMANCE } from './constants';
export type { RouteKey, RouteValue } from './constants';
