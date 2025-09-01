import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database';

export async function POST(request: NextRequest) {
  try {
    const { 
      puuid, 
      startDate, 
      endDate, 
      patch, 
      season, 
      limit = 50 
    } = await request.json();

    if (!puuid) {
      return NextResponse.json(
        { error: 'puuid is required' },
        { status: 400 }
      );
    }

    // Find user in database
    const dbUser = await databaseService.findUserByPuuid(puuid);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Build filters object
    const filters = {
      limit: Math.min(Math.max(limit, 1), 500), // Limit between 1 and 500
      ...(startDate && { startDate: startDate * 1000 }), // Convert seconds to milliseconds
      ...(endDate && { endDate: endDate * 1000 }), // Convert seconds to milliseconds
      ...(patch && { patch }),
      ...(season && { season })
    };

    console.log(`🔍 Fetching filtered matches for ${dbUser.game_name}#${dbUser.tag_line}:`, {
      originalFilters: { startDate, endDate, patch, season, limit },
      convertedFilters: filters
    });

    // Get filtered matches from database
    const matches = await databaseService.findArenaMatchesFiltered(dbUser.id, filters);

    // Transform matches to the format expected by the UI
    const transformedMatches = matches.map(match => ({
      metadata: {
        matchId: match.match_id
      },
      info: {
        gameCreation: match.game_creation_timestamp,
        gameEndTimestamp: match.game_end_timestamp,
        championName: match.champion_name,
        placement: match.placement,
        win: match.win
      }
    }));

    console.log(`✅ Found ${matches.length} filtered matches`);

    return NextResponse.json({
      success: true,
      matches: transformedMatches,
      totalMatches: matches.length,
      filters: filters,
      user: {
        gameName: dbUser.game_name,
        tagLine: dbUser.tag_line
      }
    });

  } catch (error) {
    console.error('❌ Filtered matches API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching filtered matches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
