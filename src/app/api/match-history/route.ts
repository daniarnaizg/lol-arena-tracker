import { NextRequest, NextResponse } from 'next/server';
import { riotApiService, RiotApiService } from '@/services/riotApi';
import { databaseService } from '@/services/database';

export async function POST(request: NextRequest) {
  try {
    const { puuid, count = 10, queue, arenaOnly = false, forceRefresh = false } = await request.json();

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID is required' },
        { status: 400 }
      );
    }

    // Find user in database
    let dbUser = null;
    try {
      dbUser = await databaseService.findUserByPuuid(puuid);
      if (!dbUser) {
        console.log(`User with PUUID ${puuid} not found in database`);
        // Continue to fetch from Riot API anyway
      }
    } catch (dbError) {
      console.error('Database user lookup error:', dbError);
      // Continue to Riot API if database fails
    }

    // Check for cached arena matches if user exists and we want arena only
    if (dbUser && arenaOnly && !forceRefresh) {
      try {
        const cachedMatches = await databaseService.findArenaMatches(dbUser.id, count);
        
        if (cachedMatches.length > 0) {
          const lastMatchTimestamp = databaseService.getUserLastMatchTimestamp(dbUser);
          console.log(`Found ${cachedMatches.length} cached arena matches for user ${dbUser.id}`);
          console.log(`User's last match timestamp: ${lastMatchTimestamp ? new Date(lastMatchTimestamp * 1000).toISOString() : 'none'}`);
          
          // Always check for new matches since last sync, but return combined results
          console.log(`Checking for new matches since ${lastMatchTimestamp ? new Date(lastMatchTimestamp * 1000).toISOString() : 'beginning'}`);
          
          try {
            // Fetch recent matches from Riot API to check for new ones
            // We'll fetch a smaller number since we expect mostly incremental updates
            const checkCount = lastMatchTimestamp ? 10 : 30; // Fewer if we have a timestamp
            
            const recentMatchIds = await riotApiService.getMatchHistory({
              puuid,
              start: 0,
              count: checkCount, 
              queue: RiotApiService.getArenaQueueId(),
            });
            
            console.log(`Found ${recentMatchIds.length} recent matches from API for incremental check`);
            
            // Combine unique match IDs (new matches + cached matches)
            const cachedMatchIds = cachedMatches.map(match => match.match_id);
            const allUniqueMatchIds = [...new Set([...recentMatchIds, ...cachedMatchIds])];
            
            // Sort by most recent first (matches from API are already sorted)
            const sortedMatchIds = allUniqueMatchIds.slice(0, count);
            
            return NextResponse.json({
              success: true,
              matchIds: sortedMatchIds,
              count: sortedMatchIds.length,
              puuid,
              queue: RiotApiService.getArenaQueueId(),
              arenaOnly: true,
              fromDatabase: true,
              cachedCount: cachedMatches.length,
              recentApiCount: recentMatchIds.length,
              userId: dbUser.id,
              lastMatchTimestamp: lastMatchTimestamp,
              hasIncrementalUpdate: true,
            });
            
          } catch (apiError) {
            console.error('Error checking for new matches:', apiError);
            // Fall back to cached matches only
            const matchIds = cachedMatches.map(match => match.match_id);
            
            return NextResponse.json({
              success: true,
              matchIds,
              count: matchIds.length,
              puuid,
              queue: RiotApiService.getArenaQueueId(),
              arenaOnly: true,
              fromDatabase: true,
              cachedCount: cachedMatches.length,
              userId: dbUser.id,
              lastMatchTimestamp: lastMatchTimestamp,
              error: 'Failed to check for new matches, showing cached only'
            });
          }
        }
      } catch (dbError) {
        console.error('Error fetching cached matches:', dbError);
        // Continue to Riot API if database cache fails
      }
    }

    // Fetch from Riot API
    const actualQueue = arenaOnly ? RiotApiService.getArenaQueueId() : queue;
    const maxCount = Math.min(count, 100);

    try {
      console.log(`Fetching match history from Riot API for PUUID: ${puuid}`);
      console.log(`Parameters: start=0, count=${maxCount}, queue=${actualQueue || 'all'}${arenaOnly ? ' (Arena only)' : ''}`);
      
      const matchIds = await riotApiService.getMatchHistory({
        puuid,
        start: 0,
        count: maxCount,
        queue: actualQueue,
      });
      
      console.log(`Found ${matchIds.length} match IDs from Riot API${arenaOnly ? ' (Arena only)' : ''}:`, matchIds);
      
      // If we have a database user and we're fetching arena matches, 
      // we could potentially fetch match details and save them to database
      // For now, we'll just return the match IDs and implement detailed saving in Step 4
      
      return NextResponse.json({
        success: true,
        matchIds,
        count: matchIds.length,
        puuid,
        queue: actualQueue,
        arenaOnly,
        fromDatabase: false,
        userId: dbUser?.id || null,
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
