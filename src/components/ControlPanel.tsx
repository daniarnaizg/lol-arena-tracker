"use client"
import React from 'react';
import { FilterButtons, FilterType } from './ui/FilterButtons';
import { ImportExportButtons } from './ui/ImportExportButtons';
import { Champion } from '@/services/ddragon';
import { BaseUIProps } from './ui/shared/types';
import { combineClasses, LAYOUT_CLASSES } from './ui/shared';

interface ControlPanelProps extends BaseUIProps {
  // Clear all functionality
  onClearAll: () => void;
  
  // Filter controls
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  
  // Import/Export functionality
  champions: Champion[];
  onImport: (champions: Champion[]) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  effectsEnabled = true,
  onClearAll,
  activeFilters,
  onFilterChange,
  champions,
  onImport,
  className = ''
}) => {
  const containerClasses = combineClasses(
    'flex flex-col xl:flex-row mb-8 items-center justify-between',
    LAYOUT_CLASSES.gap.md,
    className
  );

  const leftSectionClasses = combineClasses(
    LAYOUT_CLASSES.flexRow,
    'items-center'
  );

  const rightSectionClasses = combineClasses(
    'mt-2 xl:mt-0'
  );

  return (
    <div className={containerClasses}>
      {/* Left section: Import/Export and Clear All buttons */}
      <div className={leftSectionClasses}>
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
        className={rightSectionClasses}
      />
    </div>
  );
};
