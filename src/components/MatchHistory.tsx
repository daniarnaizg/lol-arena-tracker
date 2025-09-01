"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArenaMatchCard } from './ui/ArenaMatchCard';
import { LocalStorageManager, StoredPlayerData } from '@/utils/localStorage';
import { normalizeChampionName } from '@/utils/championUtils';
import type { Champion } from '@/services/ddragon';
import { QuickFilters } from './ui/QuickFilters';

interface FilterType {
  startDate?: number | null;
  endDate?: number | null;
  patch?: string | null;
  season?: number | null;
  limit?: number;
}

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

// Simplified Arena match data - only what we actually use
interface ArenaMatch {
  metadata: {
    matchId: string;
  };
  info: {
    gameCreation: number;
    gameEndTimestamp: number;
    // User's match data (already filtered to the requesting user)
    championName: string;
    placement: number;
    win: boolean;
  };
}

interface ChampionState {
  championName: string;
  bestPlacement: number;
  win: boolean;
  top4: boolean;
  played: boolean;
}

interface ChecklistData {
  success: boolean;
  championData: {
    playedChampions: number;
    championStates?: ChampionState[];
  };
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
  
  // Filter state
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterType>({});
  const [isAutoSearching, setIsAutoSearching] = useState(false);

  // Auto-sync checklist with current match history
  const autoSyncChecklist = useCallback((matches: ArenaMatchesData) => {
    if (!onApplyChampionUpdates || !matches.arenaMatches.length) {
      return;
    }

    console.log('🔄 Auto-syncing checklist with filtered matches...');
    
    // Build the best result per champion from current filtered matches
    const bestByChampion = new Map<string, number>();
    
    for (const match of matches.arenaMatches) {
      const nameKey = normalizeChampionName(match.info.championName);
      let level = 1; // played baseline if present in history
      // Only count placement === 1 as Win; placements 2-4 as Top 4
      if (match.info.placement === 1) level = 3;
      else if (match.info.placement <= 4) level = 2;
      const prev = bestByChampion.get(nameKey) ?? 0;
      if (level > prev) bestByChampion.set(nameKey, level);
    }

    // Update champions based on filtered match history
    onApplyChampionUpdates(prev => {
      return prev.map(champ => {
        const key = normalizeChampionName(champ.name);
        const target = bestByChampion.get(key) ?? 0;
        
        // Set checklist based on best achievement in filtered matches
        const checklist = { 
          played: target >= 1, 
          top4: target >= 2, 
          win: target >= 3 
        };
        
        return { ...champ, checklist };
      });
    });

    console.log(`✅ Auto-synced checklist: ${bestByChampion.size} champions from filtered matches`);
  }, [onApplyChampionUpdates]);

  // Handle filtered match search
  const handleFilteredSearch = useCallback(async (filters: FilterType) => {
    if (!account?.puuid) return;

    setIsFiltering(true);
    setError(null);

    try {
      console.log('🔍 Applying filters:', filters);
      
      // Check if filters are essentially empty (only limit specified)
      const hasActiveFilters = Boolean(
        filters.startDate || filters.endDate || filters.patch || filters.season
      );
      
      if (!hasActiveFilters) {
        // If no active filters, load all matches from database
        console.log('📄 No active filters, loading all matches from database...');
        
        try {
          const response = await fetch('/api/filtered-matches', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              puuid: account.puuid,
              limit: 100, // Load more matches when no filters
            }),
          });

          const data = await response.json();

          if (response.ok && data.success && data.matches) {
            const transformedMatches = {
              arenaMatches: data.matches,
              totalChecked: data.totalMatches || 0,
              arenaCount: data.totalMatches || 0
            };

            setArenaMatches(transformedMatches);
            
            // Auto-sync checklist with all matches
            autoSyncChecklist(transformedMatches);
            
            console.log(`✅ Loaded ${data.totalMatches} matches without filters`);
          }
        } catch (error) {
          console.error('❌ Error loading unfiltered matches:', error);
        }
        
        setCurrentFilters({});
        return;
      }
      
