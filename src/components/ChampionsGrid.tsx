"use client"
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ControlPanel } from './ControlPanel';
import { ChampionsGridDisplay } from './ChampionsGridDisplay';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { FilterType } from './ui/FilterButtons';
import { ChampionChecklist } from './ui/CheckboxButton';
import { championService } from '@/services/championService';
import { Champion } from '@/services/ddragon';
import { championNameIncludes } from '@/utils/championUtils';

interface ChampionsGridProps {
  search: string;
  champions: Champion[];
  setChampions: React.Dispatch<React.SetStateAction<Champion[]>>;
}

const MIN_COLUMNS = 5;
const MAX_COLUMNS = 10;
const DEFAULT_COLUMNS = 8;

const ChampionsGrid = ({ search, champions, setChampions }: ChampionsGridProps) => {
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['all']);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);

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

  const handleImport = (importedChampions: Champion[]) => {
    // Merge imported data with current champions
    // Retro-compatible: only import progress for champions that exist in current data
    setChampions(prev => {
      const importedMap = new Map(
        importedChampions.map(champ => [champ.name.toLowerCase(), champ])
      );
      
      return prev.map(currentChamp => {
        const imported = importedMap.get(currentChamp.name.toLowerCase());
        if (imported && imported.checklist) {
          // Import the checklist data but keep current champion metadata
          return {
            ...currentChamp,
            checklist: { ...imported.checklist }
          };
        }
        return currentChamp;
      });
    });
    
    console.log('Champion progress imported successfully');
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
  }, [setChampions]);

  const handleClearAllClick = () => {
    setShowClearModal(true);
  };

  const handleClearConfirm = () => {
    clearAllSelections();
    setShowClearModal(false);
  };

  const handleClearCancel = () => {
    setShowClearModal(false);
  };

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
    
    // Use the utility function for normalized champion name matching
    const nameMatch = championNameIncludes(champ.name, search);
    if (!nameMatch) return false;
    
    // If 'all' is active, show everything
    if (activeFilters.includes('all')) return true;
    
    // Check if champion matches any of the active filters
    return activeFilters.some(filter => {
      if (filter === 'played') return checklist.played && !checklist.top4 && !checklist.win;
      if (filter === 'top4') return checklist.top4 && !checklist.win;
      if (filter === 'win') return checklist.win;
      if (filter === 'unplayed') return !checklist.played && !checklist.top4 && !checklist.win;
      return false;
    });
  });

  return (
    <section className="flex-1 w-full">
      <ControlPanel
        columns={columns}
        minColumns={MIN_COLUMNS}
        maxColumns={MAX_COLUMNS}
        onColumnsChange={setColumns}
        effectsEnabled={effectsEnabled}
        onEffectsToggle={() => setEffectsEnabled(!effectsEnabled)}
        onClearAll={handleClearAllClick}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
        champions={champions}
        onImport={handleImport}
      />
      
      <ChampionsGridDisplay
        champions={filteredChampions}
        columns={columns}
        onChecklistChange={handleChecklistChange}
        effectsEnabled={effectsEnabled}
      />

      <ConfirmationModal
        isOpen={showClearModal}
        title="Clear All Selections"
        message="Are you sure you want to clear all champion selections? This action cannot be undone and will reset all champion progress data."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={handleClearConfirm}
        onCancel={handleClearCancel}
      />
    </section>
  );
};

export default ChampionsGrid;
