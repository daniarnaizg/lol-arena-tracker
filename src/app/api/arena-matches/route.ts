import { NextRequest, NextResponse } from 'next/server';
import { riotApiService } from '@/services/riotApi';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ARENA MATCHES API CALLED ===');
    const { matchIds, maxMatches = 15, puuid } = await request.json();
    
    console.log('Received request data:', { matchIds, maxMatches, puuid });
    console.log('Region cache status:', riotApiService.getRegionCacheStatus());
    console.log('Match IDs type:', typeof matchIds);
    console.log('Match IDs is array:', Array.isArray(matchIds));
    console.log('Match IDs length:', matchIds ? matchIds.length : 'N/A');

    if (!matchIds || !Array.isArray(matchIds)) {
      console.error('Invalid matchIds:', matchIds);
      return NextResponse.json(
        { error: 'Match IDs array is required' },
        { status: 400 }
      );
    }

    if (matchIds.length === 0) {
      console.log('Empty match IDs array, returning empty result');
      return NextResponse.json({
        success: true,
        arenaMatches: [],
        totalChecked: 0,
        arenaCount: 0,
      });
    }

    try {
      console.log(`Fetching match details for ${matchIds.length} matches...`);
      
      // We'll check up to 50 matches to find the requested number of Arena matches
      // But we'll process them in batches to avoid rate limits and return early when we have enough
      const maxArenaMatches = maxMatches || 15;
      const maxMatchesToCheck = Math.min(matchIds.length, 50);
      
      console.log(`Looking for ${maxArenaMatches} Arena matches from ${maxMatchesToCheck} total matches`);
      
      // Get Arena matches only - the service will stop early when we have enough
      const result = await riotApiService.getArenaMatchDetails(
        matchIds.slice(0, maxMatchesToCheck), 
        puuid, 
        maxArenaMatches
      );
      
      console.log(`Found ${result.arenaMatches.length} Arena matches out of ${result.totalChecked} checked matches`);
      
      // Log Arena match details
      result.arenaMatches.forEach((match, index) => {
        console.log(`Arena Match ${index + 1}:`, {
          matchId: match.metadata.matchId,
          gameMode: match.info.gameMode,
          duration: Math.round(match.info.gameDuration / 60), // Convert to minutes
          participants: match.info.participants.length,
        });
      });
      
      return NextResponse.json({
        success: true,
        arenaMatches: result.arenaMatches,
        totalChecked: result.totalChecked,
        arenaCount: result.arenaMatches.length,
      });
    } catch (riotError) {
      console.error('Riot Arena Matches API Error:', riotError);
      
      if (riotError instanceof Error && riotError.message.includes('403')) {
        return NextResponse.json(
          { error: 'Riot API key is invalid or expired' },
          { status: 403 }
        );
      }
      
      if (riotError instanceof Error && riotError.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch match details from Riot API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Arena matches API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
