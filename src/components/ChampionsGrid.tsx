"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
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

  const handleChecklistChange = (id: number, key: keyof ChampionChecklist) => {
    setChampions(prev =>
      prev.map(champ => {
        if (champ.id !== id) return champ;
        let checklist = { ...champ.checklist };
        if (key === 'win') {
          checklist = { played: true, top4: true, win: !checklist.win };
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
        <div className="flex items-center gap-4 w-full max-w-xs">
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
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          {[
            { key: 'all' as const, label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
            { key: 'played' as const, label: 'Played', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
            { key: 'top4' as const, label: 'Top 4', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
            { key: 'win' as const, label: 'Win', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
            { key: 'unplayed' as const, label: 'Unplayed', color: 'bg-gray-50 text-gray-500 hover:bg-gray-100' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === key 
                  ? color.replace('hover:', '').replace('100', '200').replace('50', '100')
                  : `${color} border border-gray-200`
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <main
        className={styles.championGrid}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
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
            <div key={champ.id} className={cardClass}>
              <div className={styles.championImage}>
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
              </div>
              
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
                      <button
                        key={key}
                        onClick={() => handleChecklistChange(champ.id, key)}
                        className={buttonClass}
                        title={label}
                        aria-label={`${label} for ${champ.name}`}
                      >
                        {isChecked ? emoji : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </section>
  );
};

export default ChampionsGrid;
