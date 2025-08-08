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

// Configuration for checkbox types
type CheckedColors = {
  background: readonly string[];
  text: readonly string[];
  border: readonly string[];
  shadow: readonly string[];
};

type UncheckedColors = {
  background: readonly string[];
  border: readonly string[];
  hover: readonly string[];
  text: readonly string[];
  shadow: readonly string[];
};

const CHECKBOX_CONFIG = {
  played: { 
    emoji: '✔️', 
    label: 'Played',
    colors: {
      checked: {
        background: ['bg-gradient-to-br', 'from-amber-600', 'to-amber-500'],
        text: ['text-white'],
        border: ['border-amber-700'],
        shadow: ['shadow-lg', 'shadow-amber-500/40']
      } satisfies CheckedColors,
      unchecked: {
        background: ['bg-amber-50/50'],
        border: ['border-amber-200/50'],
        hover: ['hover:bg-amber-100/25'],
        text: ['text-amber-600'],
        shadow: ['shadow-inner', 'shadow-amber-400/50']
      } satisfies UncheckedColors
    }
  },
  top4: { 
    emoji: '🏅', 
    label: 'Top 4',
    colors: {
      checked: {
        background: ['bg-gradient-to-br', 'from-gray-500', 'to-gray-400'],
        text: ['text-white'],
        border: ['border-gray-600'],
        shadow: ['shadow-lg', 'shadow-gray-500/40']
      } satisfies CheckedColors,
      unchecked: {
        background: ['bg-gray-50/50'],
        border: ['border-gray-200/50'],
        hover: ['hover:bg-gray-100/25'],
        text: ['text-gray-600'],
        shadow: ['shadow-inner', 'shadow-gray-400/50']
      } satisfies UncheckedColors
    }
  },
  win: { 
    emoji: '🏆', 
    label: 'Win',
    colors: {
      checked: {
        background: ['bg-gradient-to-br', 'from-yellow-400', 'to-yellow-300'],
        text: ['text-gray-800'],
        border: ['border-yellow-500'],
        shadow: ['shadow-md', 'shadow-yellow-500/30']
      } satisfies CheckedColors,
      unchecked: {
        background: ['bg-yellow-50/50'],
        border: ['border-yellow-200/50'],
        hover: ['hover:bg-yellow-100/25'],
        text: ['text-yellow-600'],
        shadow: ['shadow-inner', 'shadow-yellow-500/50']
      } satisfies UncheckedColors
    }
  }
} as const;

const BASE_BUTTON_CLASSES = [
  'w-8', 'h-8', 'md:w-7', 'md:h-7', 'rounded-full', 'flex', 'items-center', 'justify-center', 
  'text-xs', 'transition-all', 'duration-200', 'cursor-pointer', 'border', 'hover:scale-105'
];

const getButtonStyleClasses = (type: keyof ChampionChecklist, isChecked: boolean): string => {
  const config = CHECKBOX_CONFIG[type];
  
  const classes = [...BASE_BUTTON_CLASSES];
  
  if (isChecked) {
    const colorConfig = config.colors.checked;
    classes.push(
      ...colorConfig.background,
      ...colorConfig.text,
      ...colorConfig.border,
      ...colorConfig.shadow
    );
  } else {
    const colorConfig = config.colors.unchecked;
    classes.push(
      ...colorConfig.background,
      ...colorConfig.border,
      ...colorConfig.hover,
      ...colorConfig.text,
      ...colorConfig.shadow
    );
  }
  
  return classes.join(' ');
};

export const CheckboxButton: React.FC<CheckboxButtonProps> = ({
  type,
  isChecked,
  onClick,
  championName,
  effectsEnabled = true
}) => {
  const config = CHECKBOX_CONFIG[type];
  const buttonClass = getButtonStyleClasses(type, isChecked);
  
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
