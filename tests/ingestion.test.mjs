import test from 'node:test';
import assert from 'node:assert/strict';
import { PaperForgeDataStore } from '../packages/db/src/store.ts';
import {
  REAL_PAPER_3_PACKAGE,
  REAL_PAPER_4_PACKAGE,
  ingestPaperPackage,
} from '../packages/db/src/real-papers.ts';

test('Production Exam Ingestion — Package Structure & Integrity', () => {
  assert.equal(REAL_PAPER_3_PACKAGE.questions.length, 13);
  assert.equal(REAL_PAPER_3_PACKAGE.answers.length, 13);
  assert.equal(REAL_PAPER_3_PACKAGE.source.school, 'JPJC');
  assert.equal(REAL_PAPER_3_PACKAGE.source.year, 2022);
  assert.ok(REAL_PAPER_3_PACKAGE.source.sourceHash.length === 64);

  assert.equal(REAL_PAPER_4_PACKAGE.questions.length, 13);
  assert.equal(REAL_PAPER_4_PACKAGE.answers.length, 13);
  assert.equal(REAL_PAPER_4_PACKAGE.source.school, 'EJC');
  assert.equal(REAL_PAPER_4_PACKAGE.source.year, 2022);
  assert.ok(REAL_PAPER_4_PACKAGE.source.sourceHash.length === 64);
});

test('Production Exam Ingestion — Clean Slate, Ingestion & 1:1 Invariant', () => {
  const store = new PaperForgeDataStore();
  store.clearAllData();

  assert.equal(store.listSources().length, 0);
  assert.equal(store.listQuestions().length, 0);

  // Ingest Paper 3
  const res3 = ingestPaperPackage(store, REAL_PAPER_3_PACKAGE);
  assert.equal(res3.success, true);
  assert.equal(res3.questionsIngested, 13);
  assert.equal(res3.answersIngested, 13);
  assert.equal(store.listSources().length, 1);
  assert.equal(store.listQuestions().length, 13);

  // Invariant: 1:1 Question-to-Answer sync
  for (const q of store.listQuestions()) {
    const a = store.getAnswerByQuestionId(q.id);
    assert.ok(a, `Answer must exist for question ${q.id}`);
    assert.equal(a.questionId, q.id);
    assert.equal(a.questionNumber, q.questionNumber);
    assert.equal(a.status, 'VERIFIED');
  }

  // Idempotency: Duplicate ingestion must be rejected via SHA-256 source hash
  const dupRes = ingestPaperPackage(store, REAL_PAPER_3_PACKAGE);
  assert.equal(dupRes.success, false);
  assert.equal(dupRes.duplicate, true);
  assert.match(dupRes.message, /Hash collision detected/);
  assert.equal(store.listSources().length, 1); // No new source created

  // Ingest Paper 4
  const res4 = ingestPaperPackage(store, REAL_PAPER_4_PACKAGE);
  assert.equal(res4.success, true);
  assert.equal(res4.questionsIngested, 13);
  assert.equal(store.listSources().length, 2);
  assert.equal(store.listQuestions().length, 26);
});

test('Production Exam Ingestion — Visual Diagram & Text Hashing', () => {
  const store = new PaperForgeDataStore();
  store.clearAllData();

  ingestPaperPackage(store, REAL_PAPER_3_PACKAGE);
  const questions = store.listQuestions();

  // Questions 4, 5, 8, 9, 10, 11, 13 have diagrams and must have visualHash
  const diagramQ = questions.find((q) => q.questionNumber === '4');
  assert.ok(diagramQ);
  assert.ok(diagramQ.visualHash, 'Question 4 should have a visual diagram hash');
  assert.equal(diagramQ.visualHash.length, 64);

  // Question 1 has no diagram and visualHash should be null
  const noDiagramQ = questions.find((q) => q.questionNumber === '1');
  assert.ok(noDiagramQ);
  assert.equal(noDiagramQ.visualHash, null);

  // Text hashes must be 64-character SHA-256 strings
  for (const q of questions) {
    assert.equal(q.textHash.length, 64);
  }
});
