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

  // VJC 2022 Prelim P2 Q3: Must have 2 slices and verified rational function asymptotes working
  const vjcRaw = execSync('python3 scripts/diagnose.py --question vjc-2022-p2-q03 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const vjcQuestions = JSON.parse(vjcRaw);
  const vjcQ3 = vjcQuestions.find((q) => q.id === 'vjc-2022-p2-q03');
  assert.ok(vjcQ3, 'vjc-2022-p2-q03 must exist');
  assert.ok(vjcQ3.answerSlicesCount >= 2, 'vjc-2022-p2-q03 must have at least 2 solution slices');
  assert.ok(vjcQ3.answerSnippet.includes('asymptotes'), 'Must contain rational function asymptotes working');

  // Tandem Pairing Engine: 5/5 Sample Invariant
  const sampleRaw = execSync('python3 scripts/tandem_diagnose.py --sample', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  assert.ok(sampleRaw.includes('ALL 5 SAMPLES PASSED'), 'Tandem pairing sample must pass 5/5');

  // 6. EJC 2020 Prelim P1 Q2 & JPJC 2021 Promo Q6 Regression Invariants
  const ejc20Raw = execSync('python3 scripts/diagnose.py --diagnose-answer ejc-2020-p1-q02 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const ejc20Diag = JSON.parse(ejc20Raw);
  assert.strictEqual(ejc20Diag.targetQnum, 2, 'Target must be Q2');
  assert.strictEqual(ejc20Diag.producedSlices, 1, 'Must produce 1 authentic solution slice');
  assert.ok(ejc20Diag.slices[0].height >= 400, 'Answer slice must be full working (height >= 400px), not 77px tangent equation');

  const jpjc21Raw = execSync('python3 scripts/diagnose.py --question jpjc-2021-p1-q06 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const jpjc21Questions = JSON.parse(jpjc21Raw);
  const jpjc21Q6 = jpjc21Questions.find((q) => q.id === 'jpjc-2021-p1-q06');
  assert.ok(jpjc21Q6, 'jpjc-2021-p1-q06 must exist');
  assert.ok(!jpjc21Q6.textSnippet.includes('NYJC'), 'Corrupted NYJC text must be eliminated');
  assert.ok(jpjc21Q6.textSnippet.includes('Cartesian equation of line L1'), 'Must have authentic JPJC 3D lines text');

  // 7. Multi-line & Reverse Header Answer Key Invariants (DHS 2023 P2 Q4, RI 2024 Promo Q1, TMJC 2025 P2 Q1)
  const dhs23Raw = execSync('python3 scripts/diagnose.py --diagnose-answer dhs-2023-p2-q04 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const dhs23Diag = JSON.parse(dhs23Raw);
  assert.strictEqual(dhs23Diag.targetQnum, 4, 'Target must be Q4');
  assert.ok(dhs23Diag.producedSlices >= 1, 'DHS 2023 P2 Q4 must produce at least 1 solution slice');
  assert.ok(dhs23Diag.slices[0].height >= 500, 'DHS 2023 P2 Q4 slice must be full solution (height >= 500px)');

  const ri24Raw = execSync('python3 scripts/diagnose.py --diagnose-answer ri-2024-p1-q01 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const ri24Diag = JSON.parse(ri24Raw);
  assert.strictEqual(ri24Diag.targetQnum, 1, 'Target must be Q1');
  assert.ok(ri24Diag.producedSlices >= 1, 'RI 2024 Promo Q1 must produce at least 1 solution slice');
  assert.ok(ri24Diag.slices[0].height >= 500, 'RI 2024 Promo Q1 slice must be full solution (height >= 500px)');

  const tmjc25Raw = execSync('python3 scripts/diagnose.py --diagnose-answer tmjc-2025-p2-q01 --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const tmjc25Diag = JSON.parse(tmjc25Raw);
  assert.strictEqual(tmjc25Diag.targetQnum, 1, 'Target must be Q1');
  assert.ok(tmjc25Diag.producedSlices >= 1, 'TMJC 2025 P2 Q1 must produce at least 1 solution slice');
  assert.ok(tmjc25Diag.slices[0].height >= 500, 'TMJC 2025 P2 Q1 slice must be full solution (height >= 500px)');
});

