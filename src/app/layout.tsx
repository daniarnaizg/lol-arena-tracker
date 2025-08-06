"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from '@/components/Header';
import ChampionsGrid from '@/components/ChampionsGrid';
import { MatchHistory } from '@/components/MatchHistory';
import { ProgressCounter } from '@/components/ProgressCounter';
import Footer from '@/components/Footer';
import { normalizeChampionName } from '@/utils/championUtils';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

//export const metadata: Metadata = {
//  title: 'LoL Arena Tracker',
//  description: 'Track your LoL Arena champion status',
//};


import React, { useState, useEffect, useCallback } from 'react';
import { Champion } from '@/services/ddragon';
import { championService } from '@/services/championService';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-100`}>
        <Header search={search} setSearch={setSearch} />
        <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-8">
          <MatchHistory onChampionSearch={handleChampionSearch} />
          <ProgressCounter champions={champions} />
          <ChampionsGrid search={search} champions={champions} setChampions={updateChampions} />
        </div>
        <Footer />
        {children}
      </body>
    </html>
  );
}
