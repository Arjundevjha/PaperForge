import test from 'node:test';
import assert from 'node:assert';
import { PaperForgeDataStore } from '../src/store.ts';

test('PaperForgeDataStore loads seed data with valid provenance and answers', () => {
  const store = new PaperForgeDataStore();

  const sources = store.listSources();
  assert.ok(sources.length >= 4);

  const questions = store.listQuestions();
  assert.ok(questions.length >= 6);

  // Every question should have an answer and a valid citation
  for (const q of questions) {
    assert.ok(q.provenance.citation.startsWith('['));
    assert.ok(q.provenance.citation.endsWith(']'));
    const answer = store.getAnswerByQuestionId(q.id);
    assert.ok(answer, `Question ${q.id} must have a matching answer`);
  }
});

test('PaperForgeDataStore filters questions by subject and Singapore school', () => {
  const store = new PaperForgeDataStore();

  const chemQuestions = store.listQuestions({ subject: 'chemistry' });
  assert.ok(chemQuestions.length >= 4);
  assert.ok(chemQuestions.every((q) => q.subject === 'chemistry'));

  const riQuestions = store.listQuestions({ school: 'RI' });
  assert.ok(riQuestions.length >= 2);
  assert.ok(riQuestions.every((q) => q.provenance.school === 'RI'));
});

test('PaperForgeDataStore manages worksheets and manifest retrieval', () => {
  const store = new PaperForgeDataStore();
  const worksheets = store.listWorksheets('chemistry');

  assert.ok(worksheets.length >= 2);
  const ws1 = worksheets[0];
  assert.strictEqual(ws1.worksheetNumber, 'WS-01');

  const { questions, answers } = store.getWorksheetQuestions(ws1.id);
  assert.strictEqual(questions.length, ws1.manifest.questions.length);
  assert.strictEqual(answers.length, questions.length);
});

test('PaperForgeDataStore handles review queue decisions', () => {
  const store = new PaperForgeDataStore();
  const pending = store.listReviewItems('PENDING');
  assert.ok(pending.length >= 2);

  const resolved = store.resolveReviewItem(
    pending[0].id,
    'APPROVE',
    'tutor_dr_low',
    'Verified against 2026 syllabus.'
  );

  assert.ok(resolved);
  assert.strictEqual(resolved.status, 'RESOLVED');
  assert.strictEqual(resolved.reviewedBy, 'tutor_dr_low');
});

test('PaperForgeDataStore manages user profiles and RBAC personas', () => {
  const store = new PaperForgeDataStore();

  const admin = store.getUserById('usr_admin_01');
  assert.ok(admin);
  assert.strictEqual(admin.role, 'ADMIN');

  const teacher = store.getUserByEmail('clara.tan@paperforge.sg');
  assert.ok(teacher);
  assert.strictEqual(teacher.role, 'TEACHER');

  const newUser = store.upsertUser({
    id: 'usr_new_01',
    email: 'new.tutor@paperforge.sg',
    name: 'Mr. David Tan',
    role: 'TEACHER',
  });

  assert.strictEqual(newUser.id, 'usr_new_01');
  assert.strictEqual(store.getUserById('usr_new_01')?.name, 'Mr. David Tan');
  assert.strictEqual(store.listUsers().length, 3);
});
