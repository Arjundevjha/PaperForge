# PaperForge — Session Handoff Document

> **Status**: Unslopped UI, `questionType` + `topicId`/`subtopicId` + `solutionSourceId` + `verificationStatus` schema & live Supabase migration applied, Groq-powered classification & Q↔A verification completed (`998/998`), `0` cross-school / `0` cross-paper pairings remaining, `1,996/1,996` crops synced to Supabase Storage, `1,390` questions & answers synced to Supabase PostgreSQL. **NOT pushed to remote (`git push` held pending user approval).**
> **Workspace**: `/Users/abc/Desktop/Projects/PaperForge`
> **Git Branch**: `main`
> **Live Production Storage**: `paperforge` bucket at `https://mavqeszmyxfdppckqprw.supabase.co`

---

## 1. Root Cause of `WS-MATH-06-01` Q1 (`njc-2012-p1-q07`) Mismatch
1. **Cross-school hijack (`scripts/generate_all_answer_screenshots.py`)**: `extract_meta` used `\bmi\b`, which failed to match `MIPU3_H2_Mathematics_Paper_2_2012_Prelim_II_Answer_Key_6660.pdf`, leaving `c_meta['sch'] = None`. `resolve_solution_file` bypassed the School Invariant when `c_meta['sch'] is None` and `is_tight_batch` (`abs(6659 - 6660) = 1 <= 5`), letting `MIPU3` beat the true twin `NJC_JC2_H2_Maths_2012_Solutions_Paper_2_6655.pdf` (`diff = 4`).
2. **P1 vs P2 citation reversion (`apps/web/src/lib/supabase/db-sync.ts`)**: `syncAllQuestionsFromDb` ignored `sources` and re-parsed `-p1-` and hardcoded `'PRELIM'` from `q.id`, reverting `paperNumber: 2` back to `P1`.

---

## 2. Changes Implemented
- **Schema & Types (`packages/shared/src/types.ts`, `packages/shared/src/validation.ts`, `packages/db/src/schema.ts`, `packages/db/supabase/migrations/20261117000000_add_question_type_topic_and_answer_provenance.sql`)**:
  - Added `QuestionType` (`structured` | `proof` | `graph_sketch` | `application` | `calculation` | `statistical_test` | `counting_probability`) and `AnswerVerificationStatus` (`VERIFIED` | `AUTO_MATCHED` | `MISMATCH_FLAGGED` | `MISSING`).
  - Added `topic_id`, `subtopic_id`, `question_type`, `diagram_url`, `solution_source_id`, `solution_source_filename`, `verification_status`, 7 indexes, and `SELECT` RLS policy on `public.answers` (applied to live Supabase project `mavqeszmyxfdppckqprw`).
- **Pipeline, Groq Classification & Sync (`scripts/`)**:
  - Fixed `SCHOOL_ALIASES` (`mipu3`/`mipu`/`pu3` → `MI`, `jjc` → `JPJC`, `yjc` → `YIJC`), earliest-alias matching, and strict School Invariant in `scripts/generate_all_answer_screenshots.py`.
  - Healed `54` school-mismatched sources, `19` paperType/paperNumber sources, `1,390` provenances, and re-cropped `976/998` answer screenshots (`njc-2012-p1-q07` now crops `NJC_JC2_H2_Maths_2012_Solutions_Paper_2_6655.pdf` Q7).
  - Ran `scripts/classify_and_verify_groq.ts` (`openai/gpt-oss-120b` / `qwen/qwen3.8-27b` with 7s pacing + 429 backoff): classified `998/998` questions, reclassified `208` chapter/subtopic assignments, regenerated `19` worksheets (`997` curated questions; `WS-MATH-06-01` now `162` questions).
  - Synced `1,996/1,996` PNGs to Supabase Storage and `928` sources / `1,390` questions / `1,390` answers / `19` worksheets / `997` `worksheet_questions` to Supabase PostgreSQL.
- **UI Unslop (`apps/web/src/`)**:
  - `apps/web/src/lib/supabase/db-sync.ts` & `apps/web/src/lib/storage-url.ts`: Use real `sources` provenance and custom `diagramUrl`.
  - `apps/web/src/components/layout/AppShell.tsx`: Removed hardcoded `"Sync: 18 Sep 2026 • Operational"` and dead `Ctrl+K` Chemistry/Physics/Bio modal.
  - `apps/web/src/components/hub/TeacherResourceHub.tsx` & `apps/web/src/components/questions/ReclassifyModal.tsx`: Non-clipping wrapped chapter/subtopic selectors, first-class `questionType` / `paperNumber` / `school` / `year` / search filters, collapsed 16-JC card pill popover, fixed per-card PDF download (`handleDownloadPdf(ws, type)`), auto-fitted A4 Canvas `ResizeObserver` zoom, removed `[Turn Over` typo & fake `PAGE BREAK`, and added per-question **Answer Pairing & Verification Strip**.

---

## 3. Verification Evidence
- `npm run build`: clean Next.js 16.3.5 Turbopack build (0 errors).
- `npx tsc --noEmit -p apps/web/tsconfig.json`: 0 errors.
- `npx fallow dead-code --fail-on-issues`: 0 issues across 73 entry points.
- `npm test`: 42/43 passing (1 pre-existing environment check in `tests/diagnose.test.mjs:21` for a Desktop PDF path).
- `njc-2012-p1-q07`: verified in store, local crop (`apps/web/public/answers/njc-2012-p1-q07.png`), Supabase Storage (`HTTP/2 200`, `88549` bytes), and Supabase PostgreSQL (`NJC 2012 PRELIM P2 Q7`, `question_type="counting_probability"`).
- **Pending user approval**: `git commit` / `git push` / Vercel deployment.

---

## 4. Cloud Auto-Fix Mismatch Agent (Added Nov 19, 2026)
- **Inline Flagging & Verification (`apps/web/src/components/hub/TeacherResourceHub.tsx`)**: Added **Verify** and **Flag Mismatch** buttons (with quick presets `Wrong question`, `Cut off`, `Wrong paper`, `Missing`, plus custom note) on the Answer Pairing & Verification Strip.
- **Review Flag API & GitHub Dispatch (`apps/web/src/app/api/review/route.ts`, `packages/shared/src/types.ts`, `packages/shared/src/validation.ts`)**: Added `MISMATCH_FLAGGED` to `ReviewIssueType`, `ReviewFlagPayloadSchema`, and `POST /api/review` to update `answers.verification_status`, create `PENDING` `review_items`, and fire GitHub `repository_dispatch` (`paperforge_fix_mismatch`).
- **GitHub Actions Cloud Agent (`.github/workflows/fix-flagged-answer.yml`, `scripts/fix_flagged_answer.py`)**: Triggers on `repository_dispatch`, `workflow_dispatch`, or 6-hourly cron; re-crops from `_MS_.pdf` in Supabase Storage via `PyMuPDF` if present, or runs Groq candidate matching / worked-solution diagnosis (`tests/review_flag.test.mjs`: 4/4 passing, `npm run build` passing, Snyk Code scan 0 issues).
- **Required Secrets**:
  - **Vercel**: `GITHUB_DISPATCH_TOKEN` (fine-grained PAT with `Actions: write` / `Contents: write` on `Arjundevjha/PaperForge`).
  - **GitHub Repo Secrets**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`.
