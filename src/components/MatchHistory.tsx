"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArenaMatchCard } from './ui/ArenaMatchCard';

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
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ className = '', onChampionSearch }) => {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [arenaMatches, setArenaMatches] = useState<ArenaMatchesData | null>(null);
  const [showInputs, setShowInputs] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!gameName.trim() || !tagLine.trim()) {
      setError('Please enter both Game Name and Tag Line');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get PUUID from Riot ID
      const accountResponse = await fetch('/api/riot-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameName: gameName.trim(),
          tagLine: tagLine.trim(),
        }),
      });

      const accountData = await accountResponse.json();

      if (!accountResponse.ok) {
        throw new Error(accountData.error || 'Failed to fetch account');
      }
      
      setAccount(accountData.account);
      
      // Step 2: Fetch match history (increased to 50 matches to find more Arena games)
      const matchResponse = await fetch('/api/match-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid: accountData.account.puuid,
          count: 50, // Increased from 20 to 50 to get more matches
        }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok) {
        throw new Error(matchData.error || 'Failed to fetch match history');
      }
      
      // Step 3: Fetch Arena match details (get up to 15 Arena matches from the 50 recent matches)
      if (matchData.matchIds && matchData.matchIds.length > 0) {
        const arenaResponse = await fetch('/api/arena-matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchIds: matchData.matchIds,
            maxMatches: 13, // Get up to 13 Arena matches
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    handleSubmit();
  };

  const handleBack = () => {
    setShowInputs(true);
    setArenaMatches(null);
    setAccount(null);
    setError(null);
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
            className={`p-6 ${!isExpanded ? 'pb-6' : ''}`}
          >
            <div className={`flex items-center justify-between ${isExpanded ? 'mb-4' : ''}`}>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-300">MATCH HISTORY</h2>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimize section" : "Expand section"}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg 
                  className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="sr-only">Game Name</label>
                      <input
                        type="text"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value.toUpperCase())}
                        placeholder="MAMPORRERODEHECA"
                        className="w-full h-12 px-4 py-2 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="sr-only">Tag Line</label>
                      <input
                        type="text"
                        value={tagLine}
                        onChange={(e) => setTagLine(e.target.value.toUpperCase())}
                        placeholder="8888"
                        className="flex-1 px-4 py-2 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
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
            className="p-6"
          >
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-4">
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
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-300">LAST ARENA MATCHES</h2>
                  {account && (
                    <p className="text-m font-semibold text-gray-500 uppercase">{account.gameName}#{account.tagLine}</p>
                  )}
                </div>
              </div>
              
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

            {/* Match history horizontal scroll */}
            {arenaMatches && (
                <div className="overflow-x-auto flex items-center min-h-[90px]">
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
                        <p className="text-sm">No Arena matches found in the last 50 games</p>
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
