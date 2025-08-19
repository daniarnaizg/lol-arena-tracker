"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { createChampionImageUrl, createImageErrorHandler } from '@/utils/imageUtils';

interface ArenaMatchCardProps {
  championName: string;
  placement: number;
  matchDate: string;
  index: number;
  className?: string;
  onChampionSearch?: (championName: string) => void;
}

interface PlacementStyle {
  badge: string;
  border: string;
}

const getPlacementStyle = (placement: number): PlacementStyle => {
  if (placement === 1) {
    return {
      badge: 'bg-yellow-400 text-yellow-900',
      border: 'border-yellow-400'
    };
  }
  
  if (placement <= 3) {
    return {
      badge: 'bg-gray-300 text-gray-800',
      border: 'border-gray-300'
    };
  }
  
  return {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-gray-100'
  };
};

export const ArenaMatchCard: React.FC<ArenaMatchCardProps> = ({
  championName,
  placement,
  matchDate,
  index,
  className = '',
  onChampionSearch
}) => {
  const placementStyle = getPlacementStyle(placement);
  const cardTitle = `#${placement} - ${championName} - ${matchDate}`;

  // Get the champion image URL using the latest version
  const championImageUrl = createChampionImageUrl(championName);
  const handleImageError = createImageErrorHandler(championName);

  const handleClick = () => {
    if (onChampionSearch) {
      onChampionSearch(championName);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex-shrink-0 relative group p-2 md:p-1 ${className} ${onChampionSearch ? 'cursor-pointer' : ''}`}
      title={onChampionSearch ? `Click to search for ${championName}` : cardTitle}
      onClick={handleClick}
    >
      {/* Champion Image Container */}
      <div className={`w-16 h-16 rounded-lg overflow-hidden border-2 relative transition-transform duration-200 ${placementStyle.border} ${onChampionSearch ? 'group-hover:scale-110' : ''}`}>
        {championImageUrl ? (
          <Image
            src={championImageUrl}
            alt={championName}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            onError={handleImageError}
            unoptimized
          />
        ) : null}
      </div>
      
      {/* Placement Badge - positioned outside the image in top-right corner */}
      <div className={`
        absolute -top-0 -right-0 w-6 h-6 rounded-full text-xs font-bold
        flex items-center justify-center border-2 border-white shadow-lg
        ${placementStyle.badge}
      `}>
        {placement}
      </div>
      
      {/* Tooltip on hover */}
  <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {onChampionSearch ? `Click to search for ${championName}` : cardTitle}
      </div>
    </motion.div>
  );
};
