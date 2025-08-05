/**
 * Application-wide constants
 */

// Route definitions
export const ROUTES = {
  HOME: '/',
  CHAMPIONS: '/champions',
  MATCH_HISTORY: '/match-history',
} as const;

// SEO Constants
export const SEO_DEFAULTS = {
  MAX_TITLE_LENGTH: 60,
  MAX_DESCRIPTION_LENGTH: 160,
  DEFAULT_OG_IMAGE_WIDTH: 1200,
  DEFAULT_OG_IMAGE_HEIGHT: 630,
} as const;

// External URLs
export const EXTERNAL_URLS = {
  DDRAGON: 'https://ddragon.leagueoflegends.com',
  RIOT_API: 'https://americas.api.riotgames.com',
  TWITTER: 'https://twitter.com',
  GITHUB: 'https://github.com',
} as const;

// Performance settings
export const PERFORMANCE = {
  CHAMPION_LOAD_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];
