import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import {
  ReviewFlagPayloadSchema,
  ReviewItem,
  ReviewResolutionPayloadSchema,
} from '@paperforge/shared';
import { getCurrentUser } from '../../../lib/auth';
import { getSupabaseAdmin } from '../../../lib/supabase/admin';
import { createGitHubIssue, triggerGitHubAgent } from '../../../lib/github-issue';

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

async function createGitHubMismatchIssue(payload: {
  reviewItemId: string;
  questionId: string;
  answerId?: string;
  citation?: string;
  solutionSourceFilename?: string;
  reason?: string;
  flaggedBy?: string;
}): Promise<{ issueCreated: boolean; issueNumber?: number; issueUrl?: string; reason?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const qImgUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/paperforge/questions/${payload.questionId}.png`
    : 'N/A';
  const aImgUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/paperforge/answers/${payload.questionId}.png`
    : 'N/A';

  const title = `[Mismatch] ${payload.citation || payload.questionId}${
    payload.reason ? ` — ${payload.reason.slice(0, 60)}` : ''
  }`;
  const body = [
    `### Flagged Answer Key Mismatch`,
    ``,
    `- **Question ID**: \`${payload.questionId}\``,
    `- **Answer ID**: \`${payload.answerId || 'N/A'}\``,
    `- **Review Item ID**: \`${payload.reviewItemId}\``,
    `- **Citation**: ${payload.citation || 'N/A'}`,
    `- **Current Solution File**: \`${payload.solutionSourceFilename || 'N/A'}\``,
    `- **Reason**: ${payload.reason || 'Flagged from Teacher Resource Hub'}`,
    `- **Flagged By**: ${payload.flaggedBy || 'Teacher'}`,
    ``,
    `### Media Links`,
    `- Question PNG: ${qImgUrl}`,
    `- Current Answer PNG: ${aImgUrl}`,
    ``,
    `### Support Agent Instructions`,
    `Use the \`paperforge-mismatch-support\` skill: check \`docs/mismatch-patterns.md\`, fix the pairing/crop in local \`papers/\` + \`scripts/\`, sync to Supabase, document the root cause in \`docs/mismatch-triage-log.md\`, and close this issue.`,
  ].join('\n');

  return createGitHubIssue({ labels: ['answer-mismatch'], title, body });
}

async function triggerGitHubMismatchAgent(payload: {
  reviewItemId: string;
  questionId: string;
  answerId?: string;
  reason?: string;
}): Promise<{ dispatched: boolean; reason?: string }> {
  return triggerGitHubAgent({
    eventType: 'paperforge_fix_mismatch',
    clientPayload: payload,
  });
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

    const existingQ = store.getQuestionById(questionId);

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
        citation: existingQ?.provenance?.citation,
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

    // 4. Open a GitHub Issue (`answer-mismatch`) for the Support Agent (+ optional dispatch)
    const issueResult = await createGitHubMismatchIssue({
      reviewItemId: reviewItem.id,
      questionId,
      answerId: answerId || existingAns?.id,
      citation: existingQ?.provenance?.citation || undefined,
      solutionSourceFilename: existingAns?.solutionSourceFilename || undefined,
      reason: reason?.trim(),
      flaggedBy: actor,
    });

    const dispatchResult =
      process.env.ENABLE_CLOUD_DISPATCH === 'true'
        ? await triggerGitHubMismatchAgent({
            reviewItemId: reviewItem.id,
            questionId,
            answerId: answerId || existingAns?.id,
            reason: reason?.trim(),
          })
        : { dispatched: false };

    return NextResponse.json({
      success: true,
      data: reviewItem,
      verificationStatus,
      issueCreated: issueResult.issueCreated,
      issueNumber: issueResult.issueNumber,
      issueUrl: issueResult.issueUrl,
      issueReason: issueResult.reason,
      dispatched: dispatchResult.dispatched,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
