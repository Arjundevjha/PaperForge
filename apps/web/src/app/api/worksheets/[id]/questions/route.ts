import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { compileWorksheetDocuments } from '@paperforge/worksheets';
import { getStorageProvider } from '@paperforge/storage';
import { syncAllQuestionsFromDb, syncWorksheetsFromDb } from '../../../../../lib/supabase/db-sync';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getGlobalStore();
  let worksheet = store.getWorksheetById(id);

  if (
    (!worksheet ||
      worksheet.manifest?.questions?.length !== worksheet.questionCount ||
      store.listQuestions().length <= 26) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    await syncWorksheetsFromDb(store);
    await syncAllQuestionsFromDb(store);
    worksheet = store.getWorksheetById(id);
  }

  if (!worksheet) {
    return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
  }

  const cleanChapter = worksheet.chapter.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${worksheet.worksheetNumber}_${cleanChapter}_Questions.pdf`;
  const storageKey = `worksheets/${filename}`;

  // 1. Check for precompiled Questions PDF in Supabase Storage bucket
  try {
    const storage = getStorageProvider();
    const exists = await storage.exists(storageKey);
    if (exists) {
      const buffer = await storage.download(storageKey);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-PaperForge-Storage': 'HIT',
        },
      });
    }
  } catch (storageErr) {
    console.warn(`[storage] Could not retrieve cached Questions PDF: ${storageErr}`);
  }

  // 2. Dynamic compilation fallback
  const { questions, answers } = store.getWorksheetQuestions(id);

  try {
    const { questionPdf } = await compileWorksheetDocuments(worksheet, questions, answers);
    const pdfBuffer = Buffer.from(questionPdf);

    // Opportunistically cache to storage bucket
    try {
      const storage = getStorageProvider();
      await storage.upload(storageKey, pdfBuffer, 'application/pdf');
    } catch (uploadErr) {
      console.warn(`[storage] Failed to cache compiled Questions PDF: ${uploadErr}`);
    }

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-PaperForge-Storage': 'MISS',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
