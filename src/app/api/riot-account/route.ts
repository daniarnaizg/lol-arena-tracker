import { NextRequest, NextResponse } from 'next/server';
import { riotApiService, RiotApiService } from '@/services/riotApi';

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

    try {
      const account = await riotApiService.getAccountByRiotId(gameName, tagLine);
      
      console.log(`PUUID found for ${gameName}#${tagLine}:`, account.puuid);
      
      return NextResponse.json({
        success: true,
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
