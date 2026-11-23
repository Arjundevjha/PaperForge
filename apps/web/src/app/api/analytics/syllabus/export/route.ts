import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import {
  SubjectIdSchema,
  buildSyllabusCoverageCsv,
  computeSyllabusCoverage,
  type Answer,
} from '@paperforge/shared';
import { syncAllQuestionsFromDb } from '../../../../../lib/supabase/db-sync';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjectRaw = searchParams.get('subject');

  const parsedSubject = subjectRaw ? SubjectIdSchema.safeParse(subjectRaw) : null;
  if (subjectRaw && !parsedSubject?.success) {
    return NextResponse.json({ error: 'Invalid subject identifier' }, { status: 400 });
  }

  const subject = parsedSubject?.data || 'mathematics';
  const store = getGlobalStore();

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await syncAllQuestionsFromDb(store);
  }

  const questions = store.listQuestions({ subject: parsedSubject?.data });
  const answers = new Map<string, Answer>();
  for (const q of questions) {
    const a = store.getAnswerByQuestionId(q.id);
    if (a) answers.set(q.id, a);
  }

  const result = computeSyllabusCoverage(subject, questions, answers);

  return new NextResponse(buildSyllabusCoverageCsv(result.chapters), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="paperforge-syllabus-coverage-${subject}.csv"`,
    },
  });
}
