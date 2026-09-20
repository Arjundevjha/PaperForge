/**
 * PaperForge — Similarity Algorithms
 * Word n-gram and token similarity for Cambridge examination questions
 */

import { normalizeText } from './hash.js';

export function tokenSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (normA === normB) return 1.0;
  if (!normA.length || !normB.length) return 0.0;

  const tokensA = new Set(normA.split(' '));
  const tokensB = new Set(normB.split(' '));

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) {
      intersection++;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0.0;
}

export function extractNumbers(text: string): number[] {
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g);
  return matches ? matches.map((m) => parseFloat(m)) : [];
}

export function compareNumericalValues(textA: string, textB: string): { identical: boolean; diffCount: number } {
  const numsA = extractNumbers(textA);
  const numsB = extractNumbers(textB);

  if (numsA.length === 0 && numsB.length === 0) {
    return { identical: true, diffCount: 0 };
  }

  const setA = new Set(numsA);
  const setB = new Set(numsB);

  let diff = 0;
  for (const n of setA) {
    if (!setB.has(n)) diff++;
  }
  for (const n of setB) {
    if (!setA.has(n)) diff++;
  }

  return {
    identical: diff === 0 && numsA.length === numsB.length,
    diffCount: diff,
  };
}
