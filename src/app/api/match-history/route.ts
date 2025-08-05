import { NextRequest, NextResponse } from 'next/server';
import { riotApiService } from '@/services/riotApi';

export async function POST(request: NextRequest) {
  try {
    const { puuid, count = 10, queue } = await request.json();

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID is required' },
        { status: 400 }
      );
    }

    try {
      console.log(`Fetching match history for PUUID: ${puuid}`);
      console.log(`Parameters: start=0, count=${Math.min(count, 20)}, queue=${queue || 'all'}`);
      
      const matchIds = await riotApiService.getMatchHistory({
        puuid,
        start: 0,
        count: Math.min(count, 20), // Limit to 20 matches max
        queue, // Optional queue filter (1700 for Arena)
      });
      
      console.log(`Found ${matchIds.length} match IDs:`, matchIds);
      
      return NextResponse.json({
        success: true,
        matchIds,
        count: matchIds.length,
        puuid,
      });
    } catch (riotError) {
      console.error('Riot Match API Error:', riotError);
      
      if (riotError instanceof Error && riotError.message.includes('403')) {
        return NextResponse.json(
          { error: 'Riot API key is invalid or expired' },
          { status: 403 }
        );
      }
      
      if (riotError instanceof Error && riotError.message.includes('404')) {
        return NextResponse.json(
          { error: 'No match history found for this account' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch match history from Riot API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Match history API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
