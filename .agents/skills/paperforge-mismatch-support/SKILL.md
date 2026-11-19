---
name: paperforge-mismatch-support
description: Autonomous support & triage workflow for PaperForge `answer-mismatch` GitHub Issues. Polls open issues, consults learned mismatch patterns, fixes answer pairings/crops using local PDFs and scripts/, syncs to Supabase, and self-documents every fix into docs/mismatch-triage-log.md and docs/mismatch-patterns.md so future triage gets faster.
---

# PaperForge Mismatch Support Skill

Use this skill whenever triaging or running a scheduled support loop for PaperForge `answer-mismatch` GitHub Issues.

## 1. Poll for Open Mismatch Issues
```bash
gh issue list --label answer-mismatch --state open --json number,title,body,createdAt
```
If the list is empty (`[]`), stop immediately without editing any files.

## 2. Consult Learned Knowledge First (Fast-Path)
Before inspecting PDFs from scratch, **read**:
1. [`docs/mismatch-patterns.md`](../../../docs/mismatch-patterns.md) — known root causes, school alias bugs, P1/P2 twin mappings, and cropping heuristics.
2. [`docs/mismatch-triage-log.md`](../../../docs/mismatch-triage-log.md) — recent fixes to see if the same paper/batch already failed for a known reason.

## 3. Gather Context for Each Issue
Extract `questionId`, `answerId`, `reviewItemId`, `solutionSourceFilename`, and `reason` from the issue body, then inspect:
- The question & current answer entries in `packages/db/.paperforge-store.json` (or Supabase `questions` / `answers`).
- The rendered PNGs (`apps/web/public/questions/<id>.png` and `apps/web/public/answers/<id>.png`) — visually check them with `read_file` if needed to confirm what's wrong (cut off, wrong question #, wrong paper, wrong school).
- Local source PDFs in `papers/h2_mathematics/` matching the school, year, and paper number.

## 4. Fix & Sync
Depending on the root cause:
- **Systemic pairing bug** (e.g., missing alias in `SCHOOL_ALIASES` or missing twin in `KNOWN_TWIN_SOLUTIONS` inside `scripts/generate_all_answer_screenshots.py`):
  1. Fix the rule in `scripts/generate_all_answer_screenshots.py` so the whole paper/school doesn't regress.
  2. Re-crop the affected question(s) at 200 DPI into `apps/web/public/answers/<question_id>.png`.
- **Single-question crop boundary / off-by-one / P1↔P2 swap**:
  1. Re-crop the exact question region from the true `_MS_` / `Solutions` PDF in `papers/h2_mathematics/` into `apps/web/public/answers/<question_id>.png`.
- **Sync to Supabase** (Storage + PostgreSQL):
  1. Upload `apps/web/public/answers/<question_id>.png` to Supabase Storage (`paperforge/answers/<question_id>.png`, `x-upsert: true`).
  2. Update `public.answers`: set `verification_status = 'VERIFIED'`, `solution_source_filename`, and `diagram_url`.
  3. Update `public.review_items`: set `status = 'RESOLVED'`, `reviewed_by = 'agy-support-agent'`, `reviewed_at = now()`, and store `resolution` in `details`.

## 5. Self-Document & Learn (Mandatory)
After every fix:
1. **Append to `docs/mismatch-triage-log.md`**:
   - Date, Issue `#`, `questionId`, `reason`, root cause, fix applied, and verification check (`HTTP 200` / byte size).
2. **Update `docs/mismatch-patterns.md`** if you uncovered a new reusable pattern (e.g. a new filename convention, school alias, multi-page solution layout, or paper-number trap) so the next triage hits the fast-path.

## 6. Close the Issue
Comment with a concise summary of the root cause, fix, and verification, then close:
```bash
gh issue close <number> --comment "Fixed: <root cause & fix>. Synced verified PNG to Supabase Storage & updated answers/review_items. Documented in docs/mismatch-triage-log.md."
```
