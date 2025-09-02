/**
 * Riot Games API Service
 * Provides access to Riot API endpoints for League of Legends data
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

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
    gameVersion: string;
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

export interface ArenaMatch {
  metadata: {
    matchId: string;
  };
  info: {
    gameCreation: number;
    gameEndTimestamp: number;
    gameVersion: string;
    championName: string;
    placement: number;
    win: boolean;
  };
}

export interface ArenaMatchResult {
  arenaMatches: ArenaMatch[];
  totalChecked: number;
}

// =============================================================================
// Constants and Configuration
// =============================================================================

const RIOT_API_REGIONS = {
  americas: 'https://americas.api.riotgames.com',
  asia: 'https://asia.api.riotgames.com',
  europe: 'https://europe.api.riotgames.com',
  sea: 'https://sea.api.riotgames.com',
} as const;

const ARENA_QUEUE_ID = 1700;
const DEFAULT_REGION = 'americas';
const REGION_PRIORITY: RiotRegion[] = ['americas', 'europe', 'asia', 'sea'];

type RiotRegion = keyof typeof RIOT_API_REGIONS;

/**
 * Gets the Arena season start timestamp from environment variable
 * Falls back to a safe default if not provided or invalid
 */
const getSeasonStartTimestamp = (): number => {
  const dateStr = process.env.ARENA_SEASON_START_DATE;
  const defaultTimestamp = new Date('2023-01-01T00:00:00Z').getTime();
  
  if (!dateStr) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('ARENA_SEASON_START_DATE env variable not set. Using default: 2023-01-01.');
    }
    return defaultTimestamp;
  }
  
  const timestamp = new Date(`${dateStr}T00:00:00Z`).getTime();
  
  if (isNaN(timestamp)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Invalid date format for ARENA_SEASON_START_DATE: "${dateStr}". Using default: 2023-01-01.`);
    }
    return defaultTimestamp;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Arena season filtering enabled from: ${dateStr}`);
  }
  
  return timestamp;
};

const CURRENT_ARENA_SEASON_START_TIMESTAMP = getSeasonStartTimestamp();

// =============================================================================
// Custom Error Classes
// =============================================================================

export class RiotApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'RiotApiError';
  }
}

export class RegionDetectionError extends RiotApiError {
  constructor(puuid: string) {
    super(`Failed to detect region for PUUID: ${puuid}`, 404);
    this.name = 'RegionDetectionError';
  }
}

// =============================================================================
// Service Implementation
// =============================================================================

/**
 * Service class for interacting with Riot Games API
 * Handles authentication, region detection, and data fetching
 */
export class RiotApiService {
  private readonly apiKey: string;
  private readonly accountApiBaseUrl: string;
  private readonly regionCache = new Map<string, RiotRegion>();

  constructor() {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      throw new Error('RIOT_API_KEY environment variable is required');
    }
    
