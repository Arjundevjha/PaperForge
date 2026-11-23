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
- **Review Flag API & GitHub Issue Trigger (`apps/web/src/app/api/review/route.ts`, `packages/shared/src/types.ts`, `packages/shared/src/validation.ts`)**: Added `MISMATCH_FLAGGED` to `ReviewIssueType`, `ReviewFlagPayloadSchema`, and `POST /api/review` to update `answers.verification_status`, create `PENDING` `review_items`, and open a structured GitHub Issue labeled `answer-mismatch` (with optional `ENABLE_CLOUD_DISPATCH=true` `repository_dispatch`).
- **Self-Documenting Support Skill & Knowledge Base (`.agents/skills/paperforge-mismatch-support/SKILL.md`, `docs/mismatch-patterns.md`, `docs/mismatch-triage-log.md`)**: Polls `gh issue list --label answer-mismatch --state open`, fast-paths via learned patterns, fixes crops/pairings from local `papers/` + `scripts/`, syncs to Supabase, and logs every fix back into `docs/mismatch-triage-log.md` and `docs/mismatch-patterns.md`.
- **GitHub Actions Cloud Agent (`.github/workflows/fix-flagged-answer.yml`, `scripts/fix_flagged_answer.py`)**: Optional cloud fallback (`tests/review_flag.test.mjs`: 4/4 passing, `npm run build` passing, Snyk Code scan 0 issues).
- **Required Secrets**:
  - **Vercel**: `GITHUB_DISPATCH_TOKEN` (fine-grained PAT with `Issues: write` — and `Actions: write` if using cloud dispatch — on `Arjundevjha/PaperForge`).
  - **GitHub Repo Secrets** *(only if using the GitHub Actions fallback)*: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`.

---

## 5. Error-Report Flow — Phase 1 (Added Nov 23, 2026)

**Loop**: Teacher Resource Hub "Report Question" → `POST /api/report-question` → PENDING `review_items` (`issue_type=ERROR_REPORT`) → GitHub issue labeled `question-error` → `scripts/fix_flagged_answer.py --sweep` sweeps `issue_type IN (MISMATCH_FLAGGED, ERROR_REPORT)`.

- **Schema/types (M1 `b1907c9`)**: `ReviewIssueType` += `ERROR_REPORT`; `ReportErrorKind`; `ReportQuestionPayloadSchema` (`questionId`, `answerId?`, `errorKind` default `MISC_ERROR`, `reason`).
- **API + shared lib (M2 `5fbda40`)**: New `apps/web/src/app/api/report-question/route.ts` (`POST` — validates payload, creates/upserts PENDING review item to Supabase, opens `question-error` issue via shared `apps/web/src/lib/github-issue.ts` `createGitHubIssue`; mismatch route now delegates to the shared lib — behavior unchanged).
- **Hub button (M3 `9761505`)**: "Report Question" button on the Answer Pairing & Verification Strip + inline panel (error kinds `MISSING_QUESTION | WRONG_PAIRING | INCOMPLETE_ANSWER | TYPO | STALE_SCREENSHOT | MISC_ERROR` + optional note → `handleReportQuestion` → `/api/report-question`).
- **Agent sweep (M4 `b50847c`)**: `fix_flagged_answer.py` `--sweep` query: `or=(issue_type.eq.MISMATCH_FLAGGED,issue_type.eq.ERROR_REPORT)`; reason note uses `details.errorKind`; `MISSING_QUESTION` items still short-circuit to queue.
- **Docs (M5 `4d382a2`)**: `.agents/skills/paperforge-mismatch-support/SKILL.md` polls both issue labels; new section 7 (error reports — `MISSING_QUESTION` manual triage vs re-crop flow).
- **Tests**: `tests/report_question.test.mjs` — 11/11 pass.
- **Security**: Snyk Code scan 0 issues on new/changed code; 2 pre-existing MEDIUM DOMXSS findings on `TeacherResourceHub.tsx` `<img src={getQuestionImageUrl/getAnswerImageUrl(...)}>` lines — noted, left untouched (not introduced by this phase).
- **Verification**: `npm test` 57/58 (1 pre-existing env failure: `tests/diagnose.test.mjs:21` Desktop deliverable PDF — same as before this phase); `tsc --noEmit` clean; `npm run build` clean (M3); graphify updated.
- **NOT pushed to remote** (continuation of the earlier push-hold: `git push` held pending user approval).

**Phase 2 next**: Syllabus analytics (`GET /api/analytics/syllabus` + `/analytics` page / SyllabusExplorer Coverage tab + CSV export).
**Phase 3 next**: Difficulty tagging (`difficulty` on questions via classify_and_verify_groq.ts + DB migration + db-sync mapping + QuestionBankMatrix filter).

---

## 6. Difficulty Tagging — Phase 3 (Completed by subagent session `ses_df9154ab8ffe1DpKuD2iRhI1ld`, user took over at "option 2")

**Loop**: Groq classifier (`scripts/classify_and_verify_groq.ts`) + `classifyWithGroq` (`packages/classification/src/groq.ts`, asks for `difficulty` + validates EASY/MEDIUM/HARD + `withDifficulty()` fallback) + heuristic (`classifyDifficulty` in `packages/classification/src/matcher.ts`) → `Question.difficulty` → db-sync maps to store → `/questions` bank shows a difficulty filter.

- **Worktree:** `/Users/abc/.local/share/opencode/worktree/e1b211/phase3-difficulty-tagging` (committed, not pushed)
- **Commits**: `ecd4107` chore(deps), `f27704d` types+validation+matcher, `57608fe` migration, `7a3cf97` groq+db-sync, `cbb12d0` UI filter
- **Files**: `packages/shared/src/types.ts` (+Difficulty, +`difficulty?` on Question/Answer), `packages/shared/src/validation.ts` (+DifficultySchema), `packages/classification/src/matcher.ts` (+classifyDifficulty, difficulty on ClassificationResult), `packages/classification/src/groq.ts` (+rubric, validated difficulty, withDifficulty fallback), `packages/db/src/schema.ts` (+difficulty on questions), `packages/db/supabase/migrations/20261124000000_add_question_difficulty.sql` (column + idx_questions_difficulty), `scripts/classify_and_verify_groq.ts` (+VALID_DIFFICULTY, marks in payload, heuristic backfill, difficulty counters), `apps/web/src/lib/supabase/db-sync.ts` (+difficulty mapping), `apps/web/src/components/questions/QuestionBankMatrix.tsx` (All/EASY/MEDIUM/HARD select + filter + row badge), `docs/difficulty-tagging.md`, `tests/difficulty.test.mjs` (12 tests)
- **Verification** (subagent-verified): `npm run test` 68/70 (2 pre-existing env failures: `tests/storage.test.mjs` — no `.env.local` in worktree, passes in main repo; `tests/diagnose.test.mjs` — pre-existing on main), `tsc --noEmit -p apps/web/tsconfig.json` clean, `npm run build` green (18 routes), `fallow` passes, Snyk 0 issues on new code (1 pre-existing MEDIUM DOMXSS in QuestionBankMatrix.tsx — same fingerprint on unmodified HEAD)
- **Note**: live Supabase column + backfill of existing rows NOT applied (migration added only; apply when ready: `ALTER TABLE questions ADD COLUMN difficulty TEXT;`).
- **Pending**: push (held for user approval).

**Phase 2 next**: Syllabus analytics (owned by Phase 2 worktree — see below.)
