"use client"
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckboxButton, ChampionChecklist } from './ui/CheckboxButton';

export interface Champion {
  id: number;
  name: string;
  imageKey: string;
  checklist: ChampionChecklist;
}

interface ChampionCardProps {
  champion: Champion;
  onChecklistChange: (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => void;
  effectsEnabled?: boolean;
}

const getCardStyles = (checklist: ChampionChecklist) => {
  const baseClasses = `
    flex flex-col items-center gap-3 p-4 rounded-xl bg-white transition-all duration-200
    shadow-sm hover:shadow-md
  `;

  if (checklist.win) {
    return `${baseClasses} bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-400 
            border-2 border-yellow-500 shadow-xl shadow-yellow-500/30 text-gray-800`;
  } else if (checklist.top4) {
    return `${baseClasses} bg-gradient-to-br from-gray-400 via-gray-300 to-gray-400 
            border-2 border-gray-500 shadow-lg shadow-gray-500/30 text-white`;
  } else if (checklist.played) {
    return `${baseClasses} bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 
            border-2 border-amber-700 shadow-lg shadow-amber-500/30 text-white`;
  }

  return baseClasses;
};

const getNameStyles = (checklist: ChampionChecklist) => {
  const baseClasses = 'font-semibold text-sm leading-tight text-center transition-all duration-200';
  
  if (checklist.win || checklist.top4) {
    return `${baseClasses} text-gray-800 drop-shadow-sm`;
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
  const imgUrl = champion.imageKey
    ? `https://ddragon.leagueoflegends.com/cdn/15.14.1/img/champion/${champion.imageKey}.png`
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
