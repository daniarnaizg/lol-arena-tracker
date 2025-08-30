"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArenaMatchCard } from './ui/ArenaMatchCard';
import { LocalStorageManager, StoredPlayerData } from '@/utils/localStorage';
import { normalizeChampionName } from '@/utils/championUtils';
import type { Champion } from '@/services/ddragon';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface ArenaMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameMode: string;
    gameType: string;
    queueId: number;
    gameDuration: number;
    gameEndTimestamp: number;
    participants: ArenaParticipant[];
  };
}

interface ArenaParticipant {
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championId: number;
  championName: string;
  placement: number;
  playerSubteamId: number;
  teamEarlySurrendered: boolean;
  win: boolean;
}

interface ArenaMatchesData {
  arenaMatches: ArenaMatch[];
  totalChecked: number;
  arenaCount: number;
}

interface MatchHistoryProps {
  className?: string;
  onChampionSearch?: (championName: string) => void;
  // Allows applying match-history-derived improvements to champion checklist
  onApplyChampionUpdates?: React.Dispatch<React.SetStateAction<Champion[]>>;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ className = '', onChampionSearch, onApplyChampionUpdates }) => {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [arenaMatches, setArenaMatches] = useState<ArenaMatchesData | null>(null);
  const [showInputs, setShowInputs] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  // Apply from history UX state
  const [isApplying, setIsApplying] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<null | { total: number; played: number; top4: number; win: number }>(null);
  const [previewDetails, setPreviewDetails] = useState<null | Array<{ name: string; from: number; to: number }>>(
    null
  );
  const [btnState, setBtnState] = useState<'idle' | 'nochange' | 'applied'>('idle');

  const performSearch = useCallback(async (playerData?: StoredPlayerData) => {
    const searchGameName = playerData?.gameName || gameName.trim();
    const searchTagLine = playerData?.tagLine || tagLine.trim();
    
    if (!searchGameName || !searchTagLine) {
      setError('Please enter both Game Name and Tag Line');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let accountData;
      
      // If we have saved player data with puuid, use it directly
      if (playerData?.puuid) {
        accountData = {
          account: {
            puuid: playerData.puuid,
            gameName: playerData.gameName,
            tagLine: playerData.tagLine,
          }
        };
        setAccount(accountData.account);
      } else {
        // Step 1: Get PUUID from Riot ID
        const accountResponse = await fetch('/api/riot-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameName: searchGameName,
            tagLine: searchTagLine,
          }),
        });

        accountData = await accountResponse.json();

        if (!accountResponse.ok) {
          throw new Error(accountData.error || 'Failed to fetch account');
        }
        
        setAccount(accountData.account);
        
        // Save player data for future visits
        const playerDataToSave: StoredPlayerData = {
          gameName: accountData.account.gameName,
          tagLine: accountData.account.tagLine,
          puuid: accountData.account.puuid,
          savedAt: Date.now(),
        };
        LocalStorageManager.setPlayerData(playerDataToSave);
      }
      
    // Step 2: Fetch match history (check up to 50 overall matches for more Arena hits)
      const matchResponse = await fetch('/api/match-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid: accountData.account.puuid,
      count: 50, // Request up to 50 recent matches overall
        }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok) {
        throw new Error(matchData.error || 'Failed to fetch match history');
      }
      
  // Step 3: Fetch Arena match details (return up to 30 Arena matches, scanning up to 50 recent matches)
      if (matchData.matchIds && matchData.matchIds.length > 0) {
        const arenaResponse = await fetch('/api/arena-matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchIds: matchData.matchIds,
    maxMatches: 30, // Return up to 30 Arena matches
            puuid: accountData.account.puuid,
          }),
        });

        const arenaData = await arenaResponse.json();

        if (!arenaResponse.ok) {
          throw new Error(arenaData.error || 'Failed to fetch Arena match details');
        }

        setArenaMatches(arenaData);
        setShowInputs(false);
      } else {
        throw new Error('No matches found for this account');
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // If auto-search fails, show inputs and clear saved data
      if (playerData) {
        setShowInputs(true);
        setIsExpanded(true);
        LocalStorageManager.clearPlayerData();
      }
    } finally {
      setIsLoading(false);
    }
  }, [gameName, tagLine]);

  // Load saved player data on component mount
  useEffect(() => {
    const loadSavedPlayer = async () => {
      const savedPlayer = LocalStorageManager.getPlayerData();
      if (savedPlayer && !hasAutoSearched) {
        setGameName(savedPlayer.gameName);
        setTagLine(savedPlayer.tagLine);
        setAccount({
          puuid: savedPlayer.puuid,
          gameName: savedPlayer.gameName,
          tagLine: savedPlayer.tagLine,
        });
        setIsExpanded(true); // Start expanded when there's a saved player
        setHasAutoSearched(true);
        
        // Auto-search for the saved player
        await performSearch(savedPlayer);
      }
    };

    loadSavedPlayer();
  }, [hasAutoSearched, performSearch]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await performSearch();
  };

  const handleRefresh = () => {
    performSearch();
  };

  const handleBack = () => {
    setShowInputs(true);
    setArenaMatches(null);
    setAccount(null);
    setError(null);
    // Clear saved data when manually going back to search for a new player
    LocalStorageManager.clearPlayerData();
    setGameName('');
    setTagLine('');
    setHasAutoSearched(false);
  };

  // Build the best result per champion from arena matches
  const buildBestByChampion = (): Map<string, number> => {
    const bestByChampion = new Map<string, number>();
    if (!arenaMatches || !account) return bestByChampion;
    for (const match of arenaMatches.arenaMatches) {
      const userP = match.info.participants.find(p => p.puuid === account.puuid);
      if (!userP) continue;
      const nameKey = normalizeChampionName(userP.championName);
      let level = 1; // played baseline if present in history
      // Only count placement === 1 as Win; placements 2-4 as Top 4
      if (userP.placement === 1) level = 3;
      else if (userP.placement <= 4) level = 2;
      const prev = bestByChampion.get(nameKey) ?? 0;
      if (level > prev) bestByChampion.set(nameKey, level);
    }
    return bestByChampion;
  };

  // Open confirm modal with a simple summary and detailed list
  const openConfirmApply = () => {
    if (!arenaMatches || !account || !onApplyChampionUpdates) return;
    const best = buildBestByChampion();
    if (best.size === 0) {
      // brief button feedback for no changes
      setBtnState('nochange');
      setTimeout(() => setBtnState('idle'), 1500);
      return;
    }
    const stored = LocalStorageManager.getChampionData();
    const champions: Champion[] = stored?.champions || [];
    let total = 0, win = 0, top4 = 0, played = 0;
    const details: Array<{ name: string; from: number; to: number }> = [];
    for (const champ of champions) {
      const key = normalizeChampionName(champ.name);
      const target = best.get(key) ?? 0;
      const currentLevel = champ.checklist?.win ? 3 : champ.checklist?.top4 ? 2 : champ.checklist?.played ? 1 : 0;
      if (target > currentLevel) {
        total += 1;
        if (target === 3) win += 1;
        else if (target === 2) top4 += 1;
        else if (target === 1) played += 1;
        details.push({ name: champ.name, from: currentLevel, to: target });
      }
    }

    if (total === 0) {
      setBtnState('nochange');
      setTimeout(() => setBtnState('idle'), 1500);
      return;
    }

    setPreviewSummary({ total, win, top4, played });
    setPreviewDetails(details);
    setIsConfirmOpen(true);
  };

  // Apply the improvements after confirmation
  const handleApplyFromHistory = async () => {
    if (!arenaMatches || !account || !onApplyChampionUpdates || isApplying) return;
    setIsApplying(true);
    try {
      const bestByChampion = buildBestByChampion();
      if (bestByChampion.size === 0) {
        setBtnState('nochange');
        setTimeout(() => setBtnState('idle'), 1500);
        return;
      }
      onApplyChampionUpdates(prev => {
        const next = prev.map(champ => {
          const key = normalizeChampionName(champ.name);
          const target = bestByChampion.get(key);
          if (!target) return champ;
          const currentLevel = champ.checklist?.win ? 3 : champ.checklist?.top4 ? 2 : champ.checklist?.played ? 1 : 0;
          if (target <= currentLevel) return champ; // only improve
          const improved =
            target === 3
              ? { played: true, top4: true, win: true }
              : target === 2
              ? { played: true, top4: true, win: false }
              : { played: true, top4: false, win: false };
          return { ...champ, checklist: improved };
        });
        return next;
      });
      // brief success button feedback
      setBtnState('applied');
      setTimeout(() => setBtnState('idle'), 1500);
    } finally {
      setIsApplying(false);
      setIsConfirmOpen(false);
      setPreviewSummary(null);
      setPreviewDetails(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className={`rounded-xl shadow-sm bg-slate-900 ${className}`}>
      <AnimatePresence mode="wait">
        {showInputs ? (
          <motion.div
            key="inputs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`p-4 md:p-6 ${!isExpanded ? 'pb-4 md:pb-6' : ''}`}
          >
            <div className={`flex items-center justify-between ${isExpanded ? 'mb-4' : ''}`}>
              <div className="flex items-center gap-3">
                <h2 className="text-lg md:text-xl font-semibold text-gray-300 truncate">ARENA MATCH HISTORY</h2>
                <span className="text-gray-400 text-sm pl-8 hidden md:inline">Search for your last 30 arena matches and apply the results to the tracker</span>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize section" : "Expand section"}
                className="w-10 h-10 md:w-8 md:h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg 
                  className={`w-5 h-5 md:w-4 md:h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <motion.div
              initial={false}
              animate={{ 
                height: isExpanded ? "auto" : 0,
                opacity: isExpanded ? 1 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4 min-h-[90px] flex flex-col justify-center">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1">
                      <label className="sr-only">Game Name</label>
                      <input
                        type="text"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value.toUpperCase())}
                        placeholder="PLAYER NAME"
                        className="w-full h-12 px-4 py-2 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                        disabled={isLoading}
                      />
                    </div>

                    <span className="hidden md:inline text-gray-400 text-2xl font-semibold">#</span> 

                    <div className="flex gap-2 flex-1">
                      <label className="sr-only">Tag Line</label>
                      <input
                        type="text"
                        value={tagLine}
                        onChange={(e) => setTagLine(e.target.value.toUpperCase())}
                        placeholder="TAG"
                        className="flex-1 h-12 px-4 py-2 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        title={isLoading ? "Loading..." : "Search Arena matches"}
                        className={`
                          px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center
                          ${isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
                          }
                          text-white
                        `}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-red-600 text-sm">{error}</p>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="matches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            {/* Header with navigation */}
            {/* Mobile toolbar */}
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleBack}
                  title="Go back to search"
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <h2 className="text-lg font-bold text-gray-300 px-2 truncate">MATCH HISTORY</h2>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    title="Refresh match history"
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                      ${isLoading 
                        ? 'bg-blue-500 cursor-not-allowed' 
                        : 'bg-gray-700 hover:bg-blue-600'
                      }
                    `}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openConfirmApply}
                    disabled={isLoading || isApplying || !arenaMatches || !account}
                    title="Apply from history: upgrade champion status"
                    className={`
                      h-10 rounded-lg flex items-center justify-center transition-colors px-3 gap-1 relative
                      ${isLoading || isApplying || !arenaMatches || !account ? 'bg-gray-600 cursor-not-allowed' : btnState === 'nochange' ? 'bg-red-600 animate-shake' : btnState === 'applied' ? 'bg-green-600 animate-pulse' : 'bg-gray-700 hover:bg-green-600'}
                    `}
                  >
                    {isApplying ? (
                      <div className="w-5 h-5 border-2 border-green-200 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white text-sm">Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {account && (
                <p className="mt-1 text-xs font-semibold text-gray-500 uppercase text-center truncate">
                  {account.gameName}#{account.tagLine}
                </p>
              )}
            </div>

            {/* Desktop/tablet header */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  title="Go back to search"
                  className="w-8 h-8 bg-gray-700 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-300">MATCH HISTORY</h2>
                  {account && (
                    <div className="flex items-center gap-2">
                      <p className="text-m font-semibold text-gray-500 uppercase">{account.gameName}#{account.tagLine}</p>
                      <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Refresh match history"
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                          ${isLoading 
                            ? 'bg-blue-500 cursor-not-allowed' 
                            : 'bg-gray-700 hover:bg-blue-200'
                          }
                        `}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    onClick={openConfirmApply}
                    disabled={isLoading || isApplying || !arenaMatches || !account}
                    title="Apply from history"
                    className={`
                      h-8 rounded-lg flex items-center justify-center transition-colors px-2 gap-1
                      ${isLoading || isApplying || !arenaMatches || !account ? 'bg-gray-600 cursor-not-allowed' : btnState === 'nochange' ? 'bg-red-600 animate-shake' : btnState === 'applied' ? 'bg-green-600 animate-pulse' : 'bg-gray-700 hover:bg-green-200'}
                    `}
                  >
                    {isApplying ? (
                      <div className="w-4 h-4 border-2 border-green-200 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white text-sm">Apply</span>
                      </>
                    )}
                  </button>
                  <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Upgrade champion status from match history
                  </div>
                </div>
              </div>
            </div>

            {/* Match history horizontal scroll */}
      {arenaMatches && (
        <div className="overflow-x-auto flex items-center min-h-[90px] scrollbar-white">
                <div className="flex gap-3 min-w-max">
                  {arenaMatches.arenaMatches.length > 0 ? (
                    arenaMatches.arenaMatches.map((match, index) => {
                      const userParticipant = match.info.participants.find(p => p.puuid === account?.puuid);
                      const matchDate = formatDate(match.info.gameEndTimestamp);
                      
                      if (!userParticipant) return null;
                      
                      return (
                        <ArenaMatchCard
                          key={match.metadata.matchId}
                          championName={userParticipant.championName}
                          placement={userParticipant.placement}
                          matchDate={matchDate}
                          index={index}
                          onChampionSearch={onChampionSearch}
                        />
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-500 w-full">
                      <div className="text-center">
                        <p className="text-sm">No Arena matches found</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation modal */}
            <ConfirmationModal
              isOpen={isConfirmOpen}
              title="Apply from match history"
              message={(
                <div>
                  {previewSummary && (
                    <div className="text-sm text-gray-700 mb-2">
                      <span>Will update {previewSummary.total} champion{previewSummary.total === 1 ? '' : 's'}:</span>
                      <div className="mt-1 flex gap-2 text-xs">
                        <span className="text-yellow-700">Wins: {previewSummary.win}</span>
                        <span className="text-gray-700">Top 4: {previewSummary.top4}</span>
                        <span className="text-amber-700">Played: {previewSummary.played}</span>
                      </div>
                    </div>
                  )}
                  {previewDetails && previewDetails.length > 0 && (
                    <ul className="max-h-48 overflow-auto pr-1 text-sm space-y-1">
                      {previewDetails.map((d) => {
                        const levelToLabel = (n: number) => (n === 3 ? 'Win' : n === 2 ? 'Top 4' : n === 1 ? 'Played' : 'Unplayed');
                        const colorFrom = d.from === 3 ? 'text-yellow-700' : d.from === 2 ? 'text-gray-700' : d.from === 1 ? 'text-amber-700' : 'text-gray-500';
                        const colorTo = d.to === 3 ? 'text-yellow-700' : d.to === 2 ? 'text-gray-700' : d.to === 1 ? 'text-amber-700' : 'text-gray-500';
                        return (
                          <li key={`${d.name}-${d.from}-${d.to}`} className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-900 truncate">{d.name}</span>
                            <span className="text-xs">
                              <span className={`${colorFrom}`}>{levelToLabel(d.from)}</span>
                              <span className="mx-1 text-gray-500">→</span>
                              <span className={`${colorTo} font-semibold`}>{levelToLabel(d.to)}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
              confirmText="Apply"
              cancelText="Cancel"
              onConfirm={handleApplyFromHistory}
              onCancel={() => { setIsConfirmOpen(false); setPreviewSummary(null); setPreviewDetails(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
