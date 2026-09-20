import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { SubjectId, SingaporeSchoolCode } from '@paperforge/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject') as SubjectId | null;
  const school = searchParams.get('school') as SingaporeSchoolCode | null;
  const search = searchParams.get('search') || undefined;

  const store = getGlobalStore();
  const questions = store.listQuestions({
    subject: subject || undefined,
    school: school || undefined,
    search,
  });

  return NextResponse.json({
    success: true,
    count: questions.length,
    data: questions,
  });
}
