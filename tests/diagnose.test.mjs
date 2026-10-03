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
  assert.ok(targetQ.answerSlicesCount >= 2, 'rvhs-2019-p1-q03 must have at least 2 solution slices');

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

  // 5. User-Reported Question Defect Fix Invariants
  // CJC 2025 Promo Q12: Must have 3 slices and authentic text, not Complex Numbers
  const cjcRaw = execSync('python3 scripts/diagnose.py --question cjc-2025-p1-q12 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const cjcQuestions = JSON.parse(cjcRaw);
  assert.ok(cjcQuestions.length > 0, 'Must find cjc-2025-p1-q12');
  const cjcQ12 = cjcQuestions.find((q) => q.id === 'cjc-2025-p1-q12');
  assert.ok(cjcQ12, 'cjc-2025-p1-q12 must exist');
  assert.strictEqual(cjcQ12.answerSlicesCount, 3, 'cjc-2025-p1-q12 must have 3 solution slices');
  assert.ok(!cjcQ12.answerSnippet.includes('9758/02/J2PRELIM/2025 4'), 'Toxic complex numbers text must be eliminated');

  // JPJC 2012 Prelim P2 Q5: Must have 2 slices (not clipped to part i)
  const jpjc12Raw = execSync('python3 scripts/diagnose.py --question jpjc-2012-p1-q05 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const jpjc12Questions = JSON.parse(jpjc12Raw);
  const jpjc12Q5 = jpjc12Questions.find((q) => q.id === 'jpjc-2012-p1-q05');
  assert.ok(jpjc12Q5, 'jpjc-2012-p1-q05 must exist');
  assert.strictEqual(jpjc12Q5.answerSlicesCount, 2, 'jpjc-2012-p1-q05 must have 2 solution slices spanning all parts');

  // JPJC 2022 Promo Q13: Must have 2 slices
  const jpjc22Raw = execSync('python3 scripts/diagnose.py --question jpjc-2022-p1-q13 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const jpjc22Questions = JSON.parse(jpjc22Raw);
  const jpjc22Q13 = jpjc22Questions.find((q) => q.id === 'jpjc-2022-p1-q13');
  assert.ok(jpjc22Q13, 'jpjc-2022-p1-q13 must exist');
  assert.strictEqual(jpjc22Q13.answerSlicesCount, 2, 'jpjc-2022-p1-q13 must have 2 solution slices');
});
