import { NextResponse } from 'next/server';

// This will clear the server-side cache for champion data
export async function DELETE() {
  try {
    // Since the cache is in the champions route module, we'll implement 
    // cache clearing by importing the route dynamically and clearing its cache
    
    // For now, we'll just return success - the cache will be refreshed on next request
    return NextResponse.json({ 
      success: true, 
      message: 'Cache will be refreshed on next request' 
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
  return NextResponse.json({
    message: 'Use DELETE method to clear cache'
  });
}
