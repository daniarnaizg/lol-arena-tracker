"use client"
import React from 'react';
import { SortingOptions, SortType } from './SortingOptions';
import { ColumnSlider } from './ColumnSlider';
import { ChampionCounter } from './ChampionCounter';
import { EffectsToggle } from './EffectsToggle';
import { BaseUIProps } from './shared/types';
import { combineClasses, LAYOUT_CLASSES } from './shared';

interface SecondaryControlsProps extends BaseUIProps {
  // Sorting
  sortBy: SortType;
  onSortChange: (sortType: SortType) => void;
  
  // Column controls
  columns: number;
  minColumns: number;
  maxColumns: number;
  onColumnsChange: (columns: number) => void;
  
  // Effects toggle
  onEffectsToggle: () => void;
  
  // Counter
  totalChampions: number;
  filteredChampions: number;
}

export const SecondaryControls: React.FC<SecondaryControlsProps> = ({
  sortBy,
  onSortChange,
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  effectsEnabled = true,
  onEffectsToggle,
  totalChampions,
  filteredChampions,
  className = ''
}) => {
  const containerClasses = combineClasses(
    'flex flex-col sm:flex-row mb-6 items-center justify-between',
    LAYOUT_CLASSES.gap.md,
    className
  );

  const leftSectionClasses = combineClasses(
    LAYOUT_CLASSES.flexRow,
    'items-center',
    LAYOUT_CLASSES.gap.md
  );

  return (
    <div className={containerClasses}>
      {/* Left section: Sorting options, column slider, and effects toggle */}
      <div className={leftSectionClasses}>
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
