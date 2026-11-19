import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import {
  ReviewFlagPayloadSchema,
  ReviewItem,
  ReviewResolutionPayloadSchema,
} from '@paperforge/shared';
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

async function triggerGitHubMismatchAgent(payload: {
  reviewItemId: string;
  questionId: string;
  answerId?: string;
  reason?: string;
}): Promise<{ dispatched: boolean; reason?: string }> {
  const token = process.env.GITHUB_DISPATCH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    return { dispatched: false, reason: 'GITHUB_DISPATCH_TOKEN not configured' };
  }

  const repo = process.env.GITHUB_REPO || 'Arjundevjha/PaperForge';
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'paperforge_fix_mismatch',
        client_payload: payload,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        dispatched: false,
        reason: `GitHub dispatch HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }

    return { dispatched: true };
  } catch (err: any) {
    return { dispatched: false, reason: err?.message || 'GitHub dispatch failed' };
  }
}

export async function POST(request: Request) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {}

    const rawBody = await request.json();
    const parsed = ReviewFlagPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid mismatch flag payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { questionId, answerId, issueType, reason, verificationStatus } = parsed.data;
    const store = getGlobalStore();
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const actor = user?.name || user?.email || user?.id || 'Teacher';

    // 1. Update in-memory store answer status if loaded
    const existingAns = store.getAnswerByQuestionId(questionId);
    if (existingAns) {
      existingAns.verificationStatus = verificationStatus;
    }

    // 2. Persist verification_status in Supabase answers table
    if (supabase) {
      try {
        const updateQuery = answerId
          ? supabase.from('answers').update({ verification_status: verificationStatus }).eq('id', answerId)
          : supabase
              .from('answers')
              .update({ verification_status: verificationStatus })
              .eq('question_id', questionId);
        await updateQuery;
      } catch (dbErr) {
        console.warn('Failed to update answer verification_status in Supabase:', dbErr);
      }
    }

    // If user is marking it VERIFIED directly, resolve any pending mismatch items and return
    if (verificationStatus === 'VERIFIED') {
      if (supabase) {
        try {
          await supabase
            .from('review_items')
            .update({
              status: 'RESOLVED',
              reviewed_by: actor,
              reviewed_at: nowIso,
            })
            .eq('status', 'PENDING')
            .eq('issue_type', 'MISMATCH_FLAGGED')
            .or(`entity_id.eq.${questionId}${answerId ? `,entity_id.eq.${answerId}` : ''}`);
        } catch (dbErr) {
          console.warn('Failed to resolve pending mismatch items:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        verificationStatus,
        dispatched: false,
      });
    }

    // 3. Create a PENDING review item
    const reviewItemId = `rev_mismatch_${questionId}_${Date.now()}`;
    const reviewItem: ReviewItem = {
      id: reviewItemId,
      entityType: 'ANSWER',
      entityId: questionId,
      issueType,
      confidence: 0,
      details: {
        questionId,
        answerId: answerId || existingAns?.id,
        solutionSourceFilename: existingAns?.solutionSourceFilename,
        reason: reason?.trim() || 'Flagged as answer key mismatch from Teacher Resource Hub',
        flaggedBy: actor,
        flaggedAt: nowIso,
      },
      status: 'PENDING',
      createdAt: nowIso,
    };

    store.addReviewItem(reviewItem);

    if (supabase) {
      try {
        await supabase.from('review_items').upsert(
          {
            id: reviewItem.id,
            entity_type: reviewItem.entityType,
            entity_id: reviewItem.entityId,
            issue_type: reviewItem.issueType,
            confidence: reviewItem.confidence,
            details: reviewItem.details,
            status: reviewItem.status,
            created_at: reviewItem.createdAt,
          },
          { onConflict: 'id' }
        );
      } catch (dbErr) {
        console.error('Failed to persist flagged review item to Supabase:', dbErr);
      }
    }

    // 4. Trigger GitHub Actions Cloud Auto-Fix Agent (best-effort)
    const dispatchResult = await triggerGitHubMismatchAgent({
      reviewItemId: reviewItem.id,
      questionId,
      answerId: answerId || existingAns?.id,
      reason: reason?.trim(),
    });

    return NextResponse.json({
      success: true,
      data: reviewItem,
      verificationStatus,
      dispatched: dispatchResult.dispatched,
      dispatchReason: dispatchResult.reason,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
