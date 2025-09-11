import { NextRequest, NextResponse } from 'next/server';
import { riotApiService, RiotApiService } from '@/services/riotApi';
import { databaseService } from '@/services/database';

// =============================================================================
// Types and Interfaces
// =============================================================================

interface MatchHistoryRequest {
  puuid: string;
  forceRefresh?: boolean;
}

interface CachedMatchData {
  matchId: string;
  championName: string;
  placement: number;
  win: boolean;
  gameCreation: number;
  gameEndTimestamp: number;
}

interface MatchHistoryResponse {
  success: boolean;
  matchIds: string[];
  count: number;
  puuid: string;
  queue: number;
  arenaOnly: boolean;
  fromDatabase: boolean;
  userId?: number | null;
  lastMatchTimestamp?: number | null;
  newMatchIds?: string[]; // Array of new match IDs for processing (same as matchIds when using timestamp filtering)
  matches?: CachedMatchData[]; // Complete match data when returning cached matches
  error?: string;
}

interface ErrorResponse {
  error: string;
}

interface DatabaseUser {
  id: number;
  puuid: string;
  game_name: string;
  tag_line: string;
  region: string;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates the incoming request body
 */
function validateRequest(body: unknown): { isValid: boolean; error?: string; data?: MatchHistoryRequest } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const requestBody = body as Record<string, unknown>;
  const { puuid, forceRefresh = false } = requestBody;

  if (!puuid || typeof puuid !== 'string' || !puuid.trim()) {
    return { isValid: false, error: 'PUUID is required and must be a non-empty string' };
  }

  if (typeof forceRefresh !== 'boolean') {
    return { isValid: false, error: 'ForceRefresh must be a boolean' };
  }

  return {
    isValid: true,
    data: {
      puuid: puuid.trim(),
      forceRefresh
    }
  };
}

// =============================================================================
// Database Operations
// =============================================================================

/**
 * Safely retrieves user from database
 */
async function getUserFromDatabase(puuid: string): Promise<{ user: DatabaseUser | null; error?: string }> {
  try {
    const user = await databaseService.findUserByPuuid(puuid);
    return { user };
  } catch (error) {
    console.error('Database user lookup error:', error);
    return { 
      user: null, 
      error: 'Database lookup failed'
    };
  }
}

/**
 * Gets match history from ARENA_SEASON_START_DATE onwards - simple and straightforward
 */
async function getMatchHistoryWithTimestampFilter(
  user: DatabaseUser, 
  puuid: string
): Promise<MatchHistoryResponse> {
  const lastMatchTimestamp = databaseService.getUserLastMatchTimestamp(user);
  
  try {
    // Get the arena season start date from environment variable
    const arenaSeasonStart = process.env.ARENA_SEASON_START_DATE || '2025-01-01';
    const seasonStartDate = new Date(arenaSeasonStart);
    const seasonStartTimestamp = Math.floor(seasonStartDate.getTime() / 1000);
    
    console.log(`🎯 Fetching matches from Arena season start: ${arenaSeasonStart} (${seasonStartDate.toISOString()})`);
    
    // For existing users with matches, use their last match timestamp
    // For new users, use the season start date
    const existingMatches = await databaseService.findArenaMatches(user.id);
    const hasExistingMatches = existingMatches.length > 0;
    
    const startTime = hasExistingMatches 
      ? lastMatchTimestamp || seasonStartTimestamp 
      : seasonStartTimestamp;
    
    console.log(`📅 Using startTime: ${new Date(startTime * 1000).toISOString()} (${hasExistingMatches ? 'last match' : 'season start'})`);
    
    // Fetch matches from the start time onwards with maximum count
    const matchIds = await riotApiService.getArenaMatchHistory({
      puuid,
      start: 0,
      count: 100, // Use maximum count instead of default 20
      startTime: startTime,
    });
    
    console.log(`📥 Found ${matchIds.length} matches since ${new Date(startTime * 1000).toISOString()}`);
    
    if (matchIds.length > 0) {
      // Get ALL existing matches from database (both old and new)
      const allCachedMatches = await databaseService.findArenaMatches(user.id);
      const allCachedMatchIds = allCachedMatches.map(match => match.match_id);
      
      // Transform ALL cached matches to the format expected by the UI
      const allCachedMatchData = allCachedMatches.map(match => ({
        matchId: match.match_id,
        championName: match.champion_name,
        placement: match.placement,
        win: match.win,
        gameCreation: match.game_creation_timestamp,
        gameEndTimestamp: match.game_end_timestamp,
      }));
      
      // Return new matches for processing AND all matches for display
      return {
        success: true,
        matchIds: allCachedMatchIds, // All match IDs (for fallback)
        count: allCachedMatchIds.length, // Total count including existing
        puuid,
        queue: RiotApiService.getArenaQueueId(),
        arenaOnly: true,
        fromDatabase: false,
        userId: user.id,
        lastMatchTimestamp,
        newMatchIds: matchIds, // These are the new matches to process
        matches: allCachedMatchData, // ALL matches for UI display (existing + new)
      };
    } else {
      // No new matches - return cached data
      console.log(`✅ No new matches found since ${new Date(startTime * 1000).toISOString()}`);
      
      const cachedMatches = await databaseService.findArenaMatches(user.id);
      const cachedMatchIds = cachedMatches.map(match => match.match_id);
      
      // Transform cached matches to the format expected by the UI
      const cachedMatchData = cachedMatches.map(match => ({
        matchId: match.match_id,
        championName: match.champion_name,
        placement: match.placement,
        win: match.win,
        gameCreation: match.game_creation_timestamp,
        gameEndTimestamp: match.game_end_timestamp,
      }));
      
      return {
        success: true,
        matchIds: cachedMatchIds,
        count: cachedMatchIds.length,
        puuid,
        queue: RiotApiService.getArenaQueueId(),
        arenaOnly: true,
        fromDatabase: true,
        userId: user.id,
        lastMatchTimestamp,
        matches: cachedMatchData, // Return complete match data for cached matches
        // No newMatchIds - this tells the component not to process details again
      };
    }
  } catch (error) {
    console.error('Error fetching match history with timestamp filter:', error);
    throw error;
  }
}

