"use client"
import React, { useRef, useEffect } from 'react';
import { Champion } from '@/services/ddragon';

interface ProgressCounterProps {
  champions: Champion[];
}

export const ProgressCounter: React.FC<ProgressCounterProps> = ({ champions }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Calculate win statistics
  const totalChampions = champions.length;
  const winsCount = champions.filter(champion => 
    champion.checklist?.win === true
  ).length;
  const winPercentage = totalChampions > 0 ? Math.round((winsCount / totalChampions) * 100) : 0;

  // Update progress bar width
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${winPercentage}%`;
    }
  }, [winPercentage]);

  return (
    <section className="w-full px-4 md:px-6">
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-center">
        {/* Win Stats */}
        <div className="text-xl md:text-2xl font-black text-yellow-600 whitespace-normal sm:whitespace-nowrap text-center sm:text-left">
          {winsCount} / {totalChampions} WINS 🏆
        </div>
        
        {/* Progress Bar */}
  <div className="flex-1 w-full sm:w-auto">
          {/* Accessible progress element for screen readers */}
          <progress value={winPercentage} max={100} className="sr-only">
            {winPercentage}%
          </progress>
          <div
            className="relative w-full min-w-0 bg-slate-600 rounded-full overflow-hidden h-6 md:h-8"
          >
            <div
              ref={progressBarRef}
              className="w-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-6 md:h-8 rounded-full transition-all duration-500 ease-out shadow-sm"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm md:text-base mt-0.5 md:mt-1 font-bold text-gray-800">
                {winPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
