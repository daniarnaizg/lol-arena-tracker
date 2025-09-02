"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArenaMatchCard } from './ui/ArenaMatchCard';
import { LocalStorageManager, StoredPlayerData } from '@/utils/localStorage';
import { normalizeChampionName } from '@/utils/championUtils';
import type { Champion } from '@/services/ddragon';
import { QuickFilters } from './ui/QuickFilters';

// =============================================================================
// Types and Interfaces
// =============================================================================

interface FilterOptions {
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

interface ArenaMatch {
  metadata: {
    matchId: string;
  };
  info: {
    gameCreation: number;
    gameEndTimestamp: number;
    championName: string;
    placement: number;
    win: boolean;
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
  onApplyChampionUpdates?: React.Dispatch<React.SetStateAction<Champion[]>>;
}

// =============================================================================
// Constants and Configuration
// =============================================================================

const API_ENDPOINTS = {
  RIOT_ACCOUNT: '/api/riot-account',
  MATCH_HISTORY: '/api/match-history',
  MATCH_DETAILS: '/api/match-details',
  FILTERED_MATCHES: '/api/filtered-matches',
} as const;

const DEFAULT_MATCH_COUNT = 30;
const MAX_UNFILTERED_MATCHES = 100;

// Achievement levels for champion progress tracking
const ACHIEVEMENT_LEVELS = {
  PLAYED: 1,
  TOP4: 2,
  WIN: 3,
} as const;

// =============================================================================
// Main Component
// =============================================================================

export const MatchHistory: React.FC<MatchHistoryProps> = ({ 
  className = '', 
  onChampionSearch, 
  onApplyChampionUpdates 
}) => {
  // =============================================================================
  // State Management
  // =============================================================================
  
  // User input state
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [arenaMatches, setArenaMatches] = useState<ArenaMatchesData | null>(null);
  
  // UI state
  const [showInputs, setShowInputs] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  // =============================================================================
  // API Utility Functions
  // =============================================================================
  
  const fetchRiotAccount = useCallback(async (gameName: string, tagLine: string): Promise<RiotAccount> => {
    const response = await fetch(API_ENDPOINTS.RIOT_ACCOUNT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName, tagLine }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch account information');
    }

    const data = await response.json();
    return data.account;
  }, []);

  const fetchMatchHistory = useCallback(async (puuid: string, count: number = DEFAULT_MATCH_COUNT) => {
    const response = await fetch(API_ENDPOINTS.MATCH_HISTORY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puuid, count }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch match history');
    }

    return response.json();
  }, []);

  const fetchMatchDetails = useCallback(async (puuid: string, matchIds: string[], incrementalUpdate = false) => {
    const response = await fetch(API_ENDPOINTS.MATCH_DETAILS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puuid, matchIds, incrementalUpdate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch match details');
    }

    return response.json();
  }, []);

