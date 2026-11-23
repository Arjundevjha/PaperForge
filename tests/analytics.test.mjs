import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSyllabusCoverage, buildSyllabusCoverageCsv } from '../packages/shared/src/analytics.ts';
import { SINGAPORE_A_LEVEL_SYLLABI } from '../packages/shared/src/syllabus.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function read(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function makeQuestion(overrides) {
  const q = overrides || {};
  return {
    id: q.id || 'q_math_01_01',
    sourceId: 'src_test_math_2025_p1',
    questionNumber: q.questionNumber || '1(a)',
    parentQuestionId: null,
    subject: q.subject || 'mathematics',
    chapter: q.chapter || 'Functions and Graphs',
    topicId: null,
    subtopic: q.subtopic || null,
    subtopicId: q.subtopicId ?? null,
    questionType: q.questionType || 'structured',
    syllabusVersionId: 'v2026.3',
    textContent: q.textContent || 'Given the function f(x) = x^2, state its domain and range.',
    marks: q.marks ?? 4,
    textHash: q.textHash || 'hash',
    visualHash: null,
    regions: [],
    diagramUrl: q.diagramUrl ?? undefined,
    provenance: q.provenance || {
      school: 'RI',
      year: 2025,
      paperType: 'PRELIM',
      paperNumber: 1,
      questionNumber: '1(a)',
      sourceDocumentId: 'src_test_math_2025_p1',
      citation: '[RI 2025 H2 Mathematics Prelim P1 Q1(a)]',
    },
    status: 'PUBLISHED',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  };
}

function makeAnswer(overrides) {
  const a = overrides || {};
  return {
    id: a.id || 'a_q_math_01_01',
    sourceId: 'src_test_math_2025_p1',
    questionId: a.questionId || 'q_math_01_01',
    questionNumber: a.questionNumber || '1(a)',
    questionType: 'structured',
    topicId: null,
    subtopicId: null,
    solutionSourceId: null,
    solutionSourceFilename: null,
    answerContent: 'The domain is all real numbers and the range is all real numbers.',
    answerHash: 'hash',
    markSchemeNotes: '',
    diagramUrl: a.diagramUrl ?? undefined,
    regions: [],
    provenance: {
      school: 'RI',
      year: 2025,
      paperType: 'PRELIM',
      paperNumber: 1,
      questionNumber: '1(a)',
      sourceDocumentId: 'src_test_math_2025_p1',
      citation: '[RI 2025 H2 Mathematics Prelim P1 Q1(a)]',
    },
    verificationStatus: 'VERIFIED',
    status: 'VERIFIED',
  };
}

function allSubtopics(coverage) {
  return coverage.chapters.flatMap((c) => c.subtopics);
}

test('computeSyllabusCoverage handles an empty question bank as fully uncovered', () => {
  const result = computeSyllabusCoverage('mathematics', []);
  const totalSubtopics = Object.values(SINGAPORE_A_LEVEL_SYLLABI)
    .filter((s) => s.subjectId === 'mathematics')
    .flatMap((s) => s.chapters)
    .flatMap((c) => c.subtopics).length;

  assert.equal(result.overall.coveredSubtopics, 0);
  assert.equal(result.overall.totalSubtopics, totalSubtopics);
  assert.equal(result.overall.questions, 0);
  assert.equal(result.overall.questionsWithAnswer, 0);
  assert.equal(result.overall.coveragePct, 0);
});

test('computeSyllabusCoverage marks a subtopic covered via primary subtopicId and tracks answers/diagrams', () => {
  const question = makeQuestion({ id: 'q_math_01_01', subtopicId: 'math-01-01' });
  const answer = makeAnswer({ questionId: 'q_math_01_01', diagramUrl: 'https://cdn.paperforge.sg/answers/q_math_01_01.png' });
  const answers = new Map([['q_math_01_01', answer]]);

  const result = computeSyllabusCoverage('mathematics', [question], answers);
  const fnSub = allSubtopics(result).find((s) => s.id === 'math-01-01');

  assert.ok(fnSub, 'expected math-01-01 subtopic to exist');
  assert.equal(fnSub.covered, true);
  assert.equal(fnSub.gap, false);
  assert.equal(fnSub.questions.length, 1);
  assert.equal(fnSub.questionsWithAnswer.length, 1);
  assert.equal(fnSub.questionsWithDiagram.length, 1);

  const gapSub = allSubtopics(result).find((s) => s.id === 'math-02-01');
  assert.ok(gapSub, 'expected math-02-01 subtopic to exist');
  assert.equal(gapSub.covered, false);
  assert.equal(gapSub.gap, true);
});

test('computeSyllabusCoverage falls back to syllabus keyword matching when subtopicId is missing', () => {
  const question = makeQuestion({
    id: 'q_math_fns_01',
    subtopicId: null,
    textContent: 'Given the function f(x) = x^2, state its domain and range for all real numbers.',
  });

  const result = computeSyllabusCoverage('mathematics', [question]);
  const fnSub = allSubtopics(result).find((s) => s.id === 'math-01-01');

  assert.ok(fnSub, 'expected math-01-01 subtopic to exist');
  assert.equal(fnSub.covered, true);
});

test('computeSyllabusCoverage overall reports at least one covered subtopic for mathematics', () => {
  const question = makeQuestion({ id: 'q_math_01_01', subtopicId: 'math-01-01' });
  const result = computeSyllabusCoverage('mathematics', [question]);

  assert.equal(result.overall.coveredSubtopics, 1);
  assert.ok(result.overall.coveragePct > 0);
  assert.equal(result.overall.questions, 1);
  assert.equal(result.overall.questionsWithAnswer, 0);
});

test('buildSyllabusCoverageCsv emits header and per-subtopic rows', () => {
  const question = makeQuestion({ id: 'q_math_01_01', subtopicId: 'math-01-01' });
  const result = computeSyllabusCoverage('mathematics', [question]);
  const csv = buildSyllabusCoverageCsv(result.chapters);

  const lines = csv.trim().split('\n');
  assert.equal(lines[0], 'chapter,chapter_id,subtopic,subtopic_id,covered,questions,questions_with_answer,questions_with_diagram,gap');
  assert.ok(lines.length > 1);
  assert.ok(lines.some((l) => l.includes('math-01-01') && l.includes('true')));
  assert.ok(lines.some((l) => l.includes('math-02-01') && l.includes('false')));
});

test('GET /api/analytics/syllabus route exists and computes coverage', () => {
  const src = read('apps/web/src/app/api/analytics/syllabus/route.ts');
  assert.match(src, /export async function GET/);
  assert.match(src, /computeSyllabusCoverage/);
  assert.match(src, /SubjectIdSchema/);
  assert.match(src, /syncAllQuestionsFromDb/);
});

test('GET /api/analytics/syllabus/export route exists and returns text/csv', () => {
  const src = read('apps/web/src/app/api/analytics/syllabus/export/route.ts');
  assert.match(src, /export async function GET/);
  assert.match(src, /text\/csv/);
  assert.match(src, /buildSyllabusCoverageCsv/);
  assert.match(src, /subject/);
});
