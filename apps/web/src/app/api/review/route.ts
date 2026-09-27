import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { ReviewItem, ReviewResolutionPayloadSchema } from '@paperforge/shared';
import { getCurrentUser } from '../../../lib/auth';
import { getSupabaseAdmin } from '../../../lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const allowedStatuses = ['PENDING', 'RESOLVED', 'DISMISSED'] as const;
  const status = allowedStatuses.includes(statusParam as any) ? (statusParam as ReviewItem['status']) : undefined;

  const store = getGlobalStore();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase.from('review_items').select('*').order('created_at', { ascending: false });
      if (status) {
        query = query.eq('status', status);
      }
      const { data: dbItems, error } = await query;
      if (!error && Array.isArray(dbItems)) {
        const mappedItems: ReviewItem[] = dbItems.map((row) => ({
          id: row.id,
          entityType: row.entity_type,
          entityId: row.entity_id,
          issueType: row.issue_type,
          confidence: row.confidence,
          details: row.details || {},
          status: row.status as ReviewItem['status'],
          reviewedBy: row.reviewed_by || undefined,
          reviewedAt: row.reviewed_at || undefined,
          createdAt: row.created_at || new Date().toISOString(),
        }));

        // Keep in-memory store in sync
        for (const item of mappedItems) {
          const existing = store.getReviewItemById(item.id);
          if (existing) {
            existing.status = item.status;
            existing.reviewedBy = item.reviewedBy;
            existing.reviewedAt = item.reviewedAt;
            existing.details = item.details;
          } else {
            store.addReviewItem(item);
          }
        }

        return NextResponse.json({
          success: true,
          count: mappedItems.length,
          data: mappedItems,
        });
      }
    } catch (dbErr) {
      console.warn('Supabase review_items fetch warning:', dbErr);
    }
  }

  const items = store.listReviewItems(status);

  return NextResponse.json({
    success: true,
    count: items.length,
    data: items,
  });
}

export async function PATCH(request: Request) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {}
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

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const item = updated || store.getReviewItemById(targetId);
        const resolvedStatus = decision === 'REJECT' ? 'DISMISSED' : 'RESOLVED';
        const nowIso = new Date().toISOString();

        await supabase.from('review_items').upsert(
          {
            id: targetId,
            entity_type: item?.entityType || 'QUESTION',
            entity_id: item?.entityId || targetId,
            issue_type: item?.issueType || 'UNCERTAIN_CLASSIFICATION',
            confidence: item?.confidence ?? 0.5,
            details: {
              ...(item?.details || {}),
              decision,
              notes: notes || resolutionNotes,
            },
            status: resolvedStatus,
            reviewed_by: resolvedReviewer,
            reviewed_at: nowIso,
          },
          { onConflict: 'id' }
        );
      } catch (dbErr) {
        console.error('Failed to sync review resolution to Supabase PostgreSQL:', dbErr);
      }
    }

    if (!updated) {
      return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
