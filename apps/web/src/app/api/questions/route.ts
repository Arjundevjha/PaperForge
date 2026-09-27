import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { SubjectIdSchema, SingaporeSchoolCodeSchema } from '@paperforge/shared';
import { syncAllQuestionsFromDb } from '../../../lib/supabase/db-sync';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSubject = searchParams.get('subject');
  const rawSchool = searchParams.get('school');
  const search = searchParams.get('search') || undefined;

  const parsedSubject = rawSubject ? SubjectIdSchema.safeParse(rawSubject) : null;
  const parsedSchool = rawSchool ? SingaporeSchoolCodeSchema.safeParse(rawSchool) : null;

  if (rawSubject && !parsedSubject?.success) {
    return NextResponse.json({ error: 'Invalid subject identifier' }, { status: 400 });
  }
  if (rawSchool && !parsedSchool?.success) {
    return NextResponse.json({ error: 'Invalid Singapore school code' }, { status: 400 });
  }

  const store = getGlobalStore();

  // If store only has canonical seed questions (<= 26), synchronize all questions from PostgreSQL
  if (store.listQuestions().length <= 26 && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await syncAllQuestionsFromDb(store);
  }

  const questions = store.listQuestions({
    subject: parsedSubject?.data,
    school: parsedSchool?.data,
    search: search ? search.slice(0, 100) : undefined,
  });

  const answers = questions
    .map((q) => store.getAnswerByQuestionId(q.id))
    .filter(Boolean);

  return NextResponse.json({
    success: true,
    count: questions.length,
    data: questions,
    answers,
  });
}
