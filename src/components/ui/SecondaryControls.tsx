"use client"
import React from 'react';
import { SortingOptions, SortType } from './SortingOptions';
import { ColumnSlider } from './ColumnSlider';
import { ChampionCounter } from './ChampionCounter';

interface SecondaryControlsProps {
  // Sorting
  sortBy: SortType;
  onSortChange: (sortType: SortType) => void;
  
  // Column controls
  columns: number;
  minColumns: number;
  maxColumns: number;
  onColumnsChange: (columns: number) => void;
  
  // Counter
  totalChampions: number;
  filteredChampions: number;
  
  // Effects
  effectsEnabled?: boolean;
  className?: string;
}

export const SecondaryControls: React.FC<SecondaryControlsProps> = ({
  sortBy,
  onSortChange,
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  totalChampions,
  filteredChampions,
  effectsEnabled = true,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between ${className}`}>
      {/* Left section: Sorting options and column slider */}
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
