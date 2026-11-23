import { NextResponse } from 'next/server';
import { getGlobalStore } from '@paperforge/db';
import { ReportQuestionPayloadSchema, ReviewItem } from '@paperforge/shared';
import { getCurrentUser } from '../../../lib/auth';
import { getSupabaseAdmin } from '../../../lib/supabase/admin';
import { createGitHubIssue } from '../../../lib/github-issue';

async function createGitHubErrorIssue(payload: {
  reviewItemId: string;
  questionId: string;
  answerId?: string;
  errorKind: string;
  citation?: string;
  reason?: string;
  reportedBy?: string;
}): Promise<{ issueCreated: boolean; issueNumber?: number; issueUrl?: string; reason?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const qImgUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/paperforge/questions/${payload.questionId}.png`
    : 'N/A';
  const aImgUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/paperforge/answers/${payload.questionId}.png`
    : 'N/A';

  const title = `[Error Report] ${payload.citation || payload.questionId} — ${payload.errorKind}${
    payload.reason ? `: ${payload.reason.slice(0, 60)}` : ''
  }`;
  const body = [
    `### Reported Question Error`,
    ``,
    `- **Question ID**: \`${payload.questionId}\``,
    `- **Answer ID**: ${payload.answerId ? `\`${payload.answerId}\`` : 'N/A'}`,
    `- **Review Item ID**: \`${payload.reviewItemId}\``,
    `- **Error Kind**: ${payload.errorKind}`,
    `- **Citation**: ${payload.citation || 'N/A'}`,
    `- **Reported By**: ${payload.reportedBy || 'Teacher'}`,
    `- **Reason**: ${payload.reason || 'No note provided'}`,
    ``,
    `### Media Links`,
    `- Question PNG: ${qImgUrl}`,
    `- Answer PNG: ${aImgUrl}`,
    ``,
    `### Support Agent Instructions`,
    `Use the \`paperforge-mismatch-support\` skill (error-report section): check the question entry in \`packages/db/.paperforge-store.json\` or Supabase, consult \`docs/mismatch-patterns.md\`, re-crop if needed from \`papers/\` + \`scripts/\`, sync to Supabase, document in \`docs/mismatch-triage-log.md\`, and close the issue after fixing.`,
  ].join('\n');

  return createGitHubIssue({ labels: ['question-error'], title, body });
}

/**
 * POST /api/report-question
 * Teacher/student error reports (missing question, wrong pairing, incomplete
 * answer, typo, stale screenshot, other). Creates a PENDING `ERROR_REPORT`
 * review item, opens a labeled GitHub issue for triage, and feeds the cloud
 * agent loop (fix_flagged_answer.py sweeps issue_type IN (MISMATCH_FLAGGED, ERROR_REPORT)).
 */
export async function POST(request: Request) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {}
    const rawBody = await request.json();
    const parsed = ReportQuestionPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid error-report payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { questionId, answerId, errorKind, reason } = parsed.data;
    const store = getGlobalStore();
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const actor = user?.name || user?.email || user?.id || 'Teacher';

    const existingQ = store.getQuestionById(questionId);
    const existingAns = store.getAnswerByQuestionId(questionId);

    // 1. Create a PENDING review item
    const reviewItemId = `rev_report_${questionId}_${Date.now()}`;
    const reviewItem: ReviewItem = {
      id: reviewItemId,
      entityType: 'QUESTION',
      entityId: questionId,
      issueType: 'ERROR_REPORT',
      confidence: 0,
      details: {
        questionId,
        answerId: answerId || existingAns?.id,
        errorKind,
        citation: existingQ?.provenance?.citation,
        reason: reason?.trim() || '',
        reportedBy: actor,
        reportedAt: nowIso,
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
        console.error('Failed to persist error report to Supabase:', dbErr);
      }
    }

    // 2. Open a GitHub issue (`question-error`) for the Support Agent triage
    const issueResult = await createGitHubErrorIssue({
      reviewItemId: reviewItem.id,
      questionId,
      answerId: answerId || existingAns?.id,
      errorKind,
      citation: existingQ?.provenance?.citation || undefined,
      reason: reason?.trim(),
      reportedBy: actor,
    });

    return NextResponse.json({
      success: true,
      data: reviewItem,
      issueCreated: issueResult.issueCreated,
      issueNumber: issueResult.issueNumber,
      issueUrl: issueResult.issueUrl,
      issueReason: issueResult.reason,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
