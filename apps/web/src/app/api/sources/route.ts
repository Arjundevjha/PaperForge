import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';

export async function GET() {
  const store = getGlobalStore();
  const sources = store.listSources();

  return NextResponse.json({
    success: true,
    count: sources.length,
    data: sources,
  });
}
