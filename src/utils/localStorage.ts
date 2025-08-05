// utils/localStorage.ts
import { Champion } from '@/services/ddragon';

export const STORAGE_KEYS = {
  CHAMPIONS: 'champions',
  CHAMPIONS_VERSION: 'champions_version',
  LAST_UPDATE: 'champions_last_update',
} as const;

export interface StoredChampionData {
  champions: Champion[];
  version: string;
  lastUpdate: number;
}

export class LocalStorageManager {
  static setChampionData(data: StoredChampionData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.CHAMPIONS, JSON.stringify(data.champions));
      localStorage.setItem(STORAGE_KEYS.CHAMPIONS_VERSION, data.version);
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, data.lastUpdate.toString());
    } catch (error) {
      console.warn('Failed to save champion data to localStorage:', error);
    }
  }

  static getChampionData(): StoredChampionData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const champions = localStorage.getItem(STORAGE_KEYS.CHAMPIONS);
      const version = localStorage.getItem(STORAGE_KEYS.CHAMPIONS_VERSION);
      const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);

      if (!champions || !version || !lastUpdate) {
        return null;
      }

      return {
        champions: JSON.parse(champions),
        version,
        lastUpdate: parseInt(lastUpdate, 10),
      };
    } catch (error) {
      console.warn('Failed to load champion data from localStorage:', error);
      return null;
    }
  }

  static clearChampionData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAMPIONS);
      localStorage.removeItem(STORAGE_KEYS.CHAMPIONS_VERSION);
      localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    } catch (error) {
      console.warn('Failed to clear champion data from localStorage:', error);
    }
  }

  static shouldUpdateChampions(cacheMaxAge: number = 24 * 60 * 60 * 1000): boolean {
    const stored = this.getChampionData();
    if (!stored) return true;

    const now = Date.now();
    const isExpired = now - stored.lastUpdate > cacheMaxAge;
    
    return isExpired;
  }

  // Legacy migration: handle old format where champions were stored directly
  static migrateLegacyData(): Champion[] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const oldChampions = localStorage.getItem('champions');
      if (oldChampions) {
        const parsed = JSON.parse(oldChampions);
        // Check if it's in the old format (direct array without version info)
        if (Array.isArray(parsed)) {
          console.log('Migrating legacy champion data...');
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to migrate legacy data:', error);
    }
    
    return null;
  }
}
