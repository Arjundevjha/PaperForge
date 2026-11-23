import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DifficultySchema } from '../packages/shared/src/validation.ts';
import { classifyDifficulty } from '../packages/classification/src/matcher.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('DifficultySchema accepts EASY, MEDIUM and HARD', () => {
  for (const value of ['EASY', 'MEDIUM', 'HARD']) {
    assert.equal(DifficultySchema.safeParse(value).success, true, value);
  }
});

test('DifficultySchema rejects unknown or lowercase values', () => {
  for (const value of ['EXTREME', 'easy', 'medium', 'hard', '', null, undefined]) {
    assert.equal(DifficultySchema.safeParse(value).success, false, String(value));
  }
});

test('classifyDifficulty tags a short simple question as EASY', () => {
  const difficulty = classifyDifficulty(
    'mathematics',
    'Find the value of x when 2x + 3 = 7.',
    3
  );
  assert.equal(difficulty, 'EASY');
});

test('classifyDifficulty tags "Prove that ..." with 5+ marks as HARD', () => {
  const difficulty = classifyDifficulty(
    'mathematics',
    'Prove that for all positive integers n, the sum of the first n terms is given by the stated expression.',
    6
  );
  assert.equal(difficulty, 'HARD');
});

test('classifyDifficulty returns MEDIUM for typical mid-weight stems', () => {
  const difficulty = classifyDifficulty(
    'mathematics',
    'A curve has equation y = x^3 - 6x^2 + 9x. Find the coordinates of the stationary points and determine their nature.',
    5
  );
  assert.equal(difficulty, 'MEDIUM');
});

test('classifyDifficulty is deterministic for identical input', () => {
  const text = 'Differentiate the function and state the domain of the derivative.';
  assert.equal(classifyDifficulty('mathematics', text, 4), classifyDifficulty('mathematics', text, 4));
});

test('matcher.ts exports the classifyDifficulty heuristic and difficulty field', () => {
  const src = read('packages/classification/src/matcher.ts');
  assert.match(src, /export function classifyDifficulty/);
  assert.match(src, /difficulty\?: Difficulty/);
});

test('a migration adds questions.difficulty with an index', () => {
  const dir = path.join(repoRoot, 'packages/db/supabase/migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql'));
  const migration = files
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .find((sql) => /ALTER TABLE public\.questions\s+ADD COLUMN IF NOT EXISTS difficulty TEXT/i.test(sql));
  assert.ok(migration, 'expected a migration adding questions.difficulty');
  assert.match(migration, /idx_questions_difficulty/);
});

test('groq.ts handles difficulty with heuristic fallback', () => {
  const src = read('packages/classification/src/groq.ts');
  assert.match(src, /difficulty/);
  assert.match(src, /classifyDifficulty/);
});

test('offline Groq pipeline validates difficulty against EASY/MEDIUM/HARD', () => {
  const src = read('scripts/classify_and_verify_groq.ts');
  assert.match(src, /VALID_DIFFICULTY/);
  assert.match(src, /'EASY'/);
  assert.match(src, /'MEDIUM'/);
  assert.match(src, /'HARD'/);
});

test('db-sync maps difficulty from Supabase rows into questions', () => {
  const src = read('apps/web/src/lib/supabase/db-sync.ts');
  assert.match(src, /difficulty: q\.difficulty \|\| undefined/);
});

test('question bank matrix exposes a difficulty filter', () => {
  const src = read('apps/web/src/components/questions/QuestionBankMatrix.tsx');
  assert.match(src, /selectedDifficulty/);
  assert.match(src, /q\.difficulty/);
});
