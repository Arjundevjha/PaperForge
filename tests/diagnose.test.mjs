import test from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('PaperForge Diagnostic Tooling (scripts/diagnose.py): Persistent Health & Audit Invariants', () => {
  // 1. Health check JSON output
  const healthRaw = execSync('python3 scripts/diagnose.py --health --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const health = JSON.parse(healthRaw);
  assert.strictEqual(health.status, 'HEALTHY', 'Store must be healthy');
  assert.ok(health.totalQuestions >= 1000, 'Banked questions must exceed 1,000');
  assert.ok(health.questionsWithAnswerScreenshots >= 800, 'Over 800 questions must have authentic solution crops');
  assert.strictEqual(health.desktopDeliverable.exists, true, 'Desktop deliverable PDF must exist');

  // 2. Crop audit JSON output
  const cropsRaw = execSync('python3 scripts/diagnose.py --crops --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const crops = JSON.parse(cropsRaw);
  assert.ok(crops.totalAnswerFiles >= 2400, 'Must have at least 2,400 cropped answer slices and composites');
  assert.ok(crops.answerSlices >= 1600, 'Must have multi-slice pagination assets');

  // 3. Question query JSON output
  const questionRaw = execSync('python3 scripts/diagnose.py --question rvhs --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const questions = JSON.parse(questionRaw);
  assert.ok(Array.isArray(questions), 'Question query must return an array');
  assert.ok(questions.length > 0, 'Must find matching questions for RVHS');
  const targetQ = questions.find((q) => q.id === 'rvhs-2019-p1-q03');
  assert.ok(targetQ, 'Question rvhs-2019-p1-q03 must exist');
  assert.strictEqual(targetQ.answerSlicesCount, 2, 'rvhs-2019-p1-q03 must have 2 solution slices');

  // 4. Ground-Truth Healed Provenance Invariant (EJC Promo Q4)
  const ejcRaw = execSync('python3 scripts/diagnose.py --question ejc-2023-p1-q04 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const ejcQuestions = JSON.parse(ejcRaw);
  assert.ok(ejcQuestions.length > 0, 'Must find ejc-2023-p1-q04');
  const ejcQ4 = ejcQuestions[0];
  assert.strictEqual(ejcQ4.sourcePaper, 'EJC_H2_Promo_2023_(Qn)_15028.pdf', 'Must match authentic EJC Promo QP filename');
  assert.ok(ejcQ4.displayProvenance.includes('Promo'), 'Provenance must cite Promo rather than Prelim');
});
