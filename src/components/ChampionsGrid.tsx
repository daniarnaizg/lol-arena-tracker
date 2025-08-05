"use client"
import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ControlPanel } from './ControlPanel';
import { ChampionsGridDisplay } from './ChampionsGridDisplay';
import { FilterType } from './ui/FilterButtons';
import { ChampionChecklist } from './ui/CheckboxButton';
import { championService } from '@/services/championService';
import { Champion } from '@/services/ddragon';

interface ChampionsGridProps {
  search: string;
}

const MIN_COLUMNS = 5;
const MAX_COLUMNS = 10;
const DEFAULT_COLUMNS = 8;

const ChampionsGrid = ({ search }: ChampionsGridProps) => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [isPressingClear, setIsPressingClear] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load champions using the new service
    const loadChampions = async () => {
      try {
        const championsData = await championService.getChampions();
        setChampions(championsData);
      } catch (error) {
        console.error('Failed to load champions:', error);
        // Fallback to empty array or show error message
        setChampions([]);
      }
    };

    loadChampions();
  }, []);

  useEffect(() => {
    if (champions.length > 0) {
      // Update champion progress using the service
      championService.updateChampionProgress(champions);
    }
  }, [champions]);

  const triggerConfetti = (elementRef?: HTMLElement) => {
    let origin = { x: 0.5, y: 0 }; // Default to top center
    
    if (elementRef) {
      // Get the position of the champion card
      const rect = elementRef.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      origin = { x, y };
    }
    
    // Gold confetti from champion position
    confetti({
      particleCount: 100,
      spread: 70,
      origin,
      colors: ['#ffd700', '#ffed4e', '#fff77a', '#b8860b'],
      gravity: 0.6,
      drift: 0,
      startVelocity: 45
    });
  };

  const clearAllSelections = () => {
    setChampions(prev =>
      prev.map(champ => ({
        ...champ,
        checklist: { played: false, top4: false, win: false }
      }))
    );
  };

  // Automatic refresh every minute
  useEffect(() => {
    const refreshChampions = async () => {
      try {
        // Check every minute, but with a shorter cache time (5 minutes = 300000ms)
        // This allows for fresh data while not being too aggressive with API calls
        const FIVE_MINUTES = 5 * 60 * 1000;
        const refreshedChampions = await championService.getChampions(false, FIVE_MINUTES);
        setChampions(refreshedChampions);
        console.log('Champions data auto-refreshed successfully');
      } catch (error) {
        console.error('Failed to auto-refresh champions:', error);
      }
    };

    // Set up interval for automatic refresh every minute (60000ms)
    const intervalId = setInterval(refreshChampions, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const startClearPress = () => {
    setIsPressingClear(true);
    setClearProgress(0);
    
    const TOTAL_DURATION = 2000; // 2 seconds for better UX
    const INTERVAL = 40; // 40ms intervals for smoother animation
    const INCREMENT = (100 / TOTAL_DURATION) * INTERVAL; // Calculate increment for smooth progress
    
    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setClearProgress(prev => {
        const newProgress = prev + INCREMENT;
        if (newProgress >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return newProgress;
      });
    }, INTERVAL);
    
    // Execute clear after the full duration
    clearTimeoutRef.current = setTimeout(() => {
      clearAllSelections();
      stopClearPress();
    }, TOTAL_DURATION);
  };

  const stopClearPress = () => {
    setIsPressingClear(false);
    setClearProgress(0);
    
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleChecklistChange = (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => {
    setChampions(prev =>
      prev.map(champ => {
        if (champ.id !== id) return champ;
        let checklist = { ...champ.checklist };
        const wasWin = checklist.win;
        
        if (key === 'win') {
          checklist = { played: true, top4: true, win: !checklist.win };
          // Trigger confetti when achieving a win (not when removing it)
          if (!wasWin && checklist.win && effectsEnabled) {
            setTimeout(() => triggerConfetti(elementRef), 100);
          }
        } else if (key === 'top4') {
          checklist = { played: true, top4: !checklist.top4, win: false };
        } else if (key === 'played') {
          checklist = { played: !checklist.played, top4: false, win: false };
        }
        return { ...champ, checklist };
      })
    );
  };

  // Filtering logic
  const filteredChampions = champions.filter(champ => {
    const checklist = champ.checklist || { played: false, top4: false, win: false };
    const nameMatch = champ.name.toLowerCase().includes(search.toLowerCase());
    if (!nameMatch) return false;
    if (filter === 'all') return true;
    if (filter === 'played') return checklist.played && !checklist.top4 && !checklist.win;
    if (filter === 'top4') return checklist.top4 && !checklist.win;
    if (filter === 'win') return checklist.win;
    if (filter === 'unplayed') return !checklist.played && !checklist.top4 && !checklist.win;
    return true;
  });

  return (
    <section className="flex-1 w-full max-w-7xl mx-auto p-6">
      <ControlPanel
        columns={columns}
        minColumns={MIN_COLUMNS}
        maxColumns={MAX_COLUMNS}
        onColumnsChange={setColumns}
        effectsEnabled={effectsEnabled}
        onEffectsToggle={() => setEffectsEnabled(!effectsEnabled)}
        isClearing={isPressingClear}
        clearProgress={clearProgress}
        onClearStart={startClearPress}
        onClearStop={stopClearPress}
        currentFilter={filter}
        onFilterChange={setFilter}
      />
      
      <ChampionsGridDisplay
        champions={filteredChampions}
        columns={columns}
        onChecklistChange={handleChecklistChange}
        effectsEnabled={effectsEnabled}
      />
    </section>
  );
};

export default ChampionsGrid;
