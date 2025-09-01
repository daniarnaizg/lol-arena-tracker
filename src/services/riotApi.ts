/**
 * Riot Games API Service
 * Provides access to Riot API endpoints for League of Legends data
 */

// Types and Interfaces
export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface MatchDetails {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameMode: string;
    gameType: string;
    queueId: number;
    gameDuration: number;
    gameEndTimestamp: number;
    participants: MatchParticipant[];
  };
}

export interface MatchParticipant {
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

export interface MatchHistoryParams {
  puuid: string;
  start?: number;
  count?: number;
  queue?: number;
}

export interface RiotIdComponents {
  gameName: string;
  tagLine: string;
}

// Simplified Arena match data - only what we actually use
export interface ArenaMatch {
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

// Constants
const RIOT_API_REGIONS = {
  americas: 'https://americas.api.riotgames.com',
  asia: 'https://asia.api.riotgames.com',
  europe: 'https://europe.api.riotgames.com',
  sea: 'https://sea.api.riotgames.com',
} as const;

const ARENA_QUEUE_ID = 1700;
const DEFAULT_REGION = 'americas';

// Read Arena season start date from environment variable (e.g., "2025-08-01")
const getSeasonStartTimestamp = (): number => {
  const dateStr = process.env.ARENA_SEASON_START_DATE;
  if (!dateStr) {
    console.warn('ARENA_SEASON_START_DATE env variable not set. Using default: 2023-01-01.');
    // Default to a safe, far-past date to include all matches if not specified
    return new Date('2023-01-01T00:00:00Z').getTime();
  }
  // Append time and timezone to ensure parsing in UTC
  const timestamp = new Date(`${dateStr}T00:00:00Z`).getTime();

  if (isNaN(timestamp)) {
    console.warn(`Invalid date format for ARENA_SEASON_START_DATE: "${dateStr}". Using default: 2023-01-01.`);
    return new Date('2023-01-01T00:00:00Z').getTime();
  }
  
  console.log(`Filtering Arena matches after: ${dateStr}`);
  return timestamp;
};

const CURRENT_ARENA_SEASON_START_TIMESTAMP = getSeasonStartTimestamp();

// Region priority order for trying to find match data
// Order based on player distribution: Americas, Europe, Asia, SEA
const REGION_PRIORITY: RiotRegion[] = ['americas', 'europe', 'asia', 'sea'];

type RiotRegion = keyof typeof RIOT_API_REGIONS;

/**
 * Service class for interacting with Riot Games API
 */
export class RiotApiService {
  private readonly apiKey: string;
  private readonly accountApiBaseUrl: string;
  private regionCache: Map<string, RiotRegion> = new Map(); // Cache successful regions per PUUID

  constructor() {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      throw new Error('RIOT_API_KEY environment variable is required');
    }
    
    this.apiKey = apiKey;
    this.accountApiBaseUrl = RIOT_API_REGIONS[DEFAULT_REGION];
  }

  /**
   * Get regional API URL for a specific region
   */
  private getRegionalUrl(region: RiotRegion = DEFAULT_REGION): string {
    return RIOT_API_REGIONS[region];
  }

