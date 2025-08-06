"use client"
import React from 'react';
import { ColumnSlider } from './ui/ColumnSlider';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { ClearAllButton } from './ui/ClearAllButton';
import { FilterButtons, FilterType } from './ui/FilterButtons';
import { ImportExportButtons } from './ui/ImportExportButtons';
import { Champion } from '@/services/ddragon';

interface ControlPanelProps {
  // Column controls
  columns: number;
  minColumns: number;
  maxColumns: number;
  onColumnsChange: (columns: number) => void;
  
  // Effects toggle
  effectsEnabled: boolean;
  onEffectsToggle: () => void;
  
  // Clear all functionality
  onClearAll: () => void;
  
  // Filter controls
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  
  // Import/Export functionality
  champions: Champion[];
  onImport: (champions: Champion[]) => void;
  
  className?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  effectsEnabled,
  onEffectsToggle,
  onClearAll,
  activeFilters,
  onFilterChange,
  champions,
  onImport,
  className = ''
}) => {
  return (
    <div className={`flex flex-col xl:flex-row gap-4 mb-8 items-center justify-between ${className}`}>
      {/* Left section: Column slider and basic controls */}
      <div className="flex items-center gap-4 w-full max-w-md">
        <ColumnSlider
          columns={columns}
          minColumns={minColumns}
          maxColumns={maxColumns}
          onColumnsChange={onColumnsChange}
        />
        
        <div className="flex gap-6 ml-4">
          <ToggleSwitch
            enabled={effectsEnabled}
            onToggle={onEffectsToggle}
            tooltip="Toggle animations and effects"
          />
          
          <ClearAllButton
            onClick={onClearAll}
          />
        </div>
      </div>
      
      {/* Center section: Import/Export buttons */}
      <div className="flex items-center">
        <ImportExportButtons
          champions={champions}
          onImport={onImport}
          effectsEnabled={effectsEnabled}
          className="mt-2 xl:mt-0"
        />
      </div>
      
      {/* Right section: Filter buttons */}
      <FilterButtons
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        effectsEnabled={effectsEnabled}
        className="mt-2 xl:mt-0"
      />
    </div>
  );
};
