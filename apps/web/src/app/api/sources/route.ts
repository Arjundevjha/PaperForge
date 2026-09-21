import { NextResponse } from 'next/server';
import {
  getGlobalStore,
  REAL_PAPER_3_PACKAGE,
  REAL_PAPER_4_PACKAGE,
  ingestPaperPackage,
} from '@paperforge/db';

export async function GET() {
  const store = getGlobalStore();
  const sources = store.listSources();
  const questions = store.listQuestions();

  return NextResponse.json({
    success: true,
    count: sources.length,
    totalQuestions: questions.length,
    data: sources,
  });
}

export async function POST(request: Request) {
  try {
    const store = getGlobalStore();
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.action === 'reset' || body.reset === true) {
        store.clearAllData();
        return NextResponse.json({
          success: true,
          message: 'Data store reset to clean production state (0 sources, 0 questions).',
          count: 0,
        });
      }

      if (body.simulate === 'paper_3' || body.simulate === 'jpjc_2022' || body.paperKey === 'jpjc_2022_paper_3') {
        const result = ingestPaperPackage(store, REAL_PAPER_3_PACKAGE);
        const statusCode = result.duplicate ? 409 : result.success ? 201 : 400;
        return NextResponse.json(result, { status: statusCode });
      }

      if (body.simulate === 'paper_4' || body.simulate === 'ejc_2022' || body.paperKey === 'ejc_2022_paper_4') {
        const result = ingestPaperPackage(store, REAL_PAPER_4_PACKAGE);
        const statusCode = result.duplicate ? 409 : result.success ? 201 : 400;
        return NextResponse.json(result, { status: statusCode });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Unrecognized simulation parameter. Supported values: paper_3, paper_4, reset.',
        },
        { status: 400 }
      );
    }

    // Fallback: If multipart/form-data upload
    return NextResponse.json(
      {
        success: false,
        error: 'Direct PDF file upload: Please use 1-click simulation for Paper 3 (JPJC) or Paper 4 (EJC/DHS).',
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const store = getGlobalStore();
  store.clearAllData();
  return NextResponse.json({
    success: true,
    message: 'All examination sources and questions cleared.',
  });
}
