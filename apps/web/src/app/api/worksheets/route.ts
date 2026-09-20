import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { SubjectIdSchema } from '@paperforge/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSubject = searchParams.get('subject');

  const parsed = rawSubject ? SubjectIdSchema.safeParse(rawSubject) : null;
  if (rawSubject && !parsed?.success) {
    return NextResponse.json({ error: 'Invalid subject identifier' }, { status: 400 });
  }

  const store = getGlobalStore();
  const worksheets = store.listWorksheets(parsed?.data);

  return NextResponse.json({
    success: true,
    count: worksheets.length,
    data: worksheets,
  });
}
