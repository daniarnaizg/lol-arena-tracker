"use client"
import React from 'react';
import { motion } from 'framer-motion';

export type FilterType = 'all' | 'played' | 'top4' | 'win' | 'unplayed';

interface FilterButtonsProps {
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  effectsEnabled?: boolean;
  className?: string;
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

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  activeFilters = DEFAULT_FILTERS,
  onFilterChange,
  effectsEnabled = true,
  className = ''
}) => {
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

  const renderButton = (option: FilterOption) => {
    const isActive = isFilterActive(option.key);
    const buttonStyles = isActive ? option.activeStyles : option.inactiveStyles;
    const shadowStyles = isActive ? 'shadow-lg' : 'shadow-sm';

    return (
      <button
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
          ${buttonStyles} ${shadowStyles}
        `}
        onClick={() => handleFilterClick(option.key)}
        type="button"
        aria-pressed={isActive}
      >
        {option.label}
      </button>
    );
  };

  const renderFilterButton = (option: FilterOption) => {
    const buttonElement = renderButton(option);

    if (!effectsEnabled) {
      return (
        <div key={option.key}>
          {buttonElement}
        </div>
      );
    }

    return (
      <motion.div
        key={option.key}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {buttonElement}
      </motion.div>
    );
  };

  return (
    <div className={`flex gap-2 ${className}`} role="group" aria-label="Filter options">
      {FILTER_OPTIONS.map(renderFilterButton)}
    </div>
  );
};
