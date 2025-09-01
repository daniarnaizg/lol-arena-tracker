import { NextRequest, NextResponse } from 'next/server';
import { riotApiService } from '@/services/riotApi';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ARENA MATCHES API CALLED ===');
    const { puuid, maxMatches = 30, start = 0 } = await request.json();
    
    console.log('Request params:', { puuid, maxMatches, start });

    if (!puuid) {
      console.error('Missing required parameter: puuid');
      return NextResponse.json(
        { error: 'PUUID is required' },
        { status: 400 }
      );
    }

    const maxCount = Math.min(maxMatches, 50); // Cap at 50 for safety
    console.log(`🚀 Fetching up to ${maxCount} Arena matches directly for PUUID: ${puuid}`);

    try {
      // Use the optimized method that gets Arena matches directly using queue=1700
      const result = await riotApiService.getArenaMatchDetails({
        puuid,
        start,
        count: maxCount
      });
      
      console.log(`✅ Fetch complete: ${result.arenaMatches.length} Arena matches found`);
      
      // Log Arena match details for debugging (simplified structure)
      result.arenaMatches.forEach((match, index) => {
        console.log(`Arena Match ${index + 1}:`, {
          matchId: match.metadata.matchId,
          championName: match.info.championName,
          placement: match.info.placement,
          win: match.info.win,
          gameDate: new Date(match.info.gameCreation).toLocaleDateString(),
        });
      });
      
      return NextResponse.json({
        success: true,
        arenaMatches: result.arenaMatches,
        totalChecked: result.totalChecked,
        arenaCount: result.arenaMatches.length,
      });
      
    } catch (riotError) {
      console.error('Riot API Error:', riotError);
      
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
      
      if (riotError instanceof Error && riotError.message.includes('404')) {
        return NextResponse.json(
          { error: 'No Arena matches found for this account' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch Arena matches from Riot API' },
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
