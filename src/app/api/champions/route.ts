import { NextResponse } from 'next/server';
import { ddragonService, type Champion } from '@/services/ddragon';
import championsJsonFallback from '@/data/champions.json';

// Cache for server-side champion data
let cachedChampions: Champion[] | null = null;
let cachedVersion: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cachedChampions && cachedVersion && (now - cacheTimestamp < CACHE_TTL)) {
      return NextResponse.json({
        champions: cachedChampions,
        version: cachedVersion,
        source: 'cache'
      });
    }

    // Try to fetch from DDragon API
    try {
      const ddragonData = await ddragonService.getChampions();
      const champions = ddragonService.transformDDragonToAppFormat(ddragonData);
      
      // Update cache
      cachedChampions = champions;
      cachedVersion = ddragonData.version;
      cacheTimestamp = now;

      return NextResponse.json({
        champions,
        version: ddragonData.version,
        source: 'ddragon'
      });
    } catch (ddragonError) {
      console.warn('Failed to fetch from DDragon API, falling back to local data:', ddragonError);
      
      // Try to get the latest version even if champion data fails
      let fallbackVersion = '15.1.1'; // Default fallback
      try {
        fallbackVersion = await ddragonService.getLatestVersion();
      } catch (versionError) {
        console.warn('Failed to fetch latest version, using default:', versionError);
      }
      
      // Fallback to local JSON file
      const champions = championsJsonFallback as Champion[];
      
      // Update cache with fallback data
      cachedChampions = champions;
      cachedVersion = fallbackVersion;
      cacheTimestamp = now;

      return NextResponse.json({
        champions,
        version: fallbackVersion,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error in champions API route:', error);
    
    // Last resort: return the local JSON file
    return NextResponse.json({
      champions: championsJsonFallback,
      version: '15.1.1', // Default version for emergency fallback
      source: 'emergency_fallback'
    });
  }
}