  const fetchFilteredMatches = useCallback(async (puuid: string, filters: FilterOptions = {}, limit: number = MAX_UNFILTERED_MATCHES) => {
    const response = await fetch(API_ENDPOINTS.FILTERED_MATCHES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puuid, limit, ...filters }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch filtered matches');
    }

    return response.json();
  }, []);

  // =============================================================================
  // Champion Progress Utility Functions
  // =============================================================================
  
  const calculateChampionLevel = (placement: number): number => {
    if (placement === 1) return ACHIEVEMENT_LEVELS.WIN;
    if (placement <= 4) return ACHIEVEMENT_LEVELS.TOP4;
    return ACHIEVEMENT_LEVELS.PLAYED;
  };

  const buildChampionBestResults = useCallback((matches: ArenaMatch[]): Map<string, number> => {
    const bestByChampion = new Map<string, number>();
    
    for (const match of matches) {
      const nameKey = normalizeChampionName(match.info.championName);
      const level = calculateChampionLevel(match.info.placement);
      const previousLevel = bestByChampion.get(nameKey) ?? 0;
      
      if (level > previousLevel) {
        bestByChampion.set(nameKey, level);
      }
    }
    
    return bestByChampion;
  }, []);

  // =============================================================================
  // Component Event Handlers
  // =============================================================================

  // Auto-sync checklist with current match history
  const autoSyncChecklist = useCallback((matches: ArenaMatchesData) => {
    if (!onApplyChampionUpdates || !matches.arenaMatches.length) {
      return;
    }

    console.log('🔄 Auto-syncing checklist with filtered matches...');
    
    // Build the best result per champion from current filtered matches
    const bestByChampion = buildChampionBestResults(matches.arenaMatches);

    // Update champions based on filtered match history
    onApplyChampionUpdates(prev => {
      return prev.map(champ => {
        const key = normalizeChampionName(champ.name);
        const target = bestByChampion.get(key) ?? 0;
        
        // Set checklist based on best achievement in filtered matches
        const checklist = { 
          played: target >= ACHIEVEMENT_LEVELS.PLAYED, 
          top4: target >= ACHIEVEMENT_LEVELS.TOP4, 
          win: target >= ACHIEVEMENT_LEVELS.WIN
        };
        
        return { ...champ, checklist };
      });
    });

    console.log(`✅ Auto-synced checklist: ${bestByChampion.size} champions from filtered matches`);
  }, [onApplyChampionUpdates, buildChampionBestResults]);

  // Handle filtered match search
  const handleFilteredSearch = useCallback(async (filters: FilterOptions) => {
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
          const data = await fetchFilteredMatches(account.puuid, {}, MAX_UNFILTERED_MATCHES);

          if (data.success && data.matches) {
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
        
        return;
      }
      
      const data = await fetchFilteredMatches(account.puuid, filters);

      if (data.success && data.matches) {
        const transformedMatches = {
          arenaMatches: data.matches,
          totalChecked: data.totalMatches || 0,
          arenaCount: data.totalMatches || 0
        };

        setArenaMatches(transformedMatches);
        
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
  }, [account?.puuid, autoSyncChecklist, fetchFilteredMatches]);

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
      let currentAccount: RiotAccount;
      
      // If we have saved player data with puuid, use it directly
      if (playerData?.puuid) {
        currentAccount = {
          puuid: playerData.puuid,
          gameName: playerData.gameName,
          tagLine: playerData.tagLine,
        };
        setAccount(currentAccount);
      } else {
        // Step 1: Get PUUID from Riot ID
        currentAccount = await fetchRiotAccount(searchGameName, searchTagLine);
        
        setAccount(currentAccount);
        
        // Save player data for future visits
        const playerDataToSave: StoredPlayerData = {
          gameName: currentAccount.gameName,
          tagLine: currentAccount.tagLine,
          puuid: currentAccount.puuid,
          savedAt: Date.now(),
        };
        LocalStorageManager.setPlayerData(playerDataToSave);
      }
      
      
      // Step 2: Fetch match history and save Arena matches to database
      const searchType = playerData ? 'Auto-search' : 'Manual search';
      console.log(`🚀 ${searchType}: Fetching match history for ${currentAccount.gameName}#${currentAccount.tagLine}`);
      
      // First get match history
      const historyData = await fetchMatchHistory(currentAccount.puuid, DEFAULT_MATCH_COUNT);

      // Check if we have new matches to process
      let detailsData;
      if (historyData.newMatchIds && historyData.newMatchIds.length > 0) {
        console.log(`📥 Processing ${historyData.newMatchIds.length} new matches only`);
        
        // Only fetch details for NEW matches to avoid "already exists" messages
        await fetchMatchDetails(currentAccount.puuid, historyData.newMatchIds, true);
        
        console.log(`✅ Successfully processed ${historyData.newMatchIds.length} new matches`);
        
        // Check if we have cached match data to avoid second API call
        if (historyData.matches && historyData.matches.length > 0) {
          console.log(`✅ Using ${historyData.matches.length} cached matches from API response`);
          detailsData = {
            success: true,
            matches: historyData.matches,
            processed: historyData.matches.length,
            arenaMatches: historyData.matches.length
          };
        } else {
          // Fallback: fetch ALL match details (new + cached) for UI display
          console.log(`🔄 Fetching all ${historyData.matchIds.length} matches for UI display`);
          detailsData = await fetchMatchDetails(currentAccount.puuid, historyData.matchIds);
        }
      } else if (historyData.matches && historyData.matches.length > 0) {
        // We have complete cached match data, no need to fetch details
        console.log(`✅ Using ${historyData.matches.length} cached matches with complete data.`);
        detailsData = {
          success: true,
          matches: historyData.matches,
          processed: historyData.matches.length,
          arenaMatches: historyData.matches.length
        };
      } else if (historyData.matchIds && historyData.matchIds.length > 0) {
        // Fetch match details for the matches (fallback case)
        console.log(`🔄 Fetching match details for ${historyData.matchIds.length} matches`);
        detailsData = await fetchMatchDetails(currentAccount.puuid, historyData.matchIds, true);
      } else {
        // No matches found
        console.log(`ℹ️ No Arena matches found for this account`);
        detailsData = {
          success: false,
          matches: [],
          processed: 0,
          arenaMatches: 0
        };
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
  }, [gameName, tagLine, autoSyncChecklist, fetchRiotAccount, fetchMatchHistory, fetchMatchDetails]);

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
        
        try {
          // Use the same performSearch function for consistency
          await performSearch(savedPlayer);
        } catch (err) {
          console.error('Auto-search failed:', err);
          setError(err instanceof Error ? err.message : 'Auto-search failed');
          // If auto-search fails, show inputs and clear saved data
          setShowInputs(true);
          setIsExpanded(true);
          LocalStorageManager.clearPlayerData();
        } finally {
          setIsAutoSearching(false);
        }
      }
    };

    loadSavedPlayer();
  }, [hasAutoSearched, isAutoSearching, isLoading, performSearch]); // Include performSearch dependency

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
                <span className="text-gray-400 text-sm pl-8 hidden md:inline">Search for your last {DEFAULT_MATCH_COUNT} arena matches and apply the results to the tracker</span>
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
