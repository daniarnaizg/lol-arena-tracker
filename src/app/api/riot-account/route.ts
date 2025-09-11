import { NextRequest, NextResponse } from 'next/server';
import { riotApiService, RiotApiService } from '@/services/riotApi';
import { databaseService } from '@/services/database';

export async function POST(request: NextRequest) {
  try {
    const { gameName, tagLine } = await request.json();

    if (!gameName || !tagLine) {
      return NextResponse.json(
        { error: 'Both gameName and tagLine are required' },
        { status: 400 }
      );
    }

    // Validate input format
    const validatedId = RiotApiService.validateRiotId(`${gameName}#${tagLine}`);
    if (!validatedId) {
      return NextResponse.json(
        { error: 'Invalid Riot ID format' },
        { status: 400 }
      );
    }

    // First, check if user exists in database
    try {
      const existingUser = await databaseService.findUserByRiotId(gameName, tagLine);
      
      if (existingUser) {
        console.log(`User found in database: ${gameName}#${tagLine}`);
        
        return NextResponse.json({
          success: true,
          fromDatabase: true,
          account: {
            puuid: existingUser.puuid,
            gameName: existingUser.game_name,
            tagLine: existingUser.tag_line,
          }
        });
      }
    } catch (dbError) {
      console.error('Database lookup error:', dbError);
      // Continue to Riot API if database fails
    }

    // If not in database, fetch from Riot API
    try {
      const account = await riotApiService.getAccountByRiotId(gameName, tagLine);
      
      console.log(`PUUID found from Riot API for ${gameName}#${tagLine}:`, account.puuid);
      
        // Save user to database
        try {
          await databaseService.createUser({
            puuid: account.puuid,
            gameName: account.gameName,
            tagLine: account.tagLine,
            region: 'americas', // Default region, could be enhanced later
          });
          
          console.log(`User saved to database: ${gameName}#${tagLine}`);
        } catch (saveError) {
          console.error('Failed to save user to database:', saveError);
          // Continue anyway - the API call succeeded
        }      return NextResponse.json({
        success: true,
        fromDatabase: false,
        account: {
          puuid: account.puuid,
          gameName: account.gameName,
          tagLine: account.tagLine,
        }
      });
    } catch (riotError) {
      console.error('Riot API Error:', riotError);
      
      if (riotError instanceof Error && riotError.message.includes('404')) {
        return NextResponse.json(
          { error: 'Riot ID not found. Please check your Game Name and Tag Line.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch account data from Riot API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
