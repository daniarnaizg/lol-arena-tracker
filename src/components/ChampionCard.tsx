"use client"
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckboxButton, ChampionChecklist } from './ui/CheckboxButton';
import { Champion, ddragonService } from '@/services/ddragon';
import { championService } from '@/services/championService';

interface ChampionCardProps {
  champion: Champion;
  onChecklistChange: (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => void;
  effectsEnabled?: boolean;
}

const getCardStyles = (checklist: ChampionChecklist) => {
  const baseClasses = `
    flex flex-col items-center gap-3 p-4 rounded-xl bg-white transition-all duration-200
    shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-[1.02]
  `;

  if (checklist.win) {
    return `${baseClasses} bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-400 
            border-2 border-yellow-500 shadow-lg shadow-yellow-500/25 text-gray-800
            hover:shadow-xl hover:shadow-yellow-500/35`;
  } else if (checklist.top4) {
    return `${baseClasses} bg-gradient-to-br from-gray-500 via-gray-400 to-gray-500 
            border-2 border-gray-600 shadow-lg shadow-gray-500/40 text-white
            hover:shadow-xl hover:shadow-gray-500/50`;
  } else if (checklist.played) {
    return `${baseClasses} bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 
            border-2 border-amber-700 shadow-lg shadow-amber-500/40 text-white
            hover:shadow-xl hover:shadow-amber-500/50`;
  }

  return baseClasses;
};

const getNameStyles = (checklist: ChampionChecklist) => {
  const baseClasses = 'font-semibold text-sm leading-tight text-center transition-all duration-200';
  
  if (checklist.win) {
    return `${baseClasses} text-gray-800 drop-shadow-sm`;
  } else if (checklist.top4) {
    return `${baseClasses} text-white drop-shadow-md`;
  } else if (checklist.played) {
    return `${baseClasses} text-white drop-shadow-md`;
  }
  
  return `${baseClasses} text-gray-800`;
};

export const ChampionCard: React.FC<ChampionCardProps> = ({
  champion,
  onChecklistChange,
  effectsEnabled = true
}) => {
  const currentVersion = championService.getCurrentVersion();
  const imgUrl = champion.imageKey
    ? ddragonService.getChampionImageUrlSync(champion.imageKey, currentVersion || undefined)
    : '';
  
  const checklist = champion.checklist || { played: false, top4: false, win: false };
  const cardClass = getCardStyles(checklist);
  const nameClass = getNameStyles(checklist);

  const handleCheckboxClick = (key: keyof ChampionChecklist) => {
    const cardElement = document.querySelector(`[data-champion-id="${champion.id}"]`) as HTMLElement;
    onChecklistChange(champion.id, key, cardElement);
  };

  const cardContent = (
    <div
      className={cardClass}
      data-champion-id={champion.id}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-lg group">
        {imgUrl && (
          <Image
            src={imgUrl}
            alt={champion.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
          />
        )}
      </div>
      
      <div className="flex flex-col items-center gap-2 w-full">
        <h3 className={nameClass}>
          {champion.name}
        </h3>
        
        <div className="flex justify-center gap-3">
          {(['played', 'top4', 'win'] as const).map((key) => (
            <CheckboxButton
              key={key}
              type={key}
              isChecked={checklist[key]}
              onClick={() => handleCheckboxClick(key)}
              championName={champion.name}
              effectsEnabled={effectsEnabled}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (!effectsEnabled) {
    return cardContent;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {cardContent}
    </motion.div>
  );
};
