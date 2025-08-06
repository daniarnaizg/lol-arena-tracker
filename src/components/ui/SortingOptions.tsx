"use client"
import React from 'react';
import { motion } from 'framer-motion';

export type SortType = 'alphabetical' | 'status';

interface SortingOptionsProps {
  sortBy: SortType;
  onSortChange: (sortType: SortType) => void;
  effectsEnabled?: boolean;
  className?: string;
}

interface SortOption {
  key: SortType;
  label: string;
  description: string;
}

const SORT_OPTIONS: SortOption[] = [
  { 
    key: 'alphabetical', 
    label: 'A-Z', 
    description: 'Sort alphabetically'
  },
  { 
    key: 'status', 
    label: 'Status', 
    description: 'Sort by progress (Win → Top 4 → Played → Unplayed)'
  },
];

export const SortingOptions: React.FC<SortingOptionsProps> = ({
  sortBy,
  onSortChange,
  effectsEnabled = true,
  className = ''
}) => {
  const toggleSort = () => {
    const newSortType = sortBy === 'alphabetical' ? 'status' : 'alphabetical';
    onSortChange(newSortType);
  };

  const currentOption = SORT_OPTIONS.find(option => option.key === sortBy);
  const buttonText = currentOption?.label || 'A-Z';

  const renderButton = () => {
    return (
      <button
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                   bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600 shadow-sm
                   hover:shadow-md flex items-center gap-2"
        onClick={toggleSort}
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M7 12h10m-7 6h4" />
        </svg>
        <span>{buttonText}</span>
      </button>
    );
  };

  if (!effectsEnabled) {
    return (
      <div className={className}>
        {renderButton()}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {renderButton()}
    </motion.div>
  );
};
