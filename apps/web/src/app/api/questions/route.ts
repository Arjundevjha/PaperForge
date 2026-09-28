import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { SubjectIdSchema, SingaporeSchoolCodeSchema, QuestionReclassifyPayloadSchema } from '@paperforge/shared';
import { syncAllQuestionsFromDb, reclassifyQuestionInDb } from '../../../lib/supabase/db-sync';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSubject = searchParams.get('subject');
  const rawSchool = searchParams.get('school');
  const chapter = searchParams.get('chapter') || undefined;
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

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await syncAllQuestionsFromDb(store);
  }

  const questions = store.listQuestions({
    subject: parsedSubject?.data,
    school: parsedSchool?.data,
    chapter,
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

export async function PATCH(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = QuestionReclassifyPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid reclassification payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { questionId, chapter, subtopic, status } = parsed.data;
    const store = getGlobalStore();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await syncAllQuestionsFromDb(store);
    }

    const result = await reclassifyQuestionInDb(store, questionId, chapter, subtopic, status);

    if (!result.question) {
      return NextResponse.json({ error: `Question ${questionId} not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.question,
      movedFromWorksheet: result.movedFromWorksheet,
      movedToWorksheet: result.movedToWorksheet,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

