import { NextResponse } from 'next/server';
import champions from '@/data/champions.json';

export async function GET() {
  return NextResponse.json(champions);
}
