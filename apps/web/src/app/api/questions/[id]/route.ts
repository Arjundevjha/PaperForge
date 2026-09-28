import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { QuestionReclassifyPayloadSchema } from '@paperforge/shared';
import { syncAllQuestionsFromDb, reclassifyQuestionInDb } from '../../../../lib/supabase/db-sync';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await request.json();
    const payload = { ...rawBody, questionId: id };
    const parsed = QuestionReclassifyPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid reclassification payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { chapter, subtopic, status } = parsed.data;
    const store = getGlobalStore();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await syncAllQuestionsFromDb(store);
    }

    const result = await reclassifyQuestionInDb(store, id, chapter, subtopic, status);

    if (!result.question) {
      return NextResponse.json({ error: `Question ${id} not found` }, { status: 404 });
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
