"use client"
import React from 'react';
import { SortingOptions, SortType } from './SortingOptions';
import { ColumnSlider } from './ColumnSlider';
import { ChampionCounter } from './ChampionCounter';
import { EffectsToggle } from './EffectsToggle';

interface SecondaryControlsProps {
  // Sorting
  sortBy: SortType;
  onSortChange: (sortType: SortType) => void;
  
  // Column controls
  columns: number;
  minColumns: number;
  maxColumns: number;
  onColumnsChange: (columns: number) => void;
  
  // Effects toggle
  effectsEnabled: boolean;
  onEffectsToggle: () => void;
  
  // Counter
  totalChampions: number;
  filteredChampions: number;
  
  className?: string;
}

export const SecondaryControls: React.FC<SecondaryControlsProps> = ({
  sortBy,
  onSortChange,
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  effectsEnabled,
  onEffectsToggle,
  totalChampions,
  filteredChampions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between ${className}`}>
      {/* Left section: Sorting options, column slider, and effects toggle */}
      <div className="flex items-center gap-4">
        <SortingOptions
          sortBy={sortBy}
          onSortChange={onSortChange}
          effectsEnabled={effectsEnabled}
        />
        
        <ColumnSlider
          columns={columns}
          minColumns={minColumns}
          maxColumns={maxColumns}
          onColumnsChange={onColumnsChange}
        />
        
        <EffectsToggle
          enabled={effectsEnabled}
          onToggle={onEffectsToggle}
          effectsEnabled={effectsEnabled}
        />
      </div>
      
      {/* Right section: Champion counter */}
      <ChampionCounter
        totalChampions={totalChampions}
        filteredChampions={filteredChampions}
        effectsEnabled={effectsEnabled}
      />
    </div>
  );
};
