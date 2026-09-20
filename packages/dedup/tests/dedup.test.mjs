import test from 'node:test';
import assert from 'node:assert';
import { hashNormalizedText, normalizeText } from '../src/hash.ts';
import { classifyQuestionPair } from '../src/classifier.ts';

test('normalizeText handles whitespace, punctuation and casing', () => {
  const t1 = 'Calculate  the   enthalpy change, \\Delta H, for reaction (1).';
  const t2 = 'calculate the enthalpy change delta h for reaction 1 ';
  assert.strictEqual(normalizeText(t1), normalizeText(t2));
  assert.strictEqual(hashNormalizedText(t1), hashNormalizedText(t2));
});

test('classifyQuestionPair identifies exact duplicates', () => {
  const qA = { id: 'q1', textContent: 'Deduce the structural formula of Compound A. [2]', marks: 2 };
  const qB = { id: 'q2', textContent: '  deduce the structural formula of compound a. [2]  ', marks: 2 };

  const result = classifyQuestionPair(qA, qB);
  assert.strictEqual(result.outcome, 'EXACT_DUPLICATE');
  assert.strictEqual(result.textSimilarity, 1.0);
});

test('classifyQuestionPair preserves legitimate numerical variants', () => {
  const qA = {
    id: 'q1',
    textContent: 'A 25.0 cm3 sample of 0.100 mol dm-3 HCl requires 18.5 cm3 of NaOH for complete neutralisation. Calculate concentration.',
    marks: 3,
  };
  const qB = {
    id: 'q2',
    textContent: 'A 20.0 cm3 sample of 0.250 mol dm-3 HCl requires 32.4 cm3 of NaOH for complete neutralisation. Calculate concentration.',
    marks: 3,
  };

  const result = classifyQuestionPair(qA, qB);
  assert.strictEqual(result.outcome, 'POSSIBLE_VARIANT');
  assert.ok(result.textSimilarity >= 0.60);
});

test('classifyQuestionPair correctly categorises distinct questions as UNIQUE', () => {
  const qA = { id: 'q1', textContent: 'Explain the trend in first ionisation energies across Period 3. [3]', marks: 3 };
  const qB = { id: 'q2', textContent: 'State the reagents and conditions for the conversion of benzene to nitrobenzene. [2]', marks: 2 };

  const result = classifyQuestionPair(qA, qB);
  assert.strictEqual(result.outcome, 'UNIQUE');
  assert.ok(result.textSimilarity < 0.40);
});
