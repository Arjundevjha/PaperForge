import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReportQuestionPayloadSchema } from '../packages/shared/src/validation.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function read(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('ReportQuestionPayloadSchema accepts a valid report with default errorKind', () => {
  const parsed = ReportQuestionPayloadSchema.safeParse({
    questionId: 'njc-2012-p1-q07',
    reason: 'Question is missing the final part',
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.errorKind, 'MISC_ERROR');
});

test('ReportQuestionPayloadSchema accepts every known errorKind', () => {
  const kinds = [
    'MISSING_QUESTION',
    'WRONG_PAIRING',
    'INCOMPLETE_ANSWER',
    'TYPO',
    'STALE_SCREENSHOT',
    'MISC_ERROR',
  ];
  for (const kind of kinds) {
    const parsed = ReportQuestionPayloadSchema.safeParse({ questionId: 'q1', errorKind: kind });
    assert.equal(parsed.success, true, `expected success for ${kind}`);
    assert.equal(parsed.data.errorKind, kind);
  }
});

test('ReportQuestionPayloadSchema rejects empty questionId', () => {
  const parsed = ReportQuestionPayloadSchema.safeParse({ questionId: '' });
  assert.equal(parsed.success, false);
});

test('ReportQuestionPayloadSchema rejects unknown errorKind', () => {
  const parsed = ReportQuestionPayloadSchema.safeParse({
    questionId: 'q1',
    errorKind: 'NOT_A_REAL_KIND',
  });
  assert.equal(parsed.success, false);
});

test('scripts/fix_flagged_answer.py compiles and responds to --help', () => {
  const scriptPath = path.join(repoRoot, 'scripts', 'fix_flagged_answer.py');
  const out = execFileSync('python3', [scriptPath, '--help'], { encoding: 'utf8' });
  assert.match(out, /PaperForge Cloud Mismatch Auto-Fix Agent/);
  assert.match(out, /--sweep/);
});

test('POST /api/report-question route exists with a POST handler and error-report references', () => {
  const src = read('apps/web/src/app/api/report-question/route.ts');
  assert.match(src, /export async function POST/);
  assert.match(src, /ReportQuestionPayloadSchema/);
  assert.match(src, /'ERROR_REPORT'/);
  assert.match(src, /addReviewItem/);
});

test('shared lib apps/web/src/lib/github-issue.ts exposes createGitHubIssue and triggerGitHubAgent', () => {
  const src = read('apps/web/src/lib/github-issue.ts');
  assert.match(src, /export async function createGitHubIssue/);
  assert.match(src, /export async function triggerGitHubAgent/);
});

test('review route delegates to the shared github-issue lib', () => {
  const src = read('apps/web/src/app/api/review/route.ts');
  assert.match(src, /createGitHubIssue/);
  assert.match(src, /triggerGitHubAgent/);
});

test('TeacherResourceHub strip has a Report Question button wired to POST /api/report-question', () => {
  const src = read('apps/web/src/components/hub/TeacherResourceHub.tsx');
  assert.match(src, /Report Question/);
  assert.match(src, /api\/report-question/);
  assert.match(src, /handleReportQuestion/);
});

test('TeacherResourceHub report panel offers error-report kinds and a send button', () => {
  const src = read('apps/web/src/components/hub/TeacherResourceHub.tsx');
  assert.match(src, /WRONG_PAIRING/);
  assert.match(src, /INCOMPLETE_ANSWER/);
  assert.match(src, /STALE_SCREENSHOT/);
  assert.match(src, /Send Report/);
});
