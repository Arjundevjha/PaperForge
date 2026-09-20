/**
 * PaperForge — Multi-Signal Deduplication Classifier
 * Classifies pairs into EXACT_DUPLICATE, LIKELY_DUPLICATE, POSSIBLE_VARIANT, UNIQUE
 */

import { DedupOutcome, DedupComparisonResult } from '@paperforge/shared';
import { hashNormalizedText } from './hash.js';
import { tokenSimilarity, compareNumericalValues } from './similarity.js';

export interface QuestionForDedup {
  id: string;
  textContent: string;
  marks?: number | null;
  textHash?: string;
}

export function classifyQuestionPair(
  a: QuestionForDedup,
  b: QuestionForDedup
): DedupComparisonResult {
  const hashA = a.textHash || hashNormalizedText(a.textContent);
  const hashB = b.textHash || hashNormalizedText(b.textContent);

  // 1. Exact textual match
  if (hashA === hashB) {
    return {
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      outcome: 'EXACT_DUPLICATE',
      textSimilarity: 1.0,
      structureSimilarity: 1.0,
      markMatch: a.marks === b.marks,
      notes: 'Identical normalized text and structure. Automatically excluded from new worksheet selection.',
    };
  }

  // 2. High text similarity analysis
  const sim = tokenSimilarity(a.textContent, b.textContent);
  const numComparison = compareNumericalValues(a.textContent, b.textContent);
  const markMatch = a.marks === b.marks;

  let outcome: DedupOutcome;
  let notes = '';

  if (sim >= 0.60 && !numComparison.identical && numComparison.diffCount > 0) {
    outcome = 'POSSIBLE_VARIANT';
    notes = 'Same core problem wording but different numerical values or parameters. Legitimate variant: retained.';
  } else if (sim >= 0.85) {
    if (markMatch) {
      outcome = 'EXACT_DUPLICATE';
      notes = 'Very high textual similarity with matching marks and numbers. Treated as duplicate.';
    } else {
      outcome = 'LIKELY_DUPLICATE';
      notes = 'Near identical wording but different marks allocation. Flagged for review.';
    }
  } else if (sim >= 0.65) {
    outcome = 'LIKELY_DUPLICATE';
    notes = 'Moderate similarity; shares subtopic phrasing and equations. Requires review.';
  } else {
    outcome = 'UNIQUE';
    notes = 'Sufficiently distinct question stem and context.';
  }

  return {
    sourceQuestionId: a.id,
    targetQuestionId: b.id,
    outcome,
    textSimilarity: parseFloat(sim.toFixed(3)),
    structureSimilarity: markMatch ? 1.0 : 0.7,
    markMatch,
    notes,
  };
}
