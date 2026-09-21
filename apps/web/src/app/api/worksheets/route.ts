import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { SubjectIdSchema, Worksheet } from '@paperforge/shared';
import { buildWorksheetManifest } from '@paperforge/worksheets';

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

export async function POST(request: Request) {
  try {
    const store = getGlobalStore();
    const body = await request.json();
    const { title, subject = 'mathematics', chapter = 'Promotional Exam Revision', targetQuestionCount } = body;

    const parsedSubject = SubjectIdSchema.safeParse(subject);
    if (!parsedSubject.success) {
      return NextResponse.json({ error: 'Invalid subject identifier' }, { status: 400 });
    }

    const allQuestions = store.listQuestions({ subject: parsedSubject.data });
    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: `No questions available for subject ${parsedSubject.data}. Please upload examination papers first.` },
        { status: 400 }
      );
    }

    const count = targetQuestionCount || Math.min(10, allQuestions.length);
    const selectedQuestions = allQuestions.slice(0, count);

    const existingCount = store.listWorksheets(parsedSubject.data).length;
    const wsNumber = `WS-${parsedSubject.data.toUpperCase().slice(0, 4)}-${String(existingCount + 1).padStart(2, '0')}`;
    const wsId = `ws_${parsedSubject.data}_${Date.now()}`;

    const manifest = buildWorksheetManifest(
      wsId,
      1,
      parsedSubject.data,
      chapter,
      selectedQuestions
    );

    const newWorksheet: Worksheet = {
      id: wsId,
      worksheetNumber: wsNumber,
      title: title || `${wsNumber}: ${chapter} (Singapore A-Level)`,
      subject: parsedSubject.data,
      chapter,
      syllabusVersionId: 'v2026.2',
      manifest,
      targetMarks: manifest.totalMarks,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.addWorksheet(newWorksheet);

    return NextResponse.json(
      {
        success: true,
        message: `Compiled worksheet ${wsNumber} with ${selectedQuestions.length} questions (${manifest.totalMarks} marks).`,
        data: newWorksheet,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create worksheet';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
