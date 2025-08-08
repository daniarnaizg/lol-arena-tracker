"use client"
import React from 'react';
import { FilterButtons, FilterType } from './ui/FilterButtons';
import { ImportExportButtons } from './ui/ImportExportButtons';
import { EffectsToggle } from './ui/EffectsToggle';
import { SortingOptions, SortType } from './ui/SortingOptions';
import { ColumnSlider } from './ui/ColumnSlider';
import { ChampionCounter } from './ui/ChampionCounter';
import { Champion } from '@/services/ddragon';
import { BaseUIProps } from './ui/shared/types';
import { combineClasses } from './ui/shared';

interface ControlPanelProps extends BaseUIProps {
  // Clear all functionality
  onClearAll: () => void;
  
  // Filter controls
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  
  // Import/Export functionality
  champions: Champion[];
  onImport: (champions: Champion[]) => void;

  // Effects toggle
  onEffectsToggle: () => void;
  effectsEnabled: boolean;

  // Sorting / Columns
  sortBy: SortType;
  onSortChange: (sortType: SortType) => void;
  columns: number;
  minColumns: number;
  maxColumns: number;
  onColumnsChange: (columns: number) => void;

  // Counter
  totalChampions: number;
  filteredChampions: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  effectsEnabled = true,
  onClearAll,
  activeFilters,
  onFilterChange,
  champions,
  onImport,
  onEffectsToggle,
  sortBy,
  onSortChange,
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  totalChampions,
  filteredChampions,
  className = ''
}) => {
  const containerClasses = combineClasses(
    'w-full flex flex-col gap-3 md:gap-4 mb-6',
    className
  );

  return (
    <div className={containerClasses}>
      {/* Row 1 (mobile only): Data actions + Effects toggle */}
      <div className="flex px-2 items-center justify-between gap-2 w-full md:hidden">
        <ImportExportButtons
          champions={champions}
          onImport={onImport}
          onClearAll={onClearAll}
          effectsEnabled={effectsEnabled}
        />
        {/* Mobile shows Effects here; on md+ it moves to row 3 */}
        <div className="md:hidden">
          <EffectsToggle
            enabled={effectsEnabled}
            onToggle={onEffectsToggle}
            effectsEnabled={effectsEnabled}
          />
        </div>
      </div>

      {/* Row 2 (mobile only): Filters single line, horizontally scrollable */}
      <div className="w-full md:hidden">
        <FilterButtons
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          effectsEnabled={effectsEnabled}
          className="w-full"
        />
      </div>

      {/* Row 2 (desktop/tablet): Data actions left, Filters right */}
      <div className="hidden md:flex items-center justify-between w-full">
        <ImportExportButtons
          champions={champions}
          onImport={onImport}
          onClearAll={onClearAll}
          effectsEnabled={effectsEnabled}
        />
        <FilterButtons
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          effectsEnabled={effectsEnabled}
        />
      </div>

      {/* Row 3: Sorting + Columns (+ Effects on md+) + Counter */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto md:overflow-visible whitespace-nowrap">
        <SortingOptions
          sortBy={sortBy}
          onSortChange={onSortChange}
          effectsEnabled={effectsEnabled}
        />
        <div className="hidden md:block">
          <ColumnSlider
            columns={columns}
            minColumns={minColumns}
            maxColumns={maxColumns}
            onColumnsChange={onColumnsChange}
          />
        </div>
        <div className="hidden md:block">
          <EffectsToggle
            enabled={effectsEnabled}
            onToggle={onEffectsToggle}
            effectsEnabled={effectsEnabled}
          />
        </div>
        <div className="ml-auto">
          <ChampionCounter
            totalChampions={totalChampions}
            filteredChampions={filteredChampions}
            effectsEnabled={effectsEnabled}
          />
        </div>
      </div>
    </div>
  );
};
