import test from 'node:test';
import assert from 'node:assert';
import { classifyQuestionContent } from '../src/matcher.ts';

test('classifyQuestionContent accurately classifies Organic Carbonyl question', () => {
  const text = 'Compound P reacts with 2,4-DNPH to form an orange precipitate, and gives a positive Tollens test. Deduce the carbonyl functional group.';
  const result = classifyQuestionContent('chemistry', text);

  assert.strictEqual(result.subject, 'chemistry');
  assert.strictEqual(result.chapter, 'Organic Chemistry — Carbonyl, Carboxylic & Nitrogen Compounds');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent accurately classifies Physics Gravitation question', () => {
  const text = 'A satellite of mass m is in a geostationary orbit at distance r from the Earth center. Derive the expression for gravitational field strength and escape velocity.';
  const result = classifyQuestionContent('physics', text);

  assert.strictEqual(result.subject, 'physics');
  assert.strictEqual(result.chapter, 'Circular Motion & Gravitation');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent routes ambiguous/short question to review queue', () => {
  const text = 'Part (ii) Hence determine the final state.';
  const result = classifyQuestionContent('chemistry', text);

  assert.strictEqual(result.needsReview, true);
  assert.ok(result.confidence < 0.70);
});
