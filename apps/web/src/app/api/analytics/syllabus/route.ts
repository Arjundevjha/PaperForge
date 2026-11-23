import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { Answer, SubjectIdSchema, computeSyllabusCoverage } from '@paperforge/shared';
import { syncAllQuestionsFromDb } from '../../../../lib/supabase/db-sync';

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

  const chapters = coverage.chapters.map((ch) => ({
    id: ch.id,
    name: ch.name,
    coveragePct: ch.coveragePct,
    subtopics: ch.subtopics.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      keywords: s.keywords,
      covered: s.covered,
      questions: s.questions,
      questionsWithAnswer: s.questionsWithAnswer,
      questionsWithDiagram: s.questionsWithDiagram,
      gap: s.gap,
    })),
  }));

  return NextResponse.json({
    success: true,
    subject,
    overall: coverage.overall,
    chapters,
  });
}
