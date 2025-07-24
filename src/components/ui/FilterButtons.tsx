"use client"
import React from 'react';
import { motion } from 'framer-motion';

export type FilterType = 'all' | 'played' | 'top4' | 'win' | 'unplayed';

interface FilterButtonsProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  effectsEnabled?: boolean;
  className?: string;
}

const filterOptions = [
  { key: 'all' as const, label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { key: 'played' as const, label: 'Played ✔️', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { key: 'top4' as const, label: 'Top 4 🏅', color: 'bg-gray-200 text-gray-800 hover:bg-gray-300' },
  { key: 'win' as const, label: 'Win 🏆', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { key: 'unplayed' as const, label: 'Unplayed', color: 'bg-gray-50 text-gray-500 hover:bg-gray-100' },
];

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  currentFilter,
  onFilterChange,
  effectsEnabled = true,
  className = ''
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {filterOptions.map(({ key, label, color }) => {
        const isActive = currentFilter === key;
        const activeColor = color.replace('hover:', '').replace('100', '200').replace('50', '100');
        
        const buttonContent = (
          <button
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all border border-gray-200
              ${isActive ? activeColor : color}
            `}
            onClick={() => onFilterChange(key)}
          >
            {label}
          </button>
        );

        if (!effectsEnabled) {
          return (
            <div key={key}>
              {buttonContent}
            </div>
          );
        }

        return (
          <motion.div
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {buttonContent}
          </motion.div>
        );
      })}
    </div>
  );
};
