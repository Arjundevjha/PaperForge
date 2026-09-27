import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { compileWorksheetDocuments } from '@paperforge/worksheets';
import { syncAllQuestionsFromDb, syncWorksheetsFromDb } from '../../../../../lib/supabase/db-sync';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getGlobalStore();
  let worksheet = store.getWorksheetById(id);

  if ((!worksheet || store.listQuestions().length <= 26) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await syncWorksheetsFromDb(store);
    await syncAllQuestionsFromDb(store);
    worksheet = store.getWorksheetById(id);
  }

  if (!worksheet) {
    return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
  }

  const { questions, answers } = store.getWorksheetQuestions(id);


  try {
    const { answerPdf } = await compileWorksheetDocuments(worksheet, questions, answers);

    return new Response(Buffer.from(answerPdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${worksheet.worksheetNumber}_${worksheet.chapter.replace(/[^a-zA-Z0-9]/g, '_')}_AnswerKey.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
