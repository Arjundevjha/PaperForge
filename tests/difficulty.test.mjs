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
