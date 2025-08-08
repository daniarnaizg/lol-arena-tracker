"use client"
import React, { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckboxButton, ChampionChecklist } from './ui/CheckboxButton';
import { Champion } from '@/services/ddragon';
import { championService } from '@/services/championService';
import { createChampionImageUrl, createImageErrorHandler } from '@/utils/imageUtils';

interface ChampionCardProps {
  champion: Champion;
  onChecklistChange: (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => void;
  effectsEnabled?: boolean;
}

// Card styling configuration
const CARD_STYLES = {
  base: [
  'flex', 'flex-col', 'items-center', 'gap-2', 'md:gap-3', 'p-2', 'md:p-4', 'rounded-xl', 
    'bg-white', 'transition-all', 'duration-200', 'shadow-sm',
    'hover:shadow-md', 'hover:-translate-y-1', 'hover:scale-[1.02]'
  ],
  states: {
    win: {
      background: ['bg-gradient-to-br', 'from-yellow-400', 'via-yellow-300', 'to-yellow-400'],
      border: ['border-2', 'border-yellow-500'],
      shadow: ['shadow-lg', 'shadow-yellow-500/25', 'hover:shadow-xl', 'hover:shadow-yellow-500/35'],
      text: ['text-gray-800']
    },
    top4: {
      background: ['bg-gradient-to-br', 'from-gray-500', 'via-gray-400', 'to-gray-500'],
      border: ['border-2', 'border-gray-600'],
      shadow: ['shadow-lg', 'shadow-gray-500/40', 'hover:shadow-xl', 'hover:shadow-gray-500/50'],
      text: ['text-white']
    },
    played: {
      background: ['bg-gradient-to-br', 'from-amber-600', 'via-amber-500', 'to-amber-600'],
      border: ['border-2', 'border-amber-700'],
      shadow: ['shadow-lg', 'shadow-amber-500/40', 'hover:shadow-xl', 'hover:shadow-amber-500/50'],
      text: ['text-white']
    }
  }
};

const NAME_STYLES = {
  base: ['font-semibold', 'text-sm', 'leading-tight', 'text-center', 'transition-all', 'duration-200'],
  states: {
    win: ['text-gray-800', 'drop-shadow-sm'],
    top4: ['text-white', 'drop-shadow-md'],
    played: ['text-white', 'drop-shadow-md'],
    default: ['text-gray-800']
  }
};

const getCardStyleClasses = (checklist: ChampionChecklist): string => {
  const { base, states } = CARD_STYLES;
  
  if (checklist.win) {
    return [...base, ...states.win.background, ...states.win.border, ...states.win.shadow, ...states.win.text].join(' ');
  }
  
  if (checklist.top4) {
    return [...base, ...states.top4.background, ...states.top4.border, ...states.top4.shadow, ...states.top4.text].join(' ');
  }
  
  if (checklist.played) {
    return [...base, ...states.played.background, ...states.played.border, ...states.played.shadow, ...states.played.text].join(' ');
  }
  
  return base.join(' ');
};

const getNameStyleClasses = (checklist: ChampionChecklist): string => {
  const { base, states } = NAME_STYLES;
  
  if (checklist.win) return [...base, ...states.win].join(' ');
  if (checklist.top4) return [...base, ...states.top4].join(' ');
  if (checklist.played) return [...base, ...states.played].join(' ');
  
  return [...base, ...states.default].join(' ');
};

export const ChampionCard: React.FC<ChampionCardProps> = ({
  champion,
  onChecklistChange,
  effectsEnabled = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const currentVersion = championService.getCurrentVersion();
  const imgUrl = champion.imageKey
    ? createChampionImageUrl(champion.imageKey, currentVersion || undefined)
    : '';
  
  const checklist = champion.checklist || { played: false, top4: false, win: false };
  const cardClass = getCardStyleClasses(checklist);
  const nameClass = getNameStyleClasses(checklist);

  const handleCheckboxClick = (key: keyof ChampionChecklist) => {
    onChecklistChange(champion.id, key, cardRef.current || undefined);
  };

  const handleImageError = createImageErrorHandler(champion.imageKey || champion.name);

  const cardContent = (
    <div
      ref={cardRef}
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
            onError={handleImageError}
          />
        )}
      </div>
      
      <div className="flex flex-col items-center gap-1.5 md:gap-2 w-full flex-1">
        <h3 className={nameClass}>
          {champion.name}
        </h3>
        
  <div className="mt-auto w-full flex justify-center md:justify-center px-1 md:px-0 gap-2 md:gap-3 flex-nowrap">
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
