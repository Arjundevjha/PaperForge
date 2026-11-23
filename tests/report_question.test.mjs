import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReportQuestionPayloadSchema } from '../packages/shared/src/validation.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

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
