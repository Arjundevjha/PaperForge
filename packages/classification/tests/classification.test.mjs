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

test('classifyQuestionContent accurately classifies SEAB 9758 Functions and Graphs', () => {
  const text = 'The function f is defined by f: x |-> (x^2 - 2x) / (x^2 - 1), x in R, x > 1. Sketch the graph of f and show that f has an inverse. Find f^(-1)(x) and state its domain.';
  const result = classifyQuestionContent('mathematics', text);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Functions and Graphs');
  assert.strictEqual(result.subtopic, 'Functions');
  assert.strictEqual(result.syllabusVersion, 'SEAB-9758-Official');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent accurately classifies SEAB 9758 Sequences and Series (AP/GP)', () => {
  const text = 'A sequence of numbers has nth term u_n = a*r^(n-1). Given that the sum of the first 3 terms is 7 and the sum to infinity is 8, find the common ratio r and first term a.';
  const result = classifyQuestionContent('mathematics', text);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Sequences and Series');
  assert.strictEqual(result.subtopic, 'Arithmetic and Geometric Progressions');
  assert.strictEqual(result.syllabusVersion, 'SEAB-9758-Official');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent accurately classifies SEAB 9758 Vectors (3D Lines and Planes)', () => {
  const text = 'The planes p1 and p2 have equations p1: r . (2, -1, 2) = 5 and p2: r . (1, 2, -2) = 7. Find a vector equation of the line of intersection l between p1 and p2, and find the acute angle between the planes.';
  const result = classifyQuestionContent('mathematics', text);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Vectors');
  assert.strictEqual(result.subtopic, 'Lines and Planes in 3D');
  assert.strictEqual(result.syllabusVersion, 'SEAB-9758-Official');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent accurately classifies SEAB 9758 Complex Numbers', () => {
  const text = 'Given that 1 + 2i is a root of the cubic equation with real coefficients z^3 + az^2 + bz + 15 = 0, use the conjugate root theorem to find the remaining roots and sketch them on an Argand diagram.';
  const result = classifyQuestionContent('mathematics', text);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Complex Numbers');
  assert.strictEqual(result.syllabusVersion, 'SEAB-9758-Official');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent accurately classifies SEAB 9758 Calculus (Integration)', () => {
  const text = 'By using the substitution u = 1 + t^3, find the exact value of the integral from 0 to 2 of (t^5 / sqrt(1 + t^3)) dt without using a calculator.';
  const result = classifyQuestionContent('mathematics', text);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Calculus');
  assert.strictEqual(result.subtopic, 'Integration Techniques');
  assert.strictEqual(result.syllabusVersion, 'SEAB-9758-Official');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

test('classifyQuestionContent accurately classifies SEAB 9758 Probability and Statistics (Hypothesis Testing)', () => {
  const text = 'A random sample of 50 packets is taken. Test at the 5% level of significance whether the population mean weight has changed, stating the null hypothesis H0 and alternative hypothesis H1.';
  const result = classifyQuestionContent('mathematics', text);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Probability and Statistics');
  assert.strictEqual(result.subtopic, 'Hypothesis Testing');
  assert.strictEqual(result.syllabusVersion, 'SEAB-9758-Official');
  assert.ok(result.confidence >= 0.85);
  assert.strictEqual(result.needsReview, false);
});

