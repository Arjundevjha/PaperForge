import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { SubjectId } from '@paperforge/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject') as SubjectId | null;

  const store = getGlobalStore();
  const worksheets = store.listWorksheets(subject || undefined);

  return NextResponse.json({
    success: true,
    count: worksheets.length,
    data: worksheets,
  });
}
