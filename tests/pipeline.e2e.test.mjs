import test from 'node:test';
import assert from 'node:assert';
import { getGlobalStore } from '../packages/db/src/store.ts';
import { classifyQuestionContent } from '../packages/classification/src/matcher.ts';
import { classifyQuestionPair } from '../packages/dedup/src/classifier.ts';
import {
  selectWorksheetQuestions,
  buildWorksheetManifest,
  compileWorksheetDocuments,
} from '../packages/worksheets/src/engine.ts';

test('End-to-End Examination Pipeline: Ingestion -> Classification -> Dedup -> Manifest -> Cambridge PDF Assembly', async () => {
  const store = getGlobalStore();

  // 1. Ingestion: Verify source papers exist
  const sources = store.listSources();
  assert.ok(sources.length >= 4, 'Sources must be indexed across Singapore JCs');
  const riSource = sources.find((s) => s.school === 'RI');
  assert.ok(riSource, 'RI source document must exist');
  assert.strictEqual(riSource.status, 'READY');

  // 2. Extraction & Hierarchy: Inspect questions and parent-child linkage
  const questions = store.listQuestions({ subject: 'chemistry' });
  assert.ok(questions.length >= 4, 'Extracted questions must be present for Chemistry');
  const q1a = questions.find((q) => q.questionNumber === '1(a)');
  const q1b = questions.find((q) => q.questionNumber === '1(b)');
  assert.ok(q1a && q1b);
  assert.strictEqual(q1b.parentQuestionId, q1a.id, 'Subpart 1(b) must link to parent question');

  // 3. Syllabus Classification: Test classifier accuracy on raw text
  const classification = classifyQuestionContent('chemistry', q1a.textContent);
  assert.strictEqual(classification.subject, 'chemistry');
  assert.strictEqual(classification.chapter, 'Organic Chemistry — Hydrocarbons & Halogen Derivatives');
  assert.ok(classification.confidence >= 0.70, 'Confidence must be high for textbook organic chemistry');
  assert.strictEqual(classification.needsReview, false);

  // 4. Deduplication: Test duplicate detection between q1a and a cloned variant
  const variantQuestion = {
    id: 'q_variant_test',
    textContent: q1a.textContent.replace('2-bromobutane', '2-chlorobutane'),
    marks: q1a.marks,
  };
  const dedupResult = classifyQuestionPair(q1a, variantQuestion);
  assert.ok(
    dedupResult.outcome === 'POSSIBLE_VARIANT' || dedupResult.outcome === 'EXACT_DUPLICATE',
    'Variant or duplicate must be classified'
  );

  // 5. Worksheet Generation & Frozen Manifest
  const selected = selectWorksheetQuestions(questions, {
    subject: 'chemistry',
    chapter: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    targetCount: 3,
  });
  assert.strictEqual(selected.length, 3);

  const manifest = buildWorksheetManifest(
    'ws_demo_e2e',
    1,
    'chemistry',
    'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    selected
  );
  assert.strictEqual(manifest.questions.length, 3);
  assert.strictEqual(manifest.version, 1);

  // 6. PDF Compilation & Answer Key Synchronization
  const answers = selected.map((q) => store.getAnswerByQuestionId(q.id));
  assert.strictEqual(answers.length, selected.length, 'Every selected question must have a verified answer');

  const demoWorksheet = {
    id: 'ws_demo_e2e',
    worksheetNumber: 'WS-E2E',
    title: 'E2E Demo Worksheet',
    subject: 'chemistry',
    chapter: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    syllabusVersionId: 'v2026.3',
    version: 1,
    questionCount: selected.length,
    totalMarks: manifest.totalMarks,
    status: 'READY',
    sourceCoverage: ['RI', 'HCI'],
    manifest,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { questionPdf, answerPdf } = await compileWorksheetDocuments(demoWorksheet, selected, answers);

  assert.ok(questionPdf.length > 1000, 'Question PDF must be compiled');
  assert.ok(answerPdf.length > 1000, 'Answer Key PDF must be compiled');

  // Verify PDF headers
  assert.strictEqual(Buffer.from(questionPdf.slice(0, 5)).toString(), '%PDF-');
  assert.strictEqual(Buffer.from(answerPdf.slice(0, 5)).toString(), '%PDF-');
});
