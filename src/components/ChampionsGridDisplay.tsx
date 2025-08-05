"use client"
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChampionCard } from './ChampionCard';
import { ChampionChecklist } from './ui/CheckboxButton';
import { Champion } from '@/services/ddragon';
import styles from './ChampionsGridDisplay.module.css';

interface ChampionsGridDisplayProps {
  champions: Champion[];
  columns: number;
  onChecklistChange: (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => void;
  effectsEnabled?: boolean;
  className?: string;
}

export const ChampionsGridDisplay: React.FC<ChampionsGridDisplayProps> = ({
  champions,
  columns,
  onChecklistChange,
  effectsEnabled = true,
  className = ''
}) => {
  const safeColumns = Math.min(Math.max(columns, 1), 12);
  const columnClass = `cols${safeColumns}` as keyof typeof styles;

  return (
    <main 
      className={`${styles.gridContainer} ${styles[columnClass] || ''} ${className}`}
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
