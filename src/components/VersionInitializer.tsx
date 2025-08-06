"use client";

import { useVersionInitializer } from '@/hooks/useVersionInitializer';
import { logVersionInfo } from '@/utils/debugUtils';
import { useEffect } from 'react';

interface VersionInitializerProps {
  children: React.ReactNode;
}

export function VersionInitializer({ children }: VersionInitializerProps) {
  const { isVersionReady, currentVersion } = useVersionInitializer();

  // Log version info when ready (only in development)
  useEffect(() => {
    if (isVersionReady && process.env.NODE_ENV === 'development') {
      logVersionInfo();
    }
  }, [isVersionReady, currentVersion]);

  // Don't block the UI - let the app render while version loads
  // The version will be cached and available for subsequent image loads
  return <>{children}</>;
}
