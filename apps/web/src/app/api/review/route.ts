import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { ReviewItem, ReviewResolutionPayloadSchema } from '@paperforge/shared';
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const allowedStatuses = ['PENDING', 'RESOLVED', 'DISMISSED'] as const;
  const status = allowedStatuses.includes(statusParam as any) ? (statusParam as ReviewItem['status']) : undefined;

  const store = getGlobalStore();
  const items = store.listReviewItems(status);

  return NextResponse.json({
    success: true,
    count: items.length,
    data: items,
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    const rawBody = await request.json();
    const parsed = ReviewResolutionPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, reviewItemId, decision, reviewerId, notes, resolutionNotes } = parsed.data;
    const targetId = (id || reviewItemId)!;
    const resolvedReviewer = reviewerId || user?.name || user?.id || 'Administrator';
    const store = getGlobalStore();
    const updated = store.resolveReviewItem(targetId, decision, resolvedReviewer, notes || resolutionNotes);

    if (!updated) {
      return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
