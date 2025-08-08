"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { BaseUIProps } from './shared/types';
import { combineClasses } from './shared/utils';

interface ChampionCounterProps extends BaseUIProps {
  totalChampions: number;
  filteredChampions: number;
}

export const ChampionCounter: React.FC<ChampionCounterProps> = ({
  totalChampions,
  filteredChampions,
  effectsEnabled = true,
  className = ''
}) => {
  const counterClasses = combineClasses(
    'flex items-center gap-1.5 md:gap-2 text-sm',
    className
  );

  const counterElement = (
    <div className={counterClasses}>
      <span className="text-gray-400 font-medium">Showing</span>
  <span className="text-white font-bold text-base md:text-lg">
        {filteredChampions}
      </span>
      <span className="text-gray-400">
        / {totalChampions} champions
      </span>
    </div>
  );

  if (!effectsEnabled) {
    return counterElement;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      key={filteredChampions}
    >
      {counterElement}
    </motion.div>
  );
};
