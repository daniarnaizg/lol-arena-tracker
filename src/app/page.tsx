
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import ChampionsGrid from '@/components/ChampionsGrid';
import { MatchHistory } from '@/components/MatchHistory';
import { ProgressCounter } from '@/components/ProgressCounter';
import Footer from '@/components/Footer';
import { VersionInitializer } from '@/components/VersionInitializer';
import { normalizeChampionName } from '@/utils/championUtils';
import { Champion } from '@/services/ddragon';
import { championService } from '@/services/championService';

export default function Home() {
  const [search, setSearch] = useState('');
  const [champions, setChampions] = useState<Champion[]>([]);
  
  // Wrap setChampions in useCallback to prevent unnecessary re-renders
  const updateChampions = useCallback((champions: Champion[] | ((prev: Champion[]) => Champion[])) => {
    setChampions(champions);
  }, []);
  
  // Load champions data
  useEffect(() => {
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
  }, []);
  
  const handleChampionSearch = (championName: string) => {
    // Normalize the champion name by removing apostrophes and other special characters
    const normalizedName = normalizeChampionName(championName);
    setSearch(normalizedName);
  };

  return (
    <VersionInitializer>
      <Header search={search} setSearch={setSearch} />
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-8">
        <MatchHistory onChampionSearch={handleChampionSearch} />
        <ProgressCounter champions={champions} />
        <ChampionsGrid search={search} champions={champions} setChampions={updateChampions} />
      </div>
      <Footer />
    </VersionInitializer>
  );
}
