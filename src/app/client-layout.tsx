"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ChampionsGrid from '@/components/ChampionsGrid';
import { MatchHistory } from '@/components/MatchHistory';
import { ProgressCounter } from '@/components/ProgressCounter';
import Footer from '@/components/Footer';
import { normalizeChampionName } from '@/utils/championUtils';
import { Champion } from '@/services/ddragon';
import { championService } from '@/services/championService';
import { ROUTES, type RouteValue } from '@/lib/constants';
import { Analytics } from "@vercel/analytics/next"

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Routes that should show the main application layout
const MAIN_APP_ROUTES: readonly RouteValue[] = [ROUTES.HOME] as const;

/**
 * Type guard to check if current route should show main app
 */
const isMainAppRoute = (pathname: string): boolean => {
  return MAIN_APP_ROUTES.includes(pathname as RouteValue);
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [champions, setChampions] = useState<Champion[]>([]);
  
  const shouldShowMainApp = isMainAppRoute(pathname);
  
  // Wrap setChampions in useCallback to prevent unnecessary re-renders
  const updateChampions = useCallback((champions: Champion[] | ((prev: Champion[]) => Champion[])) => {
    setChampions(champions);
  }, []);
  
  // Load champions data only for main app routes
  useEffect(() => {
    if (!shouldShowMainApp) return;
    
    const loadChampions = async () => {
      try {
        const championsData = await championService.getChampions();
        setChampions(championsData);
      } catch (error) {
        console.error('Failed to load champions:', error);
        setChampions([]);
      }
    };

    loadChampions();
  }, [shouldShowMainApp]);
  
  const handleChampionSearch = useCallback((championName: string) => {
    const normalizedName = normalizeChampionName(championName);
    setSearch(normalizedName);
  }, []);

  // Render special pages (like 404) without main app layout
  if (!shouldShowMainApp) {
    return <>{children}</>;
  }

  // Render main application layout
  return (
    <>
      <Header search={search} setSearch={setSearch} />
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-8">
        <MatchHistory onChampionSearch={handleChampionSearch} />
        <ProgressCounter champions={champions} />
        <ChampionsGrid 
          search={search} 
          champions={champions} 
          setChampions={updateChampions} 
        />
      </main>
      <Footer />
      <Analytics />
      {children}
    </>
  );
}
