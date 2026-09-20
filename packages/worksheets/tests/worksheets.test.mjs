import test from 'node:test';
import assert from 'node:assert';
import {
  selectWorksheetQuestions,
  buildWorksheetManifest,
  compileWorksheetDocuments,
} from '../src/engine.ts';

const mockQuestions = [
  {
    id: 'q_ri_1',
    sourceId: 's1',
    questionNumber: '1',
    subject: 'chemistry',
    chapter: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    syllabusVersionId: 'v2026.3',
    textContent: 'Describe the mechanism of electrophilic addition of bromine to ethene.',
    marks: 4,
    textHash: 'hash1',
    regions: [],
    provenance: {
      school: 'RI',
      year: 2025,
      paperType: 'PRELIM',
      paperNumber: 2,
      questionNumber: '1',
      sourceDocumentId: 's1',
      citation: '[RI 2025 H2 Chemistry PRELIM P2 Q1]',
    },
    status: 'READY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'q_hci_1',
    sourceId: 's2',
    questionNumber: '2',
    subject: 'chemistry',
    chapter: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    syllabusVersionId: 'v2026.3',
    textContent: 'State the observations when benzene reacts with bromine in the presence of FeBr3.',
    marks: 3,
    textHash: 'hash2',
    regions: [],
    provenance: {
      school: 'HCI',
      year: 2024,
      paperType: 'PRELIM',
      paperNumber: 3,
      questionNumber: '2',
      sourceDocumentId: 's2',
      citation: '[HCI 2024 H2 Chemistry PRELIM P3 Q2]',
    },
    status: 'READY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

test('selectWorksheetQuestions selects diverse questions by school', () => {
  const selected = selectWorksheetQuestions(mockQuestions, {
    subject: 'chemistry',
    chapter: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    targetCount: 2,
  });

  assert.strictEqual(selected.length, 2);
  const schools = selected.map((q) => q.provenance.school);
  assert.ok(schools.includes('RI'));
  assert.ok(schools.includes('HCI'));
});

test('buildWorksheetManifest freezes question order and mark total', () => {
  const manifest = buildWorksheetManifest(
    'ws_421',
    1,
    'chemistry',
    'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    mockQuestions
  );

  assert.strictEqual(manifest.worksheetId, 'ws_421');
  assert.strictEqual(manifest.version, 1);
  assert.strictEqual(manifest.questions.length, 2);
  assert.deepStrictEqual(manifest.questions, ['q_ri_1', 'q_hci_1']);
  assert.strictEqual(manifest.totalMarks, 7);
  assert.ok(manifest.frozenAt);
});

test('compileWorksheetDocuments enforces answer matching invariant', async () => {
  const manifest = buildWorksheetManifest(
    'ws_421',
    1,
    'chemistry',
    'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    mockQuestions
  );

  const worksheet = {
    id: 'ws_421',
    worksheetNumber: 'WS-01',
    title: 'Organic Chemistry Practice',
    subject: 'chemistry',
    chapter: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    syllabusVersionId: 'v2026.3',
    version: 1,
    questionCount: 2,
    totalMarks: 7,
    status: 'READY',
    sourceCoverage: ['RI', 'HCI'],
    manifest,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Missing answer for q_hci_1 should throw invariant violation
  const incompleteAnswers = [
    {
      id: 'a1',
      sourceId: 's1',
      questionId: 'q_ri_1',
      questionNumber: '1',
      answerContent: 'Bromonium ion formation followed by attack by bromide ion.',
      answerHash: 'ahash1',
      provenance: mockQuestions[0].provenance,
      status: 'VERIFIED',
    },
  ];

  await assert.rejects(
    async () => {
      await compileWorksheetDocuments(worksheet, mockQuestions, incompleteAnswers);
    },
    /Invariant violation/
  );

  // Complete answers should succeed and return valid PDFs
  const completeAnswers = [
    ...incompleteAnswers,
    {
      id: 'a2',
      sourceId: 's2',
      questionId: 'q_hci_1',
      questionNumber: '2',
      answerContent: 'Reddish-brown liquid decolourises and white fumes of HBr are evolved.',
      markSchemeNotes: '1m for decolourisation, 1m for steamy fumes of HBr.',
      answerHash: 'ahash2',
      provenance: mockQuestions[1].provenance,
      status: 'VERIFIED',
    },
  ];

  const result = await compileWorksheetDocuments(worksheet, mockQuestions, completeAnswers);
  assert.ok(result.questionPdf.length > 500);
  assert.ok(result.answerPdf.length > 500);
});
