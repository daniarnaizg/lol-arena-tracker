// utils/debugUtils.ts
import { championService } from '@/services/championService';
import { ddragonService } from '@/services/ddragon';

export interface DebugInfo {
  currentVersion: string | null;
  cachedVersion: string | null;
  isVersionCached: boolean;
  timestamp: string;
}

export async function getDebugInfo(): Promise<DebugInfo> {
  const currentVersion = championService.getCurrentVersion();
  const cachedVersion = ddragonService.getCachedVersion();
  
  return {
    currentVersion,
    cachedVersion,
    isVersionCached: !!cachedVersion,
    timestamp: new Date().toISOString()
  };
}

export function logVersionInfo(): void {
  getDebugInfo().then(info => {
    console.group('🔍 DDragon Version Debug Info');
    console.log('Current Version (ChampionService):', info.currentVersion);
    console.log('Cached Version (DDragonService):', info.cachedVersion);
    console.log('Is Version Cached:', info.isVersionCached);
    console.log('Timestamp:', info.timestamp);
    console.groupEnd();
  }).catch(err => {
    console.error('Failed to get debug info:', err);
  });
}

// Helper to test image URLs
export function testImageUrl(championKey: string, version?: string): void {
  const url = ddragonService.getChampionImageUrlSync(championKey, version);
  console.log(`Testing image URL for ${championKey}:`, url);
  
  // Test if the image loads
  const img = new Image();
  img.onload = () => console.log(`✅ Image loads successfully: ${url}`);
  img.onerror = () => console.log(`❌ Image failed to load: ${url}`);
  img.src = url;
}
