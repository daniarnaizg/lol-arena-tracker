"use client"
import React from 'react';
import { motion } from 'framer-motion';

export interface ChampionChecklist {
  played: boolean;
  top4: boolean;
  win: boolean;
}

interface CheckboxButtonProps {
  type: keyof ChampionChecklist;
  isChecked: boolean;
  onClick: () => void;
  championName: string;
  effectsEnabled?: boolean;
}

const checkboxConfig = {
  played: { emoji: '✔️', label: 'Played' },
  top4: { emoji: '🏅', label: 'Top 4' },
  win: { emoji: '🏆', label: 'Win' },
} as const;

const getButtonStyles = (type: keyof ChampionChecklist, isChecked: boolean) => {
  const baseClasses = `
    w-7 h-7 rounded-full flex items-center justify-center text-xs
    transition-all duration-200 cursor-pointer border hover:scale-105
  `;

  if (isChecked) {
    switch (type) {
      case 'played':
        return `${baseClasses} bg-gradient-to-br from-amber-600 to-amber-500 text-white border-amber-700 shadow-lg shadow-amber-500/40`;
      case 'top4':
        return `${baseClasses} bg-gradient-to-br from-gray-500 to-gray-400 text-white border-gray-600 shadow-lg shadow-gray-500/40`;
      case 'win':
        return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-300 text-gray-800 border-yellow-500 shadow-md shadow-yellow-500/30`;
      default:
        return baseClasses;
    }
  } else {
    switch (type) {
      case 'played':
        return `${baseClasses} bg-amber-50/15 border-amber-200/30 hover:bg-amber-100/25 text-amber-600`;
      case 'top4':
        return `${baseClasses} bg-gray-50/15 border-gray-200/30 hover:bg-gray-100/25 text-gray-600`;
      case 'win':
        return `${baseClasses} bg-yellow-50/15 border-yellow-200/30 hover:bg-yellow-100/25 text-yellow-600`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 hover:bg-gray-100`;
    }
  }
};

export const CheckboxButton: React.FC<CheckboxButtonProps> = ({
  type,
  isChecked,
  onClick,
  championName,
  effectsEnabled = true
}) => {
  const config = checkboxConfig[type];
  const buttonClass = getButtonStyles(type, isChecked);
  
  const buttonContent = (
    <button
      onClick={onClick}
      className={buttonClass}
      title={`${config.label} for ${championName}`}
      aria-label={`${config.label} for ${championName}`}
    >
      {isChecked ? config.emoji : ''}
    </button>
  );

  if (!effectsEnabled) {
    return buttonContent;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={isChecked ? { rotate: [0, 10, -10, 0] } : undefined}
      transition={{ duration: 0.3 }}
    >
      {buttonContent}
    </motion.div>
  );
};
