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
} as const;

const ARENA_GAME_MODE = 'CHERRY';
const DEFAULT_REGION = 'americas';
const MATCH_API_REGION = 'europe'; // Use Europe for match data

type RiotRegion = keyof typeof RIOT_API_REGIONS;

/**
 * Service class for interacting with Riot Games API
 */
export class RiotApiService {
  private readonly apiKey: string;
  private readonly accountApiBaseUrl: string;

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
   * Get account information by Riot ID
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    const endpoint = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const url = `${this.accountApiBaseUrl}${endpoint}`;
    
    return this.makeRequest<RiotAccount>(url);
  }

  /**
   * Get match history for a player
   */
  async getMatchHistory(params: MatchHistoryParams): Promise<string[]> {
    const { puuid, start = 0, count = 20, queue } = params;
    
    const baseUrl = this.getRegionalUrl(MATCH_API_REGION);
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
  async getMatchDetails(matchId: string): Promise<MatchDetails> {
    const baseUrl = this.getRegionalUrl(MATCH_API_REGION);
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
   */
  async getArenaMatchDetails(matchIds: string[]): Promise<MatchDetails[]> {
    const arenaMatches: MatchDetails[] = [];
    
    for (const matchId of matchIds) {
      try {
        const matchDetails = await this.getMatchDetails(matchId);
        
        if (RiotApiService.isArenaMatch(matchDetails)) {
          arenaMatches.push(matchDetails);
        }
      } catch (error) {
        // Log error but continue processing other matches
        console.warn(`Failed to fetch details for match ${matchId}:`, error);
      }
    }
    
    return arenaMatches;
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
