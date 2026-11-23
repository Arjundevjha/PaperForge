import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { Answer, SubjectIdSchema, buildSyllabusCoverageCsv, computeSyllabusCoverage } from '@paperforge/shared';
import { syncAllQuestionsFromDb } from '../../../../../lib/supabase/db-sync';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSubject = searchParams.get('subject');
  const parsedSubject = rawSubject ? SubjectIdSchema.safeParse(rawSubject) : null;
  if (rawSubject && !parsedSubject?.success) {
    return NextResponse.json({ error: 'Invalid subject identifier' }, { status: 400 });
  }
  const subject = parsedSubject?.data ?? 'mathematics';

  const store = getGlobalStore();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await syncAllQuestionsFromDb(store);
  }

  const questions = store.listQuestions({ subject });
  const answers = new Map<string, Answer>();
  for (const q of questions) {
    const answer = store.getAnswerByQuestionId(q.id);
    if (answer) answers.set(q.id, answer);
  }

  const coverage = computeSyllabusCoverage(subject, questions, answers);
  const csv = buildSyllabusCoverageCsv(coverage.chapters);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="syllabus-coverage-${subject}.csv"`,
    },
  });
}
