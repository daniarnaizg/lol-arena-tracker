"use client"
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChampionCard } from './ChampionCard';
import { ChampionChecklist } from './ui/CheckboxButton';
import { Champion } from '@/services/ddragon';

interface ChampionsGridDisplayProps {
  champions: Champion[];
  columns: number;
  onChecklistChange: (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => void;
  effectsEnabled?: boolean;
  className?: string;
}

const getGridColumnsClass = (columns: number) => {
  const safeColumns = Math.min(Math.max(columns, 1), 12);
  
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12'
  } as const;
  
  return columnClasses[safeColumns as keyof typeof columnClasses] || 'grid-cols-4';
};

export const ChampionsGridDisplay: React.FC<ChampionsGridDisplayProps> = ({
  champions,
  columns,
  onChecklistChange,
  effectsEnabled = true,
  className = ''
}) => {
  const gridColumnsClass = getGridColumnsClass(columns);

  return (
    <main 
      className={`grid gap-6 ${gridColumnsClass} ${className}`}
    >
      <AnimatePresence>
        {champions.map(champion => (
          <ChampionCard
            key={champion.id}
            champion={champion}
            onChecklistChange={onChecklistChange}
            effectsEnabled={effectsEnabled}
          />
        ))}
      </AnimatePresence>
    </main>
  );
};