      const response = await fetch('/api/filtered-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid: account.puuid,
          ...filters,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch filtered matches');
      }

      if (data.success && data.matches) {
        const transformedMatches = {
          arenaMatches: data.matches,
          totalChecked: data.totalMatches || 0,
          arenaCount: data.totalMatches || 0
        };

        setArenaMatches(transformedMatches);
        setCurrentFilters(filters);
        
        // Auto-sync checklist with filtered matches
        autoSyncChecklist(transformedMatches);
        
        console.log(`✅ Found ${data.totalMatches} filtered matches`);
      }

    } catch (error) {
      console.error('❌ Filter search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply filters');
    } finally {
      setIsFiltering(false);
    }
  }, [account?.puuid, autoSyncChecklist]); // Dependencies: puuid and autoSyncChecklist

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
      
      
      // Step 2: Fetch match history and save Arena matches to database
      console.log('🚀 Fetching match history and saving Arena matches to database');
      
      // First get match history
      const historyResponse = await fetch('/api/match-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid: accountData.account.puuid,
          count: 30,
        }),
      });

      const historyData = await historyResponse.json();

      if (!historyResponse.ok) {
        throw new Error(historyData.error || 'Failed to fetch match history');
      }

      // Then get and save Arena match details
      // Check if this should be an incremental update based on database cache
      const shouldUseIncremental = historyData.fromDatabase && historyData.lastMatchTimestamp;
      
      const detailsResponse = await fetch('/api/match-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid: accountData.account.puuid,
          matchIds: historyData.matchIds, // Use the match IDs from history
          incrementalUpdate: shouldUseIncremental,
        }),
      });

      const detailsData = await detailsResponse.json();

      if (!detailsResponse.ok) {
        throw new Error(detailsData.error || 'Failed to process match details');
      }

      // Log incremental update info
      if (shouldUseIncremental && detailsData.incrementalUpdate) {
        console.log(`🔄 Incremental update completed: ${detailsData.newMatches || 0} new matches found`);
        if (detailsData.latestTimestamp) {
          console.log(`📅 Latest match timestamp updated to: ${new Date(detailsData.latestTimestamp * 1000).toISOString()}`);
        }
      }

      // Transform the saved matches into the format expected by the UI
      if (detailsData.success && detailsData.matches && detailsData.matches.length > 0) {
        const transformedMatches = {
          arenaMatches: detailsData.matches.map((match: {
            matchId: string;
            gameCreation: number;
            gameEndTimestamp?: number;
            championName: string;
            placement: number;
            win: boolean;
          }) => ({
            metadata: {
              matchId: match.matchId
            },
            info: {
              gameCreation: match.gameCreation,
              gameEndTimestamp: match.gameEndTimestamp || match.gameCreation + 1000000, // Fallback
              championName: match.championName,
              placement: match.placement,
              win: match.win
            }
          })),
          totalChecked: detailsData.processed || 0,
          arenaCount: detailsData.arenaMatches || 0
        };

        setArenaMatches(transformedMatches);
        setShowInputs(false);
        
        // Auto-sync checklist with initial matches
        autoSyncChecklist(transformedMatches);
        
        console.log(`✅ Found and saved ${detailsData.arenaMatches} Arena matches to database`);
      } else {
        throw new Error('No Arena matches found for this account');
      }    } catch (err) {
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
  }, [gameName, tagLine, autoSyncChecklist]);

  // Load saved player data on component mount
  useEffect(() => {
    const loadSavedPlayer = async () => {
      const savedPlayer = LocalStorageManager.getPlayerData();
      if (savedPlayer && !hasAutoSearched && !isAutoSearching && !isLoading) {
        setIsAutoSearching(true);
        setGameName(savedPlayer.gameName);
        setTagLine(savedPlayer.tagLine);
        setAccount({
          puuid: savedPlayer.puuid,
          gameName: savedPlayer.gameName,
          tagLine: savedPlayer.tagLine,
        });
        setIsExpanded(true); // Start expanded when there's a saved player
        setHasAutoSearched(true);
        
        // Auto-search for the saved player - use the function directly
        const searchGameName = savedPlayer.gameName;
        const searchTagLine = savedPlayer.tagLine;
        
        if (!searchGameName || !searchTagLine) {
          setError('Please enter both Game Name and Tag Line');
          setIsAutoSearching(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          // Use saved player data directly
          const accountData = {
            account: {
              puuid: savedPlayer.puuid,
              gameName: savedPlayer.gameName,
              tagLine: savedPlayer.tagLine,
            }
          };
          setAccount(accountData.account);
          
          // Step 2: Fetch match history and save Arena matches to database
          console.log('🚀 Auto-fetching match history for saved player:', savedPlayer.gameName);
          
          // First get match history
          const historyResponse = await fetch('/api/match-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              puuid: accountData.account.puuid,
              count: 30,
            }),
          });

          const historyData = await historyResponse.json();

          if (!historyResponse.ok) {
            throw new Error(historyData.error || 'Failed to fetch match history');
          }

          // Then get and save Arena match details
          const shouldUseIncremental = historyData.fromDatabase && historyData.lastMatchTimestamp;
          
          const detailsResponse = await fetch('/api/match-details', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              puuid: accountData.account.puuid,
              matchIds: historyData.matchIds,
              incrementalUpdate: shouldUseIncremental,
            }),
          });

          const detailsData = await detailsResponse.json();

          if (!detailsResponse.ok) {
            throw new Error(detailsData.error || 'Failed to process match details');
          }

          // Transform the saved matches into the format expected by the UI
          if (detailsData.success && detailsData.matches && detailsData.matches.length > 0) {
            const transformedMatches = {
              arenaMatches: detailsData.matches.map((match: {
                matchId: string;
                gameCreation: number;
                gameEndTimestamp?: number;
                championName: string;
                placement: number;
                win: boolean;
              }) => ({
                metadata: {
                  matchId: match.matchId
                },
                info: {
                  gameCreation: match.gameCreation,
                  gameEndTimestamp: match.gameEndTimestamp || match.gameCreation + 1000000,
                  championName: match.championName,
                  placement: match.placement,
                  win: match.win
                }
              })),
              totalChecked: detailsData.processed || 0,
              arenaCount: detailsData.arenaMatches || 0
            };

            setArenaMatches(transformedMatches);
            setShowInputs(false);
            console.log(`✅ Auto-loaded ${detailsData.arenaMatches} Arena matches for ${savedPlayer.gameName}`);
          }
        } catch (error) {
          console.error('❌ Auto-search error:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch data');
        } finally {
          setIsLoading(false);
          setIsAutoSearching(false);
        }
      }
    };

    loadSavedPlayer();
  }, [hasAutoSearched, isAutoSearching, isLoading]); // Only depend on state flags

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
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex-1 flex items-center justify-center">
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

                {/* Quick Filters for mobile */}
                {arenaMatches && account && (
                  <div className="flex-shrink-0">
                    <QuickFilters
                      onFiltersChange={handleFilteredSearch}
                      isLoading={isFiltering}
                      puuid={account.puuid}
                    />
                  </div>
                )}
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

              {/* Quick Filters for desktop */}
              {arenaMatches && account && (
                <QuickFilters
                  onFiltersChange={handleFilteredSearch}
                  isLoading={isFiltering}
                  puuid={account.puuid}
                />
              )}
            </div>

            {/* Match history horizontal scroll */}
      {arenaMatches && (
        <div className="overflow-x-auto flex items-center min-h-[90px] scrollbar-white">
                <div className="flex gap-3 min-w-max">
                  {arenaMatches.arenaMatches.length > 0 ? (
                    arenaMatches.arenaMatches.map((match, index) => {
                      // Data is already filtered to the user - no need to find participant
                      const matchDate = formatDate(match.info.gameEndTimestamp);
                      
                      return (
                        <ArenaMatchCard
                          key={match.metadata.matchId}
                          championName={match.info.championName}
                          placement={match.info.placement}
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

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
