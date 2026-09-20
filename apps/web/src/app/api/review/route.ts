import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { ReviewItem } from '@paperforge/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ReviewItem['status'] | null;

  const store = getGlobalStore();
  const items = store.listReviewItems(status || undefined);

  return NextResponse.json({
    success: true,
    count: items.length,
    data: items,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, decision, reviewerId, notes } = body;

    if (!id || !decision) {
      return NextResponse.json({ error: 'Missing id or decision' }, { status: 400 });
    }

    const store = getGlobalStore();
    const updated = store.resolveReviewItem(id, decision, reviewerId || 'Admin', notes);

    if (!updated) {
      return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
