import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database';

export async function POST(request: NextRequest) {
  try {
    const { puuid } = await request.json();

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

    console.log(`📊 Getting match metadata for ${dbUser.game_name}#${dbUser.tag_line}`);

    // Get metadata from the user's matches
    const metadata = await databaseService.getMatchMetadata(dbUser.id);

    console.log('✅ Match metadata:', metadata);

    return NextResponse.json({
      success: true,
      metadata,
      user: {
        gameName: dbUser.game_name,
        tagLine: dbUser.tag_line
      }
    });

  } catch (error) {
    console.error('❌ Match metadata API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching match metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
