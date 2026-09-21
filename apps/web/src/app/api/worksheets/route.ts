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
  (store as any).reloadFromDisk?.();
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

    const isAllTopics =
      !chapter ||
      chapter.toLowerCase() === 'all' ||
      chapter.toLowerCase() === 'all chapters' ||
      chapter.toLowerCase() === 'promotional exam revision';

    // STRICT CHAPTER SCOPING: Only select questions matching the requested chapter
    const candidateQuestions = isAllTopics
      ? allQuestions
      : allQuestions.filter((q) => q.chapter.trim().toLowerCase() === chapter.trim().toLowerCase());

    if (candidateQuestions.length === 0) {
      return NextResponse.json(
        {
          error: `No questions found for chapter "${chapter}" in subject ${parsedSubject.data}. Available chapters: ${Array.from(new Set(allQuestions.map(q => q.chapter))).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const count = targetQuestionCount || Math.min(10, candidateQuestions.length);
    const selectedQuestions = candidateQuestions.slice(0, count);
    const resolvedChapter = isAllTopics ? 'Promotional Exam Revision (All Topics)' : chapter;

    const existingCount = store.listWorksheets(parsedSubject.data).length;
    const wsNumber = `WS-${parsedSubject.data.toUpperCase().slice(0, 4)}-${String(existingCount + 1).padStart(2, '0')}`;
    const wsId = `ws_${parsedSubject.data}_${Date.now()}`;

    const manifest = buildWorksheetManifest(
      wsId,
      1,
      parsedSubject.data,
      resolvedChapter,
      selectedQuestions
    );

    const newWorksheet: Worksheet = {
      id: wsId,
      worksheetNumber: wsNumber,
      title: title || `${wsNumber}: ${resolvedChapter} (Singapore A-Level)`,
      subject: parsedSubject.data,
      chapter: resolvedChapter,
      syllabusVersionId: 'SEAB-9758-Official',
      version: 1,
      questionCount: selectedQuestions.length,
      totalMarks: manifest.totalMarks,
      status: 'PUBLISHED',
      sourceCoverage: Array.from(new Set(selectedQuestions.map((q) => q.provenance.school))),
      manifest,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.addWorksheet(newWorksheet);

    return NextResponse.json(
      {
        success: true,
        message: `Compiled worksheet ${wsNumber} with ${selectedQuestions.length} questions (${manifest.totalMarks} marks) for ${resolvedChapter}.`,
        data: newWorksheet,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create worksheet';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const store = getGlobalStore();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const deleted = store.deleteWorksheet(id);
      return NextResponse.json({
        success: deleted,
        message: deleted ? `Worksheet ${id} deleted.` : `Worksheet ${id} not found.`,
      });
    }

    // Clear all worksheets
    const anyStore = store as any;
    if (typeof anyStore.clearWorksheets === 'function') {
      anyStore.clearWorksheets();
    } else if (anyStore.worksheets instanceof Map) {
      anyStore.worksheets.clear();
      if (typeof anyStore.saveToDisk === 'function') {
        anyStore.saveToDisk();
      }
    } else {
      for (const ws of store.listWorksheets()) {
        anyStore.worksheets?.delete?.(ws.id);
      }
      anyStore.saveToDisk?.();
    }

    return NextResponse.json({
      success: true,
      message: 'All generated worksheets cleared.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete worksheet';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
