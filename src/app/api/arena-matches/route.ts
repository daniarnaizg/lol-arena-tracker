import { NextRequest, NextResponse } from 'next/server';
import { riotApiService } from '@/services/riotApi';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ARENA MATCHES API CALLED ===');
    const { matchIds, maxMatches = 10 } = await request.json();
    
    console.log('Received request data:', { matchIds, maxMatches });
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
      
      // Limit the number of matches to process to avoid rate limits
      const limitedMatchIds = matchIds.slice(0, Math.min(maxMatches, 20));
      console.log(`Limited to ${limitedMatchIds.length} matches:`, limitedMatchIds);
      
      // Get Arena matches only
      const arenaMatches = await riotApiService.getArenaMatchDetails(limitedMatchIds);
      
      console.log(`Found ${arenaMatches.length} Arena matches out of ${limitedMatchIds.length} total matches`);
      
      // Log Arena match details
      arenaMatches.forEach((match, index) => {
        console.log(`Arena Match ${index + 1}:`, {
          matchId: match.metadata.matchId,
          gameMode: match.info.gameMode,
          duration: Math.round(match.info.gameDuration / 60), // Convert to minutes
          participants: match.info.participants.length,
        });
      });
      
      return NextResponse.json({
        success: true,
        arenaMatches,
        totalChecked: limitedMatchIds.length,
        arenaCount: arenaMatches.length,
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
