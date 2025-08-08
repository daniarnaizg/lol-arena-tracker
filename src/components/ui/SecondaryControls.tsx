"use client"
import React from 'react';
import { SortingOptions, SortType } from './SortingOptions';
import { ColumnSlider } from './ColumnSlider';
import { ChampionCounter } from './ChampionCounter';
import { BaseUIProps } from './shared/types';
import { combineClasses } from './shared';

interface SecondaryControlsProps extends BaseUIProps {
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
}

export const SecondaryControls: React.FC<SecondaryControlsProps> = ({
  sortBy,
  onSortChange,
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  effectsEnabled = true,
  totalChampions,
  filteredChampions,
  className = ''
}) => {
  // Mobile: single-row toolbar with horizontal scroll; Desktop: spaced layout
  const containerClasses = combineClasses(
    'flex items-center gap-2 md:gap-0 mb-4 md:mb-6 overflow-x-auto md:overflow-visible whitespace-nowrap',
    className
  );

  return (
    <div className={containerClasses}>
      {/* Sorting toggle */}
      <div className="shrink-0">
        <SortingOptions
          sortBy={sortBy}
          onSortChange={onSortChange}
          effectsEnabled={effectsEnabled}
        />
      </div>

      {/* Column selector */}
      <div className="shrink-0">
        <ColumnSlider
          columns={columns}
          minColumns={minColumns}
          maxColumns={maxColumns}
          onColumnsChange={onColumnsChange}
        />
      </div>

      {/* Counter aligned to the end on wider screens; stays inline on mobile */}
      <div className="shrink-0 ml-auto">
        <ChampionCounter
          totalChampions={totalChampions}
          filteredChampions={filteredChampions}
          effectsEnabled={effectsEnabled}
        />
      </div>
    </div>
  );
};
