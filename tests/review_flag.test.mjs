import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReviewFlagPayloadSchema } from '../packages/shared/src/validation.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

test('ReviewFlagPayloadSchema accepts valid MISMATCH_FLAGGED payload with defaults', () => {
  const parsed = ReviewFlagPayloadSchema.safeParse({
    questionId: 'njc-2012-p1-q07',
    reason: 'Wrong question',
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.issueType, 'MISMATCH_FLAGGED');
  assert.equal(parsed.data.verificationStatus, 'MISMATCH_FLAGGED');
});

test('ReviewFlagPayloadSchema accepts VERIFIED promotion payload', () => {
  const parsed = ReviewFlagPayloadSchema.safeParse({
    questionId: 'njc-2012-p1-q07',
    answerId: 'ans-njc-2012-p1-q07',
    verificationStatus: 'VERIFIED',
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.verificationStatus, 'VERIFIED');
});

test('ReviewFlagPayloadSchema rejects empty questionId', () => {
  const parsed = ReviewFlagPayloadSchema.safeParse({ questionId: '' });
  assert.equal(parsed.success, false);
});

test('scripts/fix_flagged_answer.py compiles and responds to --help', () => {
  const scriptPath = path.join(repoRoot, 'scripts', 'fix_flagged_answer.py');
  const out = execFileSync('python3', [scriptPath, '--help'], { encoding: 'utf8' });
  assert.match(out, /PaperForge Cloud Mismatch Auto-Fix Agent/);
  assert.match(out, /--sweep/);
});
