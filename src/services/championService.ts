// services/championService.ts
import { Champion } from '@/services/ddragon';
import { LocalStorageManager } from '@/utils/localStorage';

export interface ChampionApiResponse {
  champions: Champion[];
  version: string;
  source: 'ddragon' | 'cache' | 'fallback' | 'emergency_fallback';
}

export class ChampionService {
  private static instance: ChampionService;
  private currentVersion: string | null = null;
  
  static getInstance(): ChampionService {
    if (!ChampionService.instance) {
      ChampionService.instance = new ChampionService();
    }
    return ChampionService.instance;
  }

  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  // Get the latest version and cache it for the application
  async ensureLatestVersion(): Promise<string> {
    try {
      const { ddragonService } = await import('@/services/ddragon');
      const version = await ddragonService.getLatestVersion();
      this.currentVersion = version;
      return version;
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      // Return cached version or fallback
      return this.currentVersion || '15.15.1';
    }
  }

  async getChampions(forceRefresh = false, cacheMaxAge?: number): Promise<Champion[]> {
    try {
      // Ensure we have the latest version before proceeding
      await this.ensureLatestVersion();
      
      // Check if we should use cached data
      // Use custom cache time if provided, otherwise use default (24 hours)
      const shouldUpdate = cacheMaxAge !== undefined 
        ? LocalStorageManager.shouldUpdateChampions(cacheMaxAge)
        : LocalStorageManager.shouldUpdateChampions();
        
      if (!forceRefresh && !shouldUpdate) {
        const storedData = LocalStorageManager.getChampionData();
        if (storedData) {
          console.log('Using cached champion data, version:', storedData.version);
          // Update currentVersion with cached version
          this.currentVersion = storedData.version;
          return storedData.champions;
        }
      }

      // Fetch fresh data from API
      console.log('Fetching fresh champion data from API...');
      const response = await fetch('/api/champions');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch champions: ${response.statusText}`);
      }

      const apiData: ChampionApiResponse = await response.json();
      console.log('Fetched champion data from:', apiData.source, 'version:', apiData.version);

      // Store the current version
      this.currentVersion = apiData.version;

      // Try to merge with existing user progress
      const existingData = LocalStorageManager.getChampionData();
      let finalChampions = apiData.champions;

      if (existingData) {
        // Merge user progress with new data
        const { ddragonService } = await import('@/services/ddragon');
        finalChampions = ddragonService.mergeWithUserProgress(
          apiData.champions,
          existingData.champions
        );
        console.log('Merged user progress with new champion data');
      } else {
        // Check for legacy data migration
        const legacyChampions = LocalStorageManager.migrateLegacyData();
        if (legacyChampions) {
          const { ddragonService } = await import('@/services/ddragon');
          finalChampions = ddragonService.mergeWithUserProgress(
            apiData.champions,
            legacyChampions
          );
          console.log('Migrated legacy champion data');
        }
      }

      // Save updated data to localStorage
      LocalStorageManager.setChampionData({
        champions: finalChampions,
        version: apiData.version,
        lastUpdate: Date.now(),
      });

      return finalChampions;
    } catch (error) {
      console.error('Error fetching champions:', error);
      
      // Fallback to stored data
      const storedData = LocalStorageManager.getChampionData();
      if (storedData) {
        console.log('Using fallback stored data due to fetch error');
        return storedData.champions;
      }

      // If all else fails, return empty array
      console.error('No champion data available');
      return [];
    }
  }

  updateChampionProgress(champions: Champion[]): void {
    const storedData = LocalStorageManager.getChampionData();
    if (storedData) {
      LocalStorageManager.setChampionData({
        ...storedData,
        champions,
        lastUpdate: Date.now(),
      });
    }
  }

  async refreshChampions(): Promise<Champion[]> {
    return this.getChampions(true); // Force refresh, ignore cache
  }

  clearCache(): void {
    LocalStorageManager.clearChampionData();
    this.currentVersion = null;
    // Also clear DDragon cache
    import('@/services/ddragon').then(({ ddragonService }) => {
      ddragonService.clearCache();
    }).catch(err => console.warn('Failed to clear DDragon cache:', err));
  }
}

export const championService = ChampionService.getInstance();
