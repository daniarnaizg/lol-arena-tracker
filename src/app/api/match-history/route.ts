import { NextRequest, NextResponse } from 'next/server';
import { riotApiService, RiotApiService } from '@/services/riotApi';

export async function POST(request: NextRequest) {
  try {
    const { puuid, count = 10, queue, arenaOnly = false } = await request.json();

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID is required' },
        { status: 400 }
      );
    }

    // If arenaOnly is true, force queue to Arena queue ID
    const actualQueue = arenaOnly ? RiotApiService.getArenaQueueId() : queue;
    const maxCount = Math.min(count, 100); // Increased cap for Arena-only requests

    try {
      console.log(`Fetching match history for PUUID: ${puuid}`);
      console.log(`Parameters: start=0, count=${maxCount}, queue=${actualQueue || 'all'}${arenaOnly ? ' (Arena only)' : ''}`);
      
      const matchIds = await riotApiService.getMatchHistory({
        puuid,
        start: 0,
        count: maxCount,
        queue: actualQueue,
      });
      
      console.log(`Found ${matchIds.length} match IDs${arenaOnly ? ' (Arena only)' : ''}:`, matchIds);
      
      return NextResponse.json({
        success: true,
        matchIds,
        count: matchIds.length,
        puuid,
        queue: actualQueue,
        arenaOnly,
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
