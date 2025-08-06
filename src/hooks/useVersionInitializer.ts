// hooks/useVersionInitializer.ts
"use client";

import { useEffect, useState } from 'react';
import { championService } from '@/services/championService';

export function useVersionInitializer() {
  const [isVersionReady, setIsVersionReady] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    const initializeVersion = async () => {
      try {
        const version = await championService.ensureLatestVersion();
        setCurrentVersion(version);
        setIsVersionReady(true);
        console.log('DDragon version initialized:', version);
      } catch (error) {
        console.error('Failed to initialize DDragon version:', error);
        // Set as ready with fallback version so app doesn't hang
        setCurrentVersion('15.15.1');
        setIsVersionReady(true);
      }
    };

    initializeVersion();
  }, []);

  return {
    isVersionReady,
    currentVersion
  };
}
