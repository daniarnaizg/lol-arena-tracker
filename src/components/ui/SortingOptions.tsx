"use client"
import React from 'react';
import { BaseButton } from './shared';
import { BaseUIProps } from './shared/types';

export type SortType = 'alphabetical' | 'status';

interface SortingOptionsProps extends BaseUIProps {
  sortBy: SortType;
  onSortChange: (sortType: SortType) => void;
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

const SortIcon: React.FC = () => (
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
);

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

  return (
    <BaseButton
      variant="secondary"
      onClick={toggleSort}
      title={currentOption?.description}
      className={`flex items-center gap-2 whitespace-nowrap ${className}`}
      effectsEnabled={effectsEnabled}
    >
      <SortIcon />
      <span>{buttonText}</span>
    </BaseButton>
  );
};
