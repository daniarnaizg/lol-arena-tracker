import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import { SocialShare } from './ui';
import { LocalStorageManager } from '@/utils/localStorage';

interface HeaderProps {
  search: string;
  setSearch: (value: string) => void;
  wins?: number;
  total?: number;
}

const Header = ({ search, setSearch, wins = 0, total = 0 }: HeaderProps) => {
  type MiniChampion = { checklist?: { win?: boolean } };
  // Fallback to localStorage so mobile header can render real progress immediately
  const [lsWins, setLsWins] = useState(0);
  const [lsTotal, setLsTotal] = useState(0);

  useEffect(() => {
    if (total > 0) return; // props already have data
    const stored = LocalStorageManager.getChampionData();
    if (stored?.champions) {
  const list = stored.champions as MiniChampion[];
      setLsTotal(list.length);
      setLsWins(list.filter((c) => c?.checklist?.win === true).length);
    }
  }, [total]);

  const finalTotal = total > 0 ? total : lsTotal;
  const finalWins = total > 0 ? wins : lsWins;

  return (
    <header className="w-full py-3 md:py-8 px-3 md:px-6 bg-slate-900 text-white shadow">
      <div className="max-w-7xl mx-auto">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between gap-3 relative">
          <div className="flex-col flex items-center">
            <h1 className="text-3xl font-bold tracking-tight">LoL Arena Tracker</h1>
            <p className="tagline text-gray-400 text-xs">Track your Arena wins and explore the best champions, builds, and augments.</p>
          </div>
          <div className="flex-1 relative h-16">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-6">
              <SearchBar search={search} setSearch={setSearch} />
            </div>
          </div>

          <div className="flex items-center justify-end min-w-[48px] mr-1">
            <SocialShare wins={finalWins} total={finalTotal} />
          </div>
        </div>

        {/* Mobile header: search bar + share button */}
        <div className="md:hidden flex items-center gap-2">
          <div className="flex-1">
            <SearchBar search={search} setSearch={setSearch} />
          </div>
          <div className="shrink-0">
            <SocialShare wins={finalWins} total={finalTotal} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
