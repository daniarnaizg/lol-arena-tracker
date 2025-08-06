"use client"
import React from 'react';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { ClearAllButton } from './ui/ClearAllButton';
import { FilterButtons, FilterType } from './ui/FilterButtons';
import { ImportExportButtons } from './ui/ImportExportButtons';
import { Champion } from '@/services/ddragon';

interface ControlPanelProps {
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
      {/* Left section: Basic controls */}
      <div className="flex items-center gap-6">
        <ToggleSwitch
          enabled={effectsEnabled}
          onToggle={onEffectsToggle}
          tooltip="Toggle animations and effects"
        />
        
        <ClearAllButton
          onClick={onClearAll}
        />
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
