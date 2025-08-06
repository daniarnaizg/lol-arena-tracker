"use client"
import React from 'react';
import { motion } from 'framer-motion';

interface ChampionCounterProps {
  totalChampions: number;
  filteredChampions: number;
  effectsEnabled?: boolean;
  className?: string;
}

export const ChampionCounter: React.FC<ChampionCounterProps> = ({
  totalChampions,
  filteredChampions,
  effectsEnabled = true,
  className = ''
}) => {
  const counterElement = (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-gray-400 font-medium">Showing</span>
      <span className="text-white font-bold text-lg">
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
