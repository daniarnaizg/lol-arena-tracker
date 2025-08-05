"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface MatchHistoryData {
  matchIds: string[];
  count: number;
  puuid: string;
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
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ className = '' }) => {
  const [riotId, setRiotId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<RiotAccount | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryData | null>(null);
  const [arenaMatches, setArenaMatches] = useState<ArenaMatchesData | null>(null);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [isFetchingArenaDetails, setIsFetchingArenaDetails] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!riotId.trim()) {
      setError('Please enter your Riot ID');
      return;
    }

    // Validate format (should contain #)
    if (!riotId.includes('#')) {
      setError('Riot ID should be in format: GameName#TagLine');
      return;
    }

    const [gameName, tagLine] = riotId.split('#');
    if (!gameName.trim() || !tagLine.trim()) {
      setError('Both Game Name and Tag Line are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAccount(null);
    setMatchHistory(null);
    setArenaMatches(null);

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

      // Log PUUID to console as requested
      console.log('PUUID for', riotId, ':', accountData.account.puuid);
      
      setAccount(accountData.account);
      
      // Step 2: Fetch match history using the PUUID
      setIsFetchingMatches(true);
      
      const matchResponse = await fetch('/api/match-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puuid: accountData.account.puuid,
          count: 20, // Get last 20 matches to find Arena games
          // queue: 1700, // Uncomment to filter only Arena matches at API level
        }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok) {
        throw new Error(matchData.error || 'Failed to fetch match history');
      }

      console.log('Match IDs for', riotId, ':', matchData.matchIds);
      setMatchHistory(matchData);
      setIsFetchingMatches(false);
      
      // Step 3: Fetch Arena match details only
      if (matchData.matchIds && matchData.matchIds.length > 0) {
        setIsFetchingArenaDetails(true);
        
        console.log('=== REQUESTING ARENA MATCHES ===');
        console.log('Match IDs to send:', matchData.matchIds);
        console.log('Number of match IDs:', matchData.matchIds.length);
        
        const arenaResponse = await fetch('/api/arena-matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchIds: matchData.matchIds,
            maxMatches: 10, // Limit to avoid rate limits
          }),
        });

        console.log('Arena API response status:', arenaResponse.status);
        const arenaData = await arenaResponse.json();
        console.log('Arena API response data:', arenaData);

        if (!arenaResponse.ok) {
          throw new Error(arenaData.error || 'Failed to fetch Arena match details');
        }

        console.log('Arena matches for', riotId, ':', arenaData.arenaMatches);
        setArenaMatches(arenaData);
      } else {
        console.log('No match IDs to process for Arena matches');
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsFetchingMatches(false);
      setIsFetchingArenaDetails(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 text-sm">📊</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Match History</h2>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">
        Enter your Riot ID to connect your League of Legends account and track your Arena match history.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="riot-id" className="block text-sm font-medium text-gray-700 mb-2">
            Riot ID
          </label>
          <input
            id="riot-id"
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="GameName#TagLine"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: Player#EUW or YourName#NA1
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading || isFetchingMatches || isFetchingArenaDetails}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all duration-200
            ${isLoading || isFetchingMatches || isFetchingArenaDetails
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
            }
            text-white
          `}
          whileTap={!(isLoading || isFetchingMatches || isFetchingArenaDetails) ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Looking up account...
            </div>
          ) : isFetchingMatches ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Fetching match history...
            </div>
          ) : isFetchingArenaDetails ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing Arena matches...
            </div>
          ) : (
            'Connect Account'
          )}
        </motion.button>
      </form>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Account Information */}
      {account && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <h3 className="text-green-800 font-medium mb-2">Account Connected</h3>
          <div className="text-sm text-green-700">
            <p><strong>Riot ID:</strong> {account.gameName}#{account.tagLine}</p>
            <p><strong>PUUID:</strong> <code className="bg-green-100 px-1 rounded text-xs">{account.puuid}</code></p>
          </div>
        </motion.div>
      )}

      {/* Match History */}
      {matchHistory && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h3 className="text-blue-800 font-medium mb-2">
            All Match History ({matchHistory.count} matches)
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {matchHistory.matchIds.map((matchId, index) => (
              <div key={matchId} className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                <span className="font-mono text-xs">{index + 1}. {matchId}</span>
              </div>
            ))}
          </div>
          {matchHistory.count === 0 && (
            <p className="text-blue-600 text-sm">No recent matches found for this account.</p>
          )}
        </motion.div>
      )}

      {/* Arena Matches */}
      {arenaMatches && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg"
        >
          <h3 className="text-purple-800 font-medium mb-2">
            🏟️ Arena Matches ({arenaMatches.arenaCount} of {arenaMatches.totalChecked} matches)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {arenaMatches.arenaMatches.length > 0 ? (
              arenaMatches.arenaMatches.map((match, index) => {
                const userParticipant = match.info.participants.find(p => p.puuid === account?.puuid);
                const matchDate = new Date(match.info.gameEndTimestamp).toLocaleDateString();
                const matchDuration = Math.round(match.info.gameDuration / 60); // Convert to minutes
                
                return (
                  <div key={match.metadata.matchId} className="bg-purple-100 p-3 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-purple-800">
                        Arena Match #{index + 1}
                      </div>
                      <div className="text-xs text-purple-600">{matchDate}</div>
                    </div>
                    
                    {userParticipant && (
                      <div className="text-sm text-purple-700 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{userParticipant.championName}</span>
                          <span className="bg-purple-200 px-2 py-1 rounded text-xs">
                            Placement: #{userParticipant.placement}
                          </span>
                          {userParticipant.win && (
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                              🏆 Win
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-purple-600 grid grid-cols-2 gap-2">
                      <span>Duration: {matchDuration}m</span>
                      <span>Players: {match.info.participants.length}</span>
                    </div>
                    
                    <details className="mt-2">
                      <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
                        Match ID
                      </summary>
                      <code className="text-xs bg-purple-200 p-1 rounded block mt-1">
                        {match.metadata.matchId}
                      </code>
                    </details>
                  </div>
                );
              })
            ) : (
              <p className="text-purple-600 text-sm">
                No Arena matches found in recent match history.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
