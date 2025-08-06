// utils/imageUtils.ts
import { ddragonService } from '@/services/ddragon';

export function createChampionImageUrl(championKey: string, version?: string): string {
  return ddragonService.getChampionImageUrlSync(championKey, version);
}

export function createImageErrorHandler(championName: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    // First fallback: try with a different version
    const currentSrc = e.currentTarget.src;
    if (!currentSrc.includes('15.15.1') && !currentSrc.includes('via.placeholder')) {
      e.currentTarget.src = ddragonService.getChampionImageUrlSync(championName, '15.15.1');
      return;
    }
    
    // Final fallback: placeholder image
    e.currentTarget.src = `https://via.placeholder.com/64x64/6b7280/ffffff?text=${championName.charAt(0)}`;
  };
}

export function preloadChampionImage(championKey: string, version?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image for ${championKey}`));
    img.src = createChampionImageUrl(championKey, version);
  });
}
