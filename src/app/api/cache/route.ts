import { NextResponse } from 'next/server';
import { riotApiService } from '@/services/riotApi';

// This will clear the server-side cache for champion data and region cache
export async function DELETE() {
  try {
    // Clear the region cache
    riotApiService.clearRegionCache();
    
    // For now, we'll just return success - the champion cache will be refreshed on next request
    return NextResponse.json({ 
      success: true, 
      message: 'Region cache cleared and champion cache will be refreshed on next request' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const regionCacheStatus = riotApiService.getRegionCacheStatus();
    
    return NextResponse.json({
      success: true,
      regionCache: regionCacheStatus,
      regionCacheSize: Object.keys(regionCacheStatus).length,
      message: 'Use DELETE method to clear cache'
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}
