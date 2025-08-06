"use client"
import React from 'react';
import { MotionWrapper } from './shared';
import { BaseUIProps } from './shared/types';
import { MOTION_CONFIGS } from './shared/constants';
import { combineClasses } from './shared/utils';

export type FilterType = 'all' | 'played' | 'top4' | 'win' | 'unplayed';

interface FilterButtonsProps extends BaseUIProps {
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
}

interface FilterOption {
  key: FilterType;
  label: string;
  inactiveStyles: string;
  activeStyles: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { 
    key: 'all', 
    label: 'All', 
    inactiveStyles: 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600',
    activeStyles: 'bg-blue-600 text-white border-blue-500'
  },
  { 
    key: 'played', 
    label: 'Played ✔️', 
    inactiveStyles: 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600',
    activeStyles: 'bg-orange-600 text-white border-orange-500'
  },
  { 
    key: 'top4', 
    label: 'Top 4 🏅', 
    inactiveStyles: 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600',
    activeStyles: 'bg-purple-600 text-white border-purple-500'
  },
  { 
    key: 'win', 
    label: 'Win 🏆', 
    inactiveStyles: 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600',
    activeStyles: 'bg-yellow-600 text-white border-yellow-500'
  },
  { 
    key: 'unplayed', 
    label: 'Unplayed', 
    inactiveStyles: 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600',
    activeStyles: 'bg-red-600 text-white border-red-500'
  },
];

const DEFAULT_FILTERS: FilterType[] = ['all'];

const BASE_BUTTON_CLASSES = 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border';

/**
 * Custom hook to manage filter logic
 */
const useFilterLogic = (
  activeFilters: FilterType[],
  onFilterChange: (filters: FilterType[]) => void
) => {
  const safeActiveFilters = activeFilters || DEFAULT_FILTERS;

  const isAllSelected = () => safeActiveFilters.includes('all');
  const isFilterActive = (filterKey: FilterType) => safeActiveFilters.includes(filterKey);

  const handleAllFilterClick = () => {
    onFilterChange(['all']);
  };

  const handleSpecificFilterClick = (filterKey: FilterType) => {
    if (isAllSelected()) {
      // Replace "All" with the specific filter
      onFilterChange([filterKey]);
      return;
    }

    const isCurrentlyActive = isFilterActive(filterKey);
    
    if (isCurrentlyActive) {
      // Remove the filter
      const updatedFilters = safeActiveFilters.filter(f => f !== filterKey);
      // Fallback to "All" if no filters remain
      onFilterChange(updatedFilters.length === 0 ? ['all'] : updatedFilters);
    } else {
      // Add the filter
      onFilterChange([...safeActiveFilters, filterKey]);
    }
  };

  const handleFilterClick = (filterKey: FilterType) => {
    if (filterKey === 'all') {
      handleAllFilterClick();
    } else {
      handleSpecificFilterClick(filterKey);
    }
  };

  return {
    isFilterActive,
    handleFilterClick
  };
};

/**
 * Individual filter button component
 */
interface FilterButtonProps {
  option: FilterOption;
  isActive: boolean;
  onClick: () => void;
  effectsEnabled: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  option,
  isActive,
  onClick,
  effectsEnabled
}) => {
  const buttonStyles = isActive ? option.activeStyles : option.inactiveStyles;
  const shadowStyles = isActive ? 'shadow-lg' : 'shadow-sm';
  
  const buttonClasses = combineClasses(
    BASE_BUTTON_CLASSES,
    buttonStyles,
    shadowStyles
  );

  const button = (
    <button
      className={buttonClasses}
      onClick={onClick}
      type="button"
      {...(typeof isActive === 'boolean' && { 'aria-pressed': isActive })}
    >
      {option.label}
    </button>
  );

  return (
    <MotionWrapper
      effectsEnabled={effectsEnabled}
      config={MOTION_CONFIGS.filter}
    >
      {button}
    </MotionWrapper>
  );
};

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  activeFilters = DEFAULT_FILTERS,
  onFilterChange,
  effectsEnabled = true,
  className = ''
}) => {
  const { isFilterActive, handleFilterClick } = useFilterLogic(activeFilters, onFilterChange);

  return (
    <div className={combineClasses('flex gap-2', className)} role="group" aria-label="Filter options">
      {FILTER_OPTIONS.map((option) => (
        <FilterButton
          key={option.key}
          option={option}
          isActive={isFilterActive(option.key)}
          onClick={() => handleFilterClick(option.key)}
          effectsEnabled={effectsEnabled}
        />
      ))}
    </div>
  );
};
