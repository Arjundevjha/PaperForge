import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { classifyWithGroq } from '../src/groq.ts';

// Load GROQ_API_KEY from .env.local if not already on process.env
if (!process.env.GROQ_API_KEY) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.startsWith('GROQ_API_KEY=')) {
        process.env.GROQ_API_KEY = line.split('=', 2)[1].trim().replace(/^['"]|['"]$/g, '');
        break;
      }
    }
  }
}

test('classifyWithGroq accurately classifies JPJC 2025 P1 Q5 integral question into Integration', async () => {
  const jpjcText = `5
(i) Using the substitution u = x^2 + 3, show that
\\int \\frac{x^3}{\\sqrt{x^2+3}} dx = \\frac{1}{3}\\sqrt{(x^2+3)^3} - 3\\sqrt{(x^2+3)} + C. [4]

(ii) Hence find the exact value of \\int_{-1}^3 \\left| \\frac{3x^3}{\\sqrt{x^2+3}} \\right| dx, leaving your answer in the form a + b\\sqrt{3} where a and b are integers to be determined. [3]`;

  const result = await classifyWithGroq('mathematics', jpjcText);

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Calculus');
  assert.strictEqual(result.chapterId, 'math-05');
  assert.ok(
    result.subtopic?.includes('Integration'),
    `Expected subtopic to be Integration, got "${result.subtopic}"`
  );
  assert.ok(result.confidence >= 0.70);
  assert.strictEqual(result.needsReview, false);
});

test('classifyWithGroq falls back gracefully to deterministic matcher when apiKey is missing', async () => {
  const text = 'The function f is defined by f: x |-> (x^2 - 2x) / (x^2 - 1). Find f^(-1)(x).';
  const result = await classifyWithGroq('mathematics', text, 'invalid-or-missing-key-dummy');

  assert.strictEqual(result.subject, 'mathematics');
  assert.strictEqual(result.chapter, 'Functions and Graphs');
});
