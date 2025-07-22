"use client"
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import styles from './ChampionsGrid.module.css';


export interface ChampionChecklist {
  played: boolean;
  top4: boolean;
  win: boolean;
}

interface Champion {
  id: number;
  name: string;
  imageKey: string;
  checklist: ChampionChecklist;
}


type FilterType = 'all' | 'played' | 'top4' | 'win' | 'unplayed';

interface ChampionsGridProps {
  search: string;
}

const MIN_COLUMNS = 5;
const MAX_COLUMNS = 10;
const DEFAULT_COLUMNS = 8;

const ChampionsGrid = ({ search }: ChampionsGridProps) => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [isPressingClear, setIsPressingClear] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load champions from localStorage or fallback to static json
    const saved = localStorage.getItem('champions');
    if (saved) {
      setChampions(JSON.parse(saved));
    } else {
      fetch('/api/champions')
        .then(res => res.json())
        .then(data => {
          // Migrate old status to new checklist if needed
          setChampions(data.map((champ: Champion) => ({
            ...champ,
            checklist: champ.checklist || { played: false, top4: false, win: false },
          })));
        });
    }
  }, []);

  useEffect(() => {
    if (champions.length > 0) {
      localStorage.setItem('champions', JSON.stringify(champions));
    }
  }, [champions]);

  const triggerConfetti = (elementRef?: HTMLElement) => {
    let origin = { x: 0.5, y: 0 }; // Default to top center
    
    if (elementRef) {
      // Get the position of the champion card
      const rect = elementRef.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      origin = { x, y };
    }
    
    // Gold confetti from champion position
    confetti({
      particleCount: 100,
      spread: 70,
      origin,
      colors: ['#ffd700', '#ffed4e', '#fff77a', '#b8860b'],
      gravity: 0.6,
      drift: 0,
      startVelocity: 45
    });
  };

  const clearAllSelections = () => {
    setChampions(prev =>
      prev.map(champ => ({
        ...champ,
        checklist: { played: false, top4: false, win: false }
      }))
    );
  };

  const startClearPress = () => {
    setIsPressingClear(true);
    setClearProgress(0);
    
    const TOTAL_DURATION = 2000; // 1.5 seconds for better UX
    const INTERVAL = 40; // 30ms intervals for smoother animation
    const INCREMENT = (100 / TOTAL_DURATION) * INTERVAL; // Calculate increment for smooth progress
    
    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setClearProgress(prev => {
        const newProgress = prev + INCREMENT;
        if (newProgress >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return newProgress;
      });
    }, INTERVAL);
    
    // Execute clear after the full duration
    clearTimeoutRef.current = setTimeout(() => {
      clearAllSelections();
      stopClearPress();
    }, TOTAL_DURATION);
  };

  const stopClearPress = () => {
    setIsPressingClear(false);
    setClearProgress(0);
    
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleChecklistChange = (id: number, key: keyof ChampionChecklist, elementRef?: HTMLElement) => {
    setChampions(prev =>
      prev.map(champ => {
        if (champ.id !== id) return champ;
        let checklist = { ...champ.checklist };
        const wasWin = checklist.win;
        
        if (key === 'win') {
          checklist = { played: true, top4: true, win: !checklist.win };
          // Trigger confetti when achieving a win (not when removing it)
          if (!wasWin && checklist.win && effectsEnabled) {
            setTimeout(() => triggerConfetti(elementRef), 100);
          }
        } else if (key === 'top4') {
          checklist = { played: true, top4: !checklist.top4, win: false };
        } else if (key === 'played') {
          checklist = { played: !checklist.played, top4: false, win: false };
        }
        return { ...champ, checklist };
      })
    );
  };

  // Filtering logic
  const filteredChampions = champions.filter(champ => {
    const checklist = champ.checklist || { played: false, top4: false, win: false };
    const nameMatch = champ.name.toLowerCase().includes(search.toLowerCase());
    if (!nameMatch) return false;
    if (filter === 'all') return true;
    if (filter === 'played') return checklist.played && !checklist.top4 && !checklist.win;
    if (filter === 'top4') return checklist.top4 && !checklist.win;
    if (filter === 'win') return checklist.win;
    if (filter === 'unplayed') return !checklist.played && !checklist.top4 && !checklist.win;
    return true;
  });

  return (
    <section className="flex-1 w-full max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex items-center gap-4 w-full max-w-md">
          <label htmlFor="columns-slider" className="text-sm font-medium whitespace-nowrap text-gray-600">
            Columns:
          </label>
          <input
            id="columns-slider"
            type="range"
            min={MIN_COLUMNS}
            max={MAX_COLUMNS}
            step={1}
            value={columns}
            onChange={e => setColumns(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-xs w-8 text-center text-gray-500">{columns}</span>
          
          <div className="flex gap-6 ml-4">
            {/* Effects Toggle */}
            <div 
              className={`${styles.toggleSwitch} ${effectsEnabled ? styles.active : ''} ${styles.tooltip}`}
              data-tooltip="Toggle animations and effects"
              onClick={() => setEffectsEnabled(!effectsEnabled)}
            >
              <div className={styles.toggleKnob}>
                {effectsEnabled ? '✨' : '🚫'}
              </div>
            </div>
            
            {/* Clear All Press-and-Hold Button */}
            <div
              className={`${styles.pressHoldButton} ${isPressingClear ? styles.pressing : ''} ${styles.tooltip}`}
              data-tooltip="Hold to clear all selections"
              onMouseDown={startClearPress}
              onMouseUp={stopClearPress}
              onMouseLeave={stopClearPress}
              onTouchStart={startClearPress}
              onTouchEnd={stopClearPress}
            >
              <span>🗑️</span>
              <span>{isPressingClear ? 'Clearing...' : 'Clear All'}</span>
              <div 
                className={styles.pressHoldProgress}
                style={{ width: `${clearProgress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          {[
            { key: 'all' as const, label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
            { key: 'played' as const, label: 'Played ✔️', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
            { key: 'top4' as const, label: 'Top 4 🏅', color: 'bg-gray-200 text-gray-800 hover:bg-gray-300' },
            { key: 'win' as const, label: 'Win 🏆', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
            { key: 'unplayed' as const, label: 'Unplayed', color: 'bg-gray-50 text-gray-500 hover:bg-gray-100' },
          ].map(({ key, label, color }) => (
            <motion.button
              key={key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === key 
                  ? color.replace('hover:', '').replace('100', '200').replace('50', '100')
                  : `${color} border border-gray-200`
              }`}
              onClick={() => setFilter(key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>
      
      <main
        className={styles.championGrid}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        <AnimatePresence>
          {filteredChampions.map(champ => {
            const imgUrl = champ.imageKey
              ? `https://ddragon.leagueoflegends.com/cdn/15.14.1/img/champion/${champ.imageKey}.png`
              : '';
            const checklist = champ.checklist || { played: false, top4: false, win: false };
            
            // Determine card background class based on highest achieved status
            let cardClass = styles.championCard;
            if (checklist.win) {
              cardClass += ` ${styles.cardWin}`;
            } else if (checklist.top4) {
              cardClass += ` ${styles.cardTop4}`;
            } else if (checklist.played) {
              cardClass += ` ${styles.cardPlayed}`;
            }
            
            return (
              <motion.div
                key={champ.id}
                className={cardClass}
                data-champion-id={champ.id}
                layout={effectsEnabled}
                initial={effectsEnabled ? { opacity: 0, scale: 0.8 } : undefined}
                animate={effectsEnabled ? { opacity: 1, scale: 1 } : undefined}
                exit={effectsEnabled ? { opacity: 0, scale: 0.8 } : undefined}
                transition={effectsEnabled ? { duration: 0.3 } : undefined}
                whileHover={effectsEnabled ? { scale: 1.02 } : undefined}
                whileTap={effectsEnabled ? { scale: 0.98 } : undefined}
              >
                <motion.div 
                  className={styles.championImage}
                  whileHover={effectsEnabled ? { scale: 1.05 } : undefined}
                  transition={effectsEnabled ? { duration: 0.2 } : undefined}
                >
                  {imgUrl && (
                    <Image
                      src={imgUrl}
                      alt={champ.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      unoptimized
                    />
                  )}
                </motion.div>
                
                <div className={styles.championInfo}>
                  <h3 className={styles.championName}>{champ.name}</h3>
                  
                  <div className={styles.checkboxContainer}>
                    {[
                      { key: 'played' as const, emoji: '✔️', className: 'played', label: 'Played' },
                      { key: 'top4' as const, emoji: '🏅', className: 'top4', label: 'Top 4' },
                      { key: 'win' as const, emoji: '🏆', className: 'win', label: 'Win' },
                    ].map(({ key, emoji, className, label }) => {
                      const isChecked = checklist[key];
                      const buttonClass = isChecked 
                        ? `${styles.checkboxButton} ${styles[className]}`
                        : `${styles.checkboxButton} ${styles[`unchecked${className.charAt(0).toUpperCase() + className.slice(1)}` as keyof typeof styles] || styles.unchecked}`;
                      
                      return (
                        <motion.button
                          key={key}
                          onClick={(e) => {
                            // Get the champion card element (parent of parent of button)
                            const cardElement = e.currentTarget.closest('[data-champion-id]') as HTMLElement;
                            handleChecklistChange(champ.id, key, cardElement);
                          }}
                          className={buttonClass}
                          title={label}
                          aria-label={`${label} for ${champ.name}`}
                          whileHover={effectsEnabled ? { scale: 1.1 } : undefined}
                          whileTap={effectsEnabled ? { scale: 0.9 } : undefined}
                          animate={effectsEnabled && isChecked ? { rotate: [0, 10, -10, 0] } : undefined}
                          transition={effectsEnabled ? { duration: 0.3 } : undefined}
                        >
                          {isChecked ? emoji : ''}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>
    </section>
  );
};

export default ChampionsGrid;
