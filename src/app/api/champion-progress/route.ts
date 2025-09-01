import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const patch = searchParams.get('patch');
    const season = searchParams.get('season');

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID is required' },
        { status: 400 }
      );
    }

    // Find user in database
    const dbUser = await databaseService.findUserByPuuid(puuid);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database. Please run Account Lookup first.' },
        { status: 404 }
      );
    }

    // Build filters object
    const filters: {
      limit?: number;
      startDate?: number;
      endDate?: number;
      patch?: string;
      season?: number;
    } = {};
    
    if (startDate) filters.startDate = parseInt(startDate);
    if (endDate) filters.endDate = parseInt(endDate);
    if (patch) filters.patch = patch;
    if (season) filters.season = parseInt(season);

    // Get filtered Arena matches
    const matches = await databaseService.findArenaMatchesFiltered(dbUser.id, filters);

    // Calculate champion statistics
    const championStats: Record<string, {
      championName: string;
      totalMatches: number;
      wins: number;
      top4s: number;
      bestPlacement: number;
      averagePlacement: number;
      recentMatches: Array<{
        gameId: string;
        placement: number;
        timestamp: number;
        patchVersion: string;
        seasonYear: number;
      }>;
    }> = {};

    for (const match of matches) {
      const championName = match.champion_name;
      
      if (!championStats[championName]) {
        championStats[championName] = {
          championName,
          totalMatches: 0,
          wins: 0,
          top4s: 0,
          bestPlacement: 8,
          averagePlacement: 0,
          recentMatches: []
        };
      }

      const stats = championStats[championName];
      stats.totalMatches++;
      
      if (match.placement === 1) {
        stats.wins++;
      }
      
      if (match.placement <= 4) {
        stats.top4s++;
      }

      if (match.placement < stats.bestPlacement) {
        stats.bestPlacement = match.placement;
      }

      stats.recentMatches.push({
        gameId: match.match_id,
        placement: match.placement,
        timestamp: match.game_creation_timestamp,
        patchVersion: match.patch_version,
        seasonYear: match.season_year
      });
    }

    // Calculate average placements
    for (const stats of Object.values(championStats)) {
      const totalPlacement = stats.recentMatches.reduce((sum, match) => sum + match.placement, 0);
      stats.averagePlacement = stats.totalMatches > 0 ? totalPlacement / stats.totalMatches : 0;
      
      // Sort recent matches by timestamp (newest first)
      stats.recentMatches.sort((a, b) => b.timestamp - a.timestamp);
      
      // Keep only the 5 most recent matches
      stats.recentMatches = stats.recentMatches.slice(0, 5);
    }

    const championArray = Object.values(championStats);

    // Calculate summary statistics
    const summary = {
      totalChampions: championArray.length,
      totalMatches: matches.length,
      uniqueChampionsPlayed: championArray.length,
      totalWins: championArray.reduce((sum, champ) => sum + champ.wins, 0),
      totalTop4s: championArray.reduce((sum, champ) => sum + champ.top4s, 0),
      averageWinRate: championArray.length > 0 
        ? championArray.reduce((sum, champ) => sum + (champ.wins / champ.totalMatches), 0) / championArray.length 
        : 0,
      averageTop4Rate: championArray.length > 0 
        ? championArray.reduce((sum, champ) => sum + (champ.top4s / champ.totalMatches), 0) / championArray.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      userId: dbUser.id,
      userName: `${dbUser.game_name}#${dbUser.tag_line}`,
      filters: {
        startDate,
        endDate,
        patch,
        season
      },
      summary,
      championStats: championArray.sort((a, b) => b.totalMatches - a.totalMatches)
    });

  } catch (error) {
    console.error('Error in champion progress API:', error);
    return NextResponse.json(
      { error: 'Failed to get champion progress' },
      { status: 500 }
    );
  }
}
