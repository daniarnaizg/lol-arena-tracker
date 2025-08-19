// utils/imageUtils.ts
import { ddragonService } from '@/services/ddragon';

// Keep track of images that failed to load so we stop retrying
const blockedImages = new Set<string>();

export function markImageBlocked(key: string) {
  blockedImages.add(key);
}

export function isImageBlocked(key: string): boolean {
  return blockedImages.has(key);
}

export function createChampionImageUrl(championKey: string, version?: string): string {
  if (isImageBlocked(championKey)) {
    // Return empty string so callers can conditionally skip rendering
    return '';
  }
  return ddragonService.getChampionImageUrlSync(championKey, version);
}

export function createImageErrorHandler(championKey: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Mark this key as blocked to prevent further fetch attempts on rerenders
    markImageBlocked(championKey);
    // Prevent any further error loops
    const imgEl = e.currentTarget as HTMLImageElement;
    if (imgEl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (imgEl as any).onerror = null;
    }
    // Swap to a 1x1 transparent pixel to visually hide without network calls
    e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
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