    this.apiKey = apiKey;
    this.accountApiBaseUrl = RIOT_API_REGIONS[DEFAULT_REGION];
  }

  // =============================================================================
  // Private Utility Methods
  // =============================================================================

  /**
   * Get regional API URL for a specific region
   */
  private getRegionalUrl(region: RiotRegion = DEFAULT_REGION): string {
    return RIOT_API_REGIONS[region];
  }

  /**
   * Make an authenticated request to the Riot API with proper error handling
   */
  private async makeRequest<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new RiotApiError(
          `Riot API request failed: ${errorText}`,
          response.status
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof RiotApiError) {
        throw error;
      }
      throw new RiotApiError(
        'Network error occurred while making request to Riot API',
        500,
        error
      );
    }
  }

  /**
   * Detect the correct region for match data by trying regions in priority order
   */
  private async detectMatchRegion(puuid: string): Promise<RiotRegion> {
    // Check cache first
    const cachedRegion = this.regionCache.get(puuid);
    if (cachedRegion) {
      return cachedRegion;
    }

    // Try each region in priority order
    for (const region of REGION_PRIORITY) {
      try {
        const baseUrl = this.getRegionalUrl(region);
        const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`;
        const url = `${baseUrl}${endpoint}`;
        
        const matches = await this.makeRequest<string[]>(url);
        
        if (Array.isArray(matches) && matches.length > 0) {
          this.regionCache.set(puuid, region);
          return region;
        }
      } catch {
        // Continue to next region if this one fails
        continue;
      }
    }

    // If all regions fail, cache and return default
    const defaultRegion: RiotRegion = DEFAULT_REGION;
    this.regionCache.set(puuid, defaultRegion);
    return defaultRegion;
  }

  /**
   * Transform match details into simplified Arena match format
   */
  private transformToArenaMatch(
    matchDetails: MatchDetails,
    userPuuid: string
  ): ArenaMatch | null {
    const userParticipant = matchDetails.info.participants.find(
      p => p.puuid === userPuuid
    );

    if (!userParticipant) {
      return null;
    }

    return {
      metadata: {
        matchId: matchDetails.metadata.matchId,
      },
      info: {
        gameCreation: matchDetails.info.gameCreation,
        gameEndTimestamp: matchDetails.info.gameEndTimestamp,
        gameVersion: matchDetails.info.gameVersion,
        championName: userParticipant.championName,
        placement: userParticipant.placement,
        win: userParticipant.placement === 1,
      }
    };
  }

  /**
   * Check if a match is within the current Arena season
   */
  private isMatchInCurrentSeason(gameCreation: number): boolean {
    return gameCreation >= CURRENT_ARENA_SEASON_START_TIMESTAMP;
  }

  // =============================================================================
  // Public API Methods
  // =============================================================================

  /**
   * Get account information by Riot ID
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    if (!gameName?.trim() || !tagLine?.trim()) {
      throw new RiotApiError('Both gameName and tagLine are required', 400);
    }

    const endpoint = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName.trim())}/${encodeURIComponent(tagLine.trim())}`;
    const url = `${this.accountApiBaseUrl}${endpoint}`;
    
    try {
      const account = await this.makeRequest<RiotAccount>(url);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Account found: ${account.gameName}#${account.tagLine} (PUUID: ${account.puuid})`);
      }
      
      return account;
    } catch (error) {
      if (error instanceof RiotApiError && error.statusCode === 404) {
        throw new RiotApiError('Riot ID not found', 404, error);
      }
      throw error;
    }
  }

  /**
   * Get Arena match history directly using queue filter
   */
  async getArenaMatchHistory(params: {
    puuid: string;
    start?: number;
    count?: number;
    startTime?: number; // Unix timestamp in seconds
    endTime?: number;   // Unix timestamp in seconds
  }): Promise<string[]> {
    const { puuid, start = 0, count = 30, startTime, endTime } = params;
    
    if (!puuid?.trim()) {
      throw new RiotApiError('PUUID is required', 400);
    }

    const matchRegion = await this.detectMatchRegion(puuid);
    const baseUrl = this.getRegionalUrl(matchRegion);
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      start: start.toString(),
      count: count.toString(),
      queue: ARENA_QUEUE_ID.toString(),
    });
    
    // Add time filters if provided
    if (startTime) {
      queryParams.append('startTime', startTime.toString());
    }
    if (endTime) {
      queryParams.append('endTime', endTime.toString());
    }
    
    const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?${queryParams.toString()}`;
    const url = `${baseUrl}${endpoint}`;
    
    const arenaMatchIds = await this.makeRequest<string[]>(url);
    
    if (process.env.NODE_ENV === 'development') {
      const timeFilter = startTime ? ` (after ${new Date(startTime * 1000).toISOString()})` : '';
      console.log(`Found ${arenaMatchIds.length} Arena match IDs for PUUID: ${puuid}${timeFilter}`);
    }
    
    return arenaMatchIds;
  }

  /**
   * Get detailed information for a specific match
   */
  async getMatchDetails(matchId: string, region?: RiotRegion): Promise<MatchDetails> {
    if (!matchId?.trim()) {
      throw new RiotApiError('Match ID is required', 400);
    }

    const matchRegion = region;
    
    if (!matchRegion) {
      // Try regions in priority order for backwards compatibility
      for (const tryRegion of REGION_PRIORITY) {
        try {
          const baseUrl = this.getRegionalUrl(tryRegion);
          const endpoint = `/lol/match/v5/matches/${matchId}`;
          const url = `${baseUrl}${endpoint}`;
          
          return await this.makeRequest<MatchDetails>(url);
        } catch {
          continue;
        }
      }
      throw new RiotApiError(`Match ${matchId} not found in any region`, 404);
    }

    const baseUrl = this.getRegionalUrl(matchRegion);
    const endpoint = `/lol/match/v5/matches/${matchId}`;
    const url = `${baseUrl}${endpoint}`;
    
    return this.makeRequest<MatchDetails>(url);
  }

  /**
   * Get Arena match details with comprehensive filtering and processing
   * This is the main method for fetching Arena matches with full details
   */
  async getArenaMatchDetails(params: {
    puuid: string;
    start?: number;
    count?: number;
  }): Promise<ArenaMatchResult> {
    const { puuid, start = 0, count = 30 } = params;
    
    if (!puuid?.trim()) {
      throw new RiotApiError('PUUID is required', 400);
    }

    const startTime = process.env.NODE_ENV === 'development' ? Date.now() : 0;

    try {
      // Step 1: Get Arena match IDs directly using queue filter
      const arenaMatchIds = await this.getArenaMatchHistory({ puuid, start, count });
      
      if (arenaMatchIds.length === 0) {
        return { arenaMatches: [], totalChecked: 0 };
      }
      
      // Step 2: Get match details and transform to Arena format
      const detectedRegion = await this.detectMatchRegion(puuid);
      const arenaMatches: ArenaMatch[] = [];
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching details for ${arenaMatchIds.length} Arena matches...`);
      }
      
      for (const matchId of arenaMatchIds) {
        try {
          const matchDetails = await this.getMatchDetails(matchId, detectedRegion);
          
          // Filter by season (all matches are already Arena due to queue filter)
          if (this.isMatchInCurrentSeason(matchDetails.info.gameCreation)) {
            const arenaMatch = this.transformToArenaMatch(matchDetails, puuid);
            
            if (arenaMatch) {
              arenaMatches.push(arenaMatch);
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`Arena match ${arenaMatches.length}/${arenaMatchIds.length}: ${matchId} (${arenaMatch.info.championName}, place ${arenaMatch.info.placement})`);
              }
            } else {
              console.warn(`User not found in match ${matchId} participants`);
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Skipped old Arena match: ${matchId} (before season start)`);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch details for Arena match ${matchId}:`, error);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`Found ${arenaMatches.length} current season Arena matches in ${duration}ms`);
      }
      
      return { 
        arenaMatches, 
        totalChecked: arenaMatchIds.length
      };
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in Arena match fetching:', error);
      }
      throw error;
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  /**
   * Clear the region cache (useful for debugging)
   */
  clearRegionCache(): void {
    this.regionCache.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Region cache cleared');
    }
  }

  /**
   * Get current region cache status (for debugging)
   */
  getRegionCacheStatus(): Record<string, RiotRegion> {
    const status: Record<string, RiotRegion> = {};
    this.regionCache.forEach((region, puuid) => {
      status[puuid] = region;
    });
    return status;
  }

  // =============================================================================
  // Static Utility Methods
  // =============================================================================

  /**
   * Get Arena queue ID constant
   */
  static getArenaQueueId(): number {
    return ARENA_QUEUE_ID;
  }

  /**
   * Validate and parse Riot ID format (GameName#TagLine)
   */
  static validateRiotId(riotId: string): RiotIdComponents | null {
    if (!riotId?.trim()) {
      return null;
    }

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

// =============================================================================
// Export singleton instance
// =============================================================================

export const riotApiService = new RiotApiService();
