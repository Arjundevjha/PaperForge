import test from 'node:test';
import assert from 'node:assert';
import { parseQuestionMarker, extractMarksFromText } from '../src/parser.ts';
import { buildQuestionHierarchy } from '../src/hierarchy.ts';

test('parseQuestionMarker handles standard Cambridge question numbers', () => {
  const q7 = parseQuestionMarker('7');
  assert.strictEqual(q7?.normalizedNumber, '7');
  assert.strictEqual(q7?.depth, 0);
  assert.strictEqual(q7?.parentNumber, undefined);

  const q7a = parseQuestionMarker('7(a)');
  assert.strictEqual(q7a?.normalizedNumber, '7(a)');
  assert.strictEqual(q7a?.depth, 1);
  assert.strictEqual(q7a?.parentNumber, '7');

  const q7bii = parseQuestionMarker('7(b)(ii)');
  assert.strictEqual(q7bii?.normalizedNumber, '7(b)(ii)');
  assert.strictEqual(q7bii?.depth, 2);
  assert.strictEqual(q7bii?.parentNumber, '7(b)');
});

test('extractMarksFromText accurately parses varied mark notations', () => {
  assert.strictEqual(extractMarksFromText('Explain why this occurs. [3]'), 3);
  assert.strictEqual(extractMarksFromText('Total: [Total: 8 marks] for Question 4'), 8);
  assert.strictEqual(extractMarksFromText('Deduce the structure of Compound X. (2 marks)'), 2);
  assert.strictEqual(extractMarksFromText('Calculate the enthalpy change [5m]'), 5);
  assert.strictEqual(extractMarksFromText('State the name of reagent Y.'), null);
});

test('buildQuestionHierarchy correctly constructs tree', () => {
  const list = [
    { id: '1', questionNumber: '7', textContent: 'Section B Question 7' },
    { id: '2', questionNumber: '7(a)', textContent: 'Define the term electronegativity.' },
    { id: '3', questionNumber: '7(b)', textContent: 'Consider the reaction of 2-bromobutane.' },
    { id: '4', questionNumber: '7(b)(i)', textContent: 'State the mechanism.' },
    { id: '5', questionNumber: '7(b)(ii)', textContent: 'Draw the transition state.' },
  ];

  const tree = buildQuestionHierarchy(list);
  assert.strictEqual(tree.length, 1);
  assert.strictEqual(tree[0].questionNumber, '7');
  assert.strictEqual(tree[0].children.length, 2); // 7(a) and 7(b)

  const node7b = tree[0].children.find((c) => c.questionNumber === '7(b)');
  assert.ok(node7b);
  assert.strictEqual(node7b.children.length, 2); // 7(b)(i) and 7(b)(ii)
});
