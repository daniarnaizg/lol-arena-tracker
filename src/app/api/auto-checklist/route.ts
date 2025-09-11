import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database';

interface AutoChecklistResult {
  success: boolean;
  userId: number;
  userName: string;
  championData: {
    totalChampions: number;
    playedChampions: number;
    unplayedChampions: number;
    checkedChampions: string[];
    newlyChecked: string[];
    championStates: Array<{
      championName: string;
      bestPlacement: number;
      win: boolean;
      top4: boolean;
      played: boolean;
    }>;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { puuid, dryRun = false } = await request.json();

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
        { error: 'User not found in database. Please run Step 2 (Account Lookup) first.' },
        { status: 404 }
      );
    }

    // Get user's Arena matches from database
    const matches = await databaseService.findArenaMatches(dbUser.id, 1000); // Get all matches
    
    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        userId: dbUser.id,
        userName: `${dbUser.game_name}#${dbUser.tag_line}`,
        championData: {
          totalChampions: 0,
          playedChampions: 0,
          unplayedChampions: 0,
          checkedChampions: [],
          newlyChecked: [],
        },
        message: 'No Arena matches found. Play some Arena matches first, then run Step 4 to save them to the database.',
      });
    }

    // Get unique champions played with their best placement
    const championPlacements = new Map<string, number>();
    
    matches.forEach(match => {
      const championName = match.champion_name;
      const placement = match.placement;
      
      // Keep track of the best (lowest) placement for each champion
      if (!championPlacements.has(championName) || placement < championPlacements.get(championName)!) {
        championPlacements.set(championName, placement);
      }
    });

    const playedChampions = Array.from(championPlacements.keys());
    console.log(`🎮 Found ${playedChampions.length} unique champions played with placements:`, 
      Array.from(championPlacements.entries()));

    // Categorize champions based on their best placement
    const championData = {
      totalChampions: 168, // Current champion count (approximate)
      playedChampions: playedChampions.length,
      unplayedChampions: 168 - playedChampions.length,
      checkedChampions: playedChampions,
      newlyChecked: playedChampions,
      // Additional data for placement-based checklist
      championStates: Array.from(championPlacements.entries()).map(([championName, bestPlacement]) => ({
        championName,
        bestPlacement,
        // Arena placement logic: 1st = win, 2nd-4th = top4, 5th-8th = played
        win: bestPlacement === 1,
        top4: bestPlacement <= 4,
        played: true // All champions in the list have been played
      }))
    };

    // Get current checklist state from localStorage (simulation)
    // In a real implementation, this would come from the database or user settings
    
    if (dryRun) {
      // For dry run, we simulate what would happen
      const result: AutoChecklistResult = {
        success: true,
        userId: dbUser.id,
        userName: `${dbUser.game_name}#${dbUser.tag_line}`,
        championData,
      };

      return NextResponse.json(result);
    }

    // For actual implementation, we would:
    // 1. Get the current champion checklist state
    // 2. Mark all played champions as checked
    // 3. Save the updated checklist
    // 4. Return the results

    // This is a placeholder for the actual implementation
    const result: AutoChecklistResult = {
      success: true,
      userId: dbUser.id,
      userName: `${dbUser.game_name}#${dbUser.tag_line}`,
      championData,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Auto-checklist API route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auto-checklist' },
      { status: 500 }
    );
  }
}
