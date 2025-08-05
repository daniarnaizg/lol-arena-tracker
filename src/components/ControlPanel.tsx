"use client"
import React from 'react';
import { ColumnSlider } from './ui/ColumnSlider';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { ClearAllButton } from './ui/ClearAllButton';
import { RefreshButton } from './ui/RefreshButton';
import { FilterButtons, FilterType } from './ui/FilterButtons';

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
  isClearing: boolean;
  clearProgress: number;
  onClearStart: () => void;
  onClearStop: () => void;
  
  // Refresh functionality
  isRefreshing?: boolean;
  onRefresh?: () => void;
  
  // Filter controls
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  
  className?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  effectsEnabled,
  onEffectsToggle,
  isClearing,
  clearProgress,
  onClearStart,
  onClearStop,
  isRefreshing = false,
  onRefresh,
  currentFilter,
  onFilterChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between ${className}`}>
      {/* Left section: Column slider and controls */}
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
          
          {onRefresh && (
            <RefreshButton
              isRefreshing={isRefreshing}
              onRefresh={onRefresh}
            />
          )}
          
          <ClearAllButton
            isClearing={isClearing}
            progress={clearProgress}
            onStart={onClearStart}
            onStop={onClearStop}
          />
        </div>
      </div>
      
      {/* Right section: Filter buttons */}
      <FilterButtons
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        effectsEnabled={effectsEnabled}
        className="mt-2 sm:mt-0"
      />
    </div>
  );
};