// =============================================================================
// API Operations
// =============================================================================

/**
 * Fetches fresh match data from ARENA_SEASON_START_DATE onwards
 */
async function getFreshMatchData(
  puuid: string, 
  userId?: number | null
): Promise<MatchHistoryResponse> {
  try {
    // Get the arena season start date from environment variable
    const arenaSeasonStart = process.env.ARENA_SEASON_START_DATE || '2025-01-01';
    const seasonStartDate = new Date(arenaSeasonStart);
    const seasonStartTimestamp = Math.floor(seasonStartDate.getTime() / 1000);
    
    console.log(`� Fetching fresh match data from Arena season start: ${arenaSeasonStart} (${seasonStartDate.toISOString()})`);
    
    // Fetch all matches from season start
    const matchIds = await riotApiService.getArenaMatchHistory({
      puuid,
      start: 0,
      startTime: seasonStartTimestamp,
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${matchIds.length} Arena matches since season start for new user`);
    }
    
    return {
      success: true,
      matchIds: matchIds,
      count: matchIds.length,
      puuid,
      queue: RiotApiService.getArenaQueueId(),
      arenaOnly: true,
      fromDatabase: false,
      userId: userId || null,
      newMatchIds: matchIds, // All matches are new for fresh users
    };
  } catch (error) {
    console.error('Riot Match API Error:', error);
    throw error;
  }
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Creates standardized error responses
 */
function createErrorResponse(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof Error) {
    // Handle specific Riot API errors
    if (error.message.includes('403')) {
      return NextResponse.json(
        { error: 'Riot API key is invalid or expired' },
        { status: 403 }
      );
    }
    
    if (error.message.includes('404')) {
      return NextResponse.json(
        { error: 'No match history found for this account' },
        { status: 404 }
      );
    }
    
    if (error.message.includes('PUUID is required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Failed to fetch match history from Riot API' },
    { status: 500 }
  );
}

// =============================================================================
// Main API Handler
// =============================================================================

/**
 * POST /api/match-history
 * Retrieves Arena match history for a given PUUID
 * Attempts to use cached data first, falls back to Riot API
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { puuid, forceRefresh } = validation.data!;

    // Attempt to find user in database
    const { user: dbUser, error: dbError } = await getUserFromDatabase(puuid);
    
    if (dbError && process.env.NODE_ENV === 'development') {
      console.warn('Database operation failed, continuing with API-only approach');
    }

    // Use smart timestamp filtering - much simpler approach
    try {
      let response: MatchHistoryResponse;
      
      if (dbUser && !forceRefresh) {
        // Use timestamp filtering for existing users
        response = await getMatchHistoryWithTimestampFilter(dbUser, puuid);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fetched ${response.matchIds.length} matches using timestamp filter for user ${dbUser.id}`);
        }
      } else {
        // Fresh data for new users or forced refresh
        response = await getFreshMatchData(puuid, dbUser?.id);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fetched fresh match data: ${response.matchIds.length} matches`);
        }
      }
      
      return NextResponse.json(response);
    } catch (riotError) {
      return createErrorResponse(riotError);
    }

  } catch (error) {
    console.error('Match history API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
