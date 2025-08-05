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
    <section className="w-full px-6">
      <div className="flex gap-6 items-center">
        {/* Win Stats */}
        <div className="text-2xl font-black text-yellow-600 whitespace-nowrap">
          {winsCount} / {totalChampions} WINS 🏆
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1">
          <div className="relative w-full bg-slate-600 rounded-full h-8">
            <div
              ref={progressBarRef}
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-8 rounded-full transition-all duration-500 ease-out shadow-sm"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-800">
                {winPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
