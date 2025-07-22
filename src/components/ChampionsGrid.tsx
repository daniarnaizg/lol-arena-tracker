"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';


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


function getFrameColor(checklist: ChampionChecklist) {
  if (checklist.win) return 'border-green-500';
  if (checklist.top4) return 'border-yellow-500';
  if (checklist.played) return 'border-blue-500';
  return 'border-gray-300';
}




interface ChampionsGridProps {
  search: string;
}


const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1.5;

const ChampionsGrid = ({ search }: ChampionsGridProps) => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [filter, setFilter] = useState<'all' | 'played' | 'top4' | 'win' | 'unplayed'>('all');
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

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
    <section className="flex-1 w-full max-w-5xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full max-w-xs">
          <label htmlFor="zoom-slider" className="text-sm font-medium whitespace-nowrap">Zoom:</label>
          <input
            id="zoom-slider"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.1}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-xs w-8 text-center">{zoom.toFixed(1)}x</span>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            className={`px-3 py-1 rounded border ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-black border-gray-300'}`}
            onClick={() => setFilter('all')}
          >All</button>
          <button
            className={`px-3 py-1 rounded border ${filter === 'played' ? 'bg-blue-500 text-white' : 'bg-white text-black border-gray-300'}`}
            onClick={() => setFilter('played')}
          >Played</button>
          <button
            className={`px-3 py-1 rounded border ${filter === 'top4' ? 'bg-yellow-500 text-white' : 'bg-white text-black border-gray-300'}`}
            onClick={() => setFilter('top4')}
          >Top 4</button>
          <button
            className={`px-3 py-1 rounded border ${filter === 'win' ? 'bg-green-500 text-white' : 'bg-white text-black border-gray-300'}`}
            onClick={() => setFilter('win')}
          >Win</button>
          <button
            className={`px-3 py-1 rounded border ${filter === 'unplayed' ? 'bg-gray-400 text-white' : 'bg-white text-black border-gray-300'}`}
            onClick={() => setFilter('unplayed')}
          >Unplayed</button>
        </div>
      </div>
      <main
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.round(5 * zoom)}, minmax(0, 1fr))`,
        }}
      >
        {filteredChampions.map(champ => {
          // Use imageKey as-is, no forced uppercase, no placeholder
          const imgUrl = champ.imageKey
            ? `https://ddragon.leagueoflegends.com/cdn/15.14.1/img/champion/${champ.imageKey}.png`
            : '';
          const checklist = champ.checklist || { played: false, top4: false, win: false };
          const size = 80 * zoom;
          return (
            <div
              key={champ.id}
              className={`flex flex-col items-center p-3 rounded-lg border-4 cursor-pointer transition-all ${getFrameColor(checklist)}`}
              style={{ fontSize: `${zoom * 1}rem` }}
            >
              <div
                className="relative mb-2"
                style={{ width: size, height: size }}
              >
                {imgUrl && (
                  <Image
                    src={imgUrl}
                    alt={champ.name}
                    fill
                    className="object-contain rounded"
                    sizes={`${size}px`}
                    unoptimized
                  />
                )}
              </div>
              <span className="font-medium text-center text-sm mt-1">{champ.name}</span>
              <div className="flex gap-2 mt-2">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.played}
                    onChange={() => handleChecklistChange(champ.id, 'played')}
                  />
                  Played
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.top4}
                    onChange={() => handleChecklistChange(champ.id, 'top4')}
                  />
                  Top 4
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.win}
                    onChange={() => handleChecklistChange(champ.id, 'win')}
                  />
                  Win
                </label>
              </div>
            </div>
          );
        })}
      </main>
    </section>
  );
};

export default ChampionsGrid;