  /**
   * Make an authenticated request to the Riot API
   */
  private async makeRequest<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Riot API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Detect the correct region for match data by trying regions in priority order
   */
  private async detectMatchRegion(puuid: string): Promise<RiotRegion> {
    console.log(`🔍 Detecting region for PUUID: ${puuid}`);
    
    // Check if we have a cached region for this PUUID
    const cachedRegion = this.regionCache.get(puuid);
    if (cachedRegion) {
      console.log(`✅ Using cached region for ${puuid}: ${cachedRegion}`);
      return cachedRegion;
    }

    // Try all regions and find one with matches
    for (const region of REGION_PRIORITY) {
      try {
        console.log(`🌍 Trying region: ${region} for PUUID: ${puuid}`);
        const baseUrl = this.getRegionalUrl(region);
        const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`;
        const url = `${baseUrl}${endpoint}`;
        
        const matches = await this.makeRequest<string[]>(url);
        
        if (matches !== null && matches !== undefined && Array.isArray(matches) && matches.length > 0) {
          console.log(`✅ Selected region for ${puuid}: ${region}`);
          this.regionCache.set(puuid, region);
          return region;
        }
      } catch (error) {
        console.log(`❌ Region ${region} failed for PUUID ${puuid}:`, error instanceof Error ? error.message : error);
      }
    }

    // If all regions fail, default to americas
    console.warn(`⚠️ Could not detect region for PUUID ${puuid}, defaulting to americas`);
    const defaultRegion: RiotRegion = 'americas';
    this.regionCache.set(puuid, defaultRegion);
    return defaultRegion;
  }

  /**
   * Clear the region cache (useful for debugging or when needed)
   */
  public clearRegionCache(): void {
    console.log('🗑️ Clearing region cache');
    this.regionCache.clear();
  }

  /**
   * Get current region cache status (for debugging)
   */
  public getRegionCacheStatus(): { [puuid: string]: RiotRegion } {
    const status: { [puuid: string]: RiotRegion } = {};
    this.regionCache.forEach((region, puuid) => {
      status[puuid] = region;
    });
    return status;
  }

  /**
   * Get account information by Riot ID
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    const endpoint = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const url = `${this.accountApiBaseUrl}${endpoint}`;
    
    const account = await this.makeRequest<RiotAccount>(url);
    
    // Try to pre-determine the likely match region based on common patterns
    // This is a heuristic approach to optimize the region detection
    console.log(`🎮 Account found: ${account.gameName}#${account.tagLine} (PUUID: ${account.puuid})`);
    
    return account;
  }

  /**
   * Get match history for a player
   */
  async getMatchHistory(params: MatchHistoryParams): Promise<string[]> {
    const { puuid, start = 0, count = 20, queue } = params;
    
    // Detect the correct region for this player's match data
    const matchRegion = await this.detectMatchRegion(puuid);
    const baseUrl = this.getRegionalUrl(matchRegion);
    
    let endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
    
    if (queue) {
      endpoint += `&queue=${queue}`;
    }

    const url = `${baseUrl}${endpoint}`;
    return this.makeRequest<string[]>(url);
  }

  /**
   * Get Arena match history directly using queue filter
   * This is more efficient than getting all matches and filtering later
   */
  async getArenaMatchHistory(params: {
    puuid: string;
    start?: number;
    count?: number;
  }): Promise<string[]> {
    const { puuid, start = 0, count = 30 } = params;
    
    console.log(`🎯 Fetching Arena matches directly for PUUID: ${puuid} (queue=${ARENA_QUEUE_ID})`);
    
    // Detect the correct region for this player's match data
    const matchRegion = await this.detectMatchRegion(puuid);
    const baseUrl = this.getRegionalUrl(matchRegion);
    
    const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}&queue=${ARENA_QUEUE_ID}`;
    const url = `${baseUrl}${endpoint}`;
    
    const arenaMatchIds = await this.makeRequest<string[]>(url);
    console.log(`✅ Found ${arenaMatchIds.length} Arena match IDs directly from API`);
    
    return arenaMatchIds;
  }

  /**
   * Get detailed information for a specific match
   */
  async getMatchDetails(matchId: string, region?: RiotRegion): Promise<MatchDetails> {
    // If no region provided, try to extract PUUID from context or use default detection
    const matchRegion = region;
    
    if (!matchRegion) {
      // For backwards compatibility, try regions in order
      for (const tryRegion of REGION_PRIORITY) {
        try {
          const baseUrl = this.getRegionalUrl(tryRegion);
          const endpoint = `/lol/match/v5/matches/${matchId}`;
          const url = `${baseUrl}${endpoint}`;
          
          return await this.makeRequest<MatchDetails>(url);
        } catch {
          // Continue to next region
          continue;
        }
      }
      throw new Error(`Match ${matchId} not found in any region`);
    }

    const baseUrl = this.getRegionalUrl(matchRegion);
    const endpoint = `/lol/match/v5/matches/${matchId}`;
    const url = `${baseUrl}${endpoint}`;
    
    return this.makeRequest<MatchDetails>(url);
  }

  /**
   * Get Arena queue ID constant
   */
  static getArenaQueueId(): number {
    return ARENA_QUEUE_ID;
  }

  /**
   * Get Arena match details using direct queue filtering
   * Uses queue=1700 to get Arena matches directly - no filtering needed!
   * Returns simplified match data with only essential information
   */
  async getArenaMatchDetails(params: {
    puuid: string;
    start?: number;
    count?: number;
  }): Promise<{ arenaMatches: ArenaMatch[]; totalChecked: number }> {
    const { puuid, start = 0, count = 30 } = params;
    
    console.log(`🚀 Getting Arena matches for PUUID: ${puuid}`);
    console.time('ArenaMatches');
    
    try {
      // Step 1: Get Arena match IDs directly using queue filter
      const arenaMatchIds = await this.getArenaMatchHistory({ puuid, start, count });
      
      if (arenaMatchIds.length === 0) {
        console.log('🚫 No Arena matches found');
        console.timeEnd('ArenaMatches');
        return { arenaMatches: [], totalChecked: 0 };
      }
      
      // Step 2: Get match details for all Arena matches and simplify data
      const detectedRegion = await this.detectMatchRegion(puuid);
      const arenaMatches: ArenaMatch[] = [];
      
      console.log(`📥 Fetching details for ${arenaMatchIds.length} Arena matches...`);
      
      for (const matchId of arenaMatchIds) {
        try {
          const matchDetails = await this.getMatchDetails(matchId, detectedRegion);
          
          // Only filter by season start date - all matches are already Arena matches due to queue filter
          if (matchDetails.info.gameCreation >= CURRENT_ARENA_SEASON_START_TIMESTAMP) {
            // Find the user's participant data
            const userParticipant = matchDetails.info.participants.find(p => p.puuid === puuid);
            
            if (userParticipant) {
              // Create simplified arena match data
              const simplifiedMatch: ArenaMatch = {
                metadata: {
                  matchId: matchDetails.metadata.matchId,
                },
                info: {
                  gameCreation: matchDetails.info.gameCreation,
                  gameEndTimestamp: matchDetails.info.gameEndTimestamp,
                  championName: userParticipant.championName,
                  placement: userParticipant.placement,
                  win: userParticipant.placement === 1,
                }
              };
              
              arenaMatches.push(simplifiedMatch);
              console.log(`✅ Arena match ${arenaMatches.length}/${arenaMatchIds.length}: ${matchId} (${userParticipant.championName}, place ${userParticipant.placement})`);
            } else {
              console.warn(`⚠️ User not found in match ${matchId} participants`);
            }
          } else {
            console.log(`⏰ Skipped old Arena match: ${matchId} (before season start)`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch details for Arena match ${matchId}:`, error);
        }
      }
      
      console.log(`🏁 Final result: ${arenaMatches.length} current season Arena matches`);
      console.timeEnd('ArenaMatches');
      
      return { 
        arenaMatches, 
        totalChecked: arenaMatchIds.length // All checked matches were Arena matches
      };
      
    } catch (error) {
      console.error('❌ Error in Arena match fetching:', error);
      console.timeEnd('ArenaMatches');
      throw error;
    }
  }

  /**
   * Validate and parse Riot ID format (GameName#TagLine)
   */
  static validateRiotId(riotId: string): RiotIdComponents | null {
    const trimmedId = riotId.trim();
    const match = trimmedId.match(/^(.+)#(.+)$/);
    
    if (!match) {
      return null;
    }

    const [, gameName, tagLine] = match;
    const trimmedGameName = gameName.trim();
    const trimmedTagLine = tagLine.trim();
    
    if (!trimmedGameName || !trimmedTagLine) {
      return null;
    }

    return { 
      gameName: trimmedGameName, 
      tagLine: trimmedTagLine 
    };
  }
}

// Export singleton instance
export const riotApiService = new RiotApiService();
