/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { riotApiService, RiotApiService } from '@/services/riotApi';
import { databaseService } from '@/services/database';

export async function POST(request: NextRequest) {
  try {
    const { matchIds, puuid, saveToDatabase = true, incrementalUpdate = false } = await request.json();

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: 'matchIds array is required' },
        { status: 400 }
      );
    }

    if (!puuid) {
      return NextResponse.json(
        { error: 'puuid is required' },
        { status: 400 }
      );
    }

    // Find user in database
    let dbUser = null;
    if (saveToDatabase) {
      try {
        dbUser = await databaseService.findUserByPuuid(puuid);
        if (!dbUser) {
          return NextResponse.json(
            { error: 'User not found in database. Please run Step 2 first.' },
            { status: 404 }
          );
        }
      } catch (dbError) {
        console.error('Database user lookup error:', dbError);
        return NextResponse.json(
          { error: 'Database error while finding user' },
          { status: 500 }
        );
      }
    }

    const results = [];
    const arenaQueueId = RiotApiService.getArenaQueueId();
    let savedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let newMatchesCount = 0;
    let latestMatchTimestamp = dbUser ? databaseService.getUserLastMatchTimestamp(dbUser) || 0 : 0;
    const userLastTimestamp = dbUser ? databaseService.getUserLastMatchTimestamp(dbUser) : null;

    // If this is an incremental update, we only process matches newer than the last timestamp
    const filteredMatchIds = incrementalUpdate && userLastTimestamp 
      ? matchIds // We'll filter by timestamp after fetching match details
      : matchIds;

    console.log(`Processing ${filteredMatchIds.length} matches${incrementalUpdate ? ' (incremental update)' : ''}`);
    if (incrementalUpdate && userLastTimestamp) {
      console.log(`Last processed timestamp: ${new Date(userLastTimestamp * 1000).toISOString()}`);
    }

    for (const matchId of filteredMatchIds) {
      try {
        console.log(`Fetching details for match: ${matchId}`);
        
        // Fetch match details from Riot API
        const matchDetails = await riotApiService.getMatchDetails(matchId);
        
        // Check if this is an Arena match
        const isArenaMatch = matchDetails.info.queueId === arenaQueueId;
        
        if (!isArenaMatch) {
          console.log(`Skipping non-Arena match: ${matchId} (queueId: ${matchDetails.info.queueId})`);
          skippedCount++;
          continue;
        }

        // Convert match creation time to Unix timestamp (seconds)
        const matchTimestamp = Math.floor(matchDetails.info.gameCreation / 1000);
        
        // If this is an incremental update, skip matches older than last processed timestamp
        if (incrementalUpdate && userLastTimestamp && matchTimestamp <= userLastTimestamp) {
          console.log(`Skipping already processed match: ${matchId} (${new Date(matchTimestamp * 1000).toISOString()})`);
          skippedCount++;
          continue;
        }

        // Track the latest match timestamp
        if (matchTimestamp > latestMatchTimestamp) {
          latestMatchTimestamp = matchTimestamp;
        }

        // Find the participant data for our player
        const participant = (matchDetails.info.participants as any[]).find((p: any) => p.puuid === puuid);

        if (!participant) {
          console.log(`Player not found in match: ${matchId}`);
          errorCount++;
          continue;
        }

        const matchData = {
          matchId: matchDetails.metadata.matchId,
          championName: participant.championName || 'Unknown',
          placement: participant.placement || 8, // Arena placement (1-8)
          win: participant.win || false,
          gameCreation: matchDetails.info.gameCreation,
          gameEndTimestamp: matchDetails.info.gameEndTimestamp || (matchDetails.info.gameCreation + matchDetails.info.gameDuration * 1000),
          gameVersion: matchDetails.info.gameVersion,
          timestamp: matchTimestamp, // Add timestamp for tracking
        };

        results.push({
          ...matchData,
          saved: false,
        });

        // Increment new matches count if this is newer than last timestamp
        if (incrementalUpdate && userLastTimestamp && matchTimestamp > userLastTimestamp) {
          newMatchesCount++;
        }

        // Save to database if requested and user exists
        if (saveToDatabase && dbUser) {
          try {
            const savedMatch = await databaseService.saveArenaMatch({
              userId: dbUser.id,
              matchId: matchData.matchId,
              championName: matchData.championName,
              placement: matchData.placement,
              win: matchData.win,
              gameCreation: matchData.gameCreation,
              gameEndTimestamp: matchData.gameEndTimestamp,
              gameVersion: matchData.gameVersion,
            });

            if (savedMatch) {
              results[results.length - 1].saved = true;
              savedCount++;
            }
          } catch (saveError) {
            console.error(`Failed to save match ${matchId}:`, saveError);
            // Continue processing other matches
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (matchError) {
        console.error(`Error processing match ${matchId}:`, matchError);
        errorCount++;
        continue;
      }
    }

    // Update user's last match timestamp if we processed new matches and saved to database
    if (saveToDatabase && dbUser && latestMatchTimestamp > (userLastTimestamp || 0)) {
      try {
        await databaseService.updateUserLastMatchTimestamp(dbUser.id, latestMatchTimestamp);
        console.log(`Updated user ${dbUser.id} last match timestamp to: ${new Date(latestMatchTimestamp * 1000).toISOString()}`);
      } catch (timestampError) {
        console.error('Failed to update last match timestamp:', timestampError);
        // Continue anyway, this is not critical
      }
    }

    return NextResponse.json({
      success: true,
      processed: filteredMatchIds.length,
      arenaMatches: results.length,
      saved: saveToDatabase ? savedCount : 0,
      skipped: skippedCount,
      errors: errorCount,
      newMatches: incrementalUpdate ? newMatchesCount : undefined,
      latestTimestamp: latestMatchTimestamp,
      incrementalUpdate,
      matches: results,
      userId: dbUser?.id || null,
    });

  } catch (error) {
    console.error('Match details API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
