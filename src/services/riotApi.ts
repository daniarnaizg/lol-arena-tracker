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

// Constants
const RIOT_API_REGIONS = {
  americas: 'https://americas.api.riotgames.com',
  asia: 'https://asia.api.riotgames.com',
  europe: 'https://europe.api.riotgames.com',
  sea: 'https://sea.api.riotgames.com',
} as const;

const ARENA_GAME_MODE = 'CHERRY';
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

    const validRegions: { region: RiotRegion; matchCount: number }[] = [];

    // Try all regions and collect successful responses
    for (const region of REGION_PRIORITY) {
      try {
        console.log(`🌍 Trying region: ${region} for PUUID: ${puuid}`);
        const baseUrl = this.getRegionalUrl(region);
        const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;
        const url = `${baseUrl}${endpoint}`;
        
        const matches = await this.makeRequest<string[]>(url);
        
        if (matches !== null && matches !== undefined && Array.isArray(matches)) {
          console.log(`📊 Region ${region} response for ${puuid}: ${matches.length} matches`);
          validRegions.push({ region, matchCount: matches.length });
        }
      } catch (error) {
        console.log(`❌ Region ${region} failed for PUUID ${puuid}:`, error instanceof Error ? error.message : error);
      }
    }

    // Choose the best region based on match count
    if (validRegions.length > 0) {
      // Sort by match count (descending) and take the region with most matches
      validRegions.sort((a, b) => b.matchCount - a.matchCount);
      const bestRegion = validRegions[0].region;
      
      console.log(`✅ Selected region for ${puuid}: ${bestRegion} (${validRegions[0].matchCount} matches)`);
      console.log(`📈 All valid regions:`, validRegions);
      
      this.regionCache.set(puuid, bestRegion);
      return bestRegion;
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
   * Check if a match is an Arena match
   */
  static isArenaMatch(matchDetails: MatchDetails): boolean {
    return matchDetails.info.gameMode === ARENA_GAME_MODE;
  }

  /**
   * Get Arena match details from a list of match IDs
   * Filters out non-Arena matches and returns only Arena game data
   * Optimized to use the same region for all matches from the same player
   * Now supports early stopping when desired number of Arena matches is found
   */
  async getArenaMatchDetails(
    matchIds: string[], 
    puuid?: string, 
    maxArenaMatches?: number
  ): Promise<{ arenaMatches: MatchDetails[]; totalChecked: number }> {
    const arenaMatches: MatchDetails[] = [];
    const limit = maxArenaMatches || matchIds.length;
    let totalChecked = 0;
    
    // If we have a PUUID, detect the region once and reuse it
    let detectedRegion: RiotRegion | undefined;
    if (puuid) {
      try {
        detectedRegion = await this.detectMatchRegion(puuid);
      } catch {
        console.warn('Failed to detect region for PUUID, will try all regions per match');
      }
    }
    
    for (const matchId of matchIds) {
      // Stop early if we've found enough Arena matches
      if (arenaMatches.length >= limit) {
        console.log(`✅ Found ${limit} Arena matches, stopping early (checked ${totalChecked} matches)`);
        break;
      }
      
      try {
        totalChecked++;
        const matchDetails = await this.getMatchDetails(matchId, detectedRegion);
        
        // Check if it's an Arena match from the current season
        if (RiotApiService.isArenaMatch(matchDetails) && matchDetails.info.gameCreation >= CURRENT_ARENA_SEASON_START_TIMESTAMP) {
          arenaMatches.push(matchDetails);
          console.log(`🎯 Current season Arena match found: ${matchId} (${arenaMatches.length}/${limit})`);
        }
      } catch (error) {
        // Log error but continue processing other matches
        console.warn(`Failed to fetch details for match ${matchId}:`, error);
      }
    }
    
    console.log(`📊 Final result: ${arenaMatches.length} Arena matches found after checking ${totalChecked} matches`);
    return { arenaMatches, totalChecked };
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
