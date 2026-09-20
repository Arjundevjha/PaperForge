import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';

export async function GET() {
  const store = getGlobalStore();
  const health = store.getSystemHealth();

  return NextResponse.json({
    success: true,
    data: health,
  });
}
