"use client"
import React from 'react';
import { FilterButtons, FilterType } from './ui/FilterButtons';
import { ImportExportButtons } from './ui/ImportExportButtons';
import { Champion } from '@/services/ddragon';

interface ControlPanelProps {
  // Clear all functionality
  onClearAll: () => void;
  
  // Filter controls
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  
  // Import/Export functionality
  champions: Champion[];
  onImport: (champions: Champion[]) => void;
  
  // Effects for child components
  effectsEnabled: boolean;
  
  className?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  effectsEnabled,
  onClearAll,
  activeFilters,
  onFilterChange,
  champions,
  onImport,
  className = ''
}) => {
  return (
    <div className={`flex flex-col xl:flex-row gap-4 mb-8 items-center justify-between ${className}`}>
      {/* Left section: Import/Export and Clear All buttons */}
      <div className="flex items-center">
        <ImportExportButtons
          champions={champions}
          onImport={onImport}
          onClearAll={onClearAll}
          effectsEnabled={effectsEnabled}
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
