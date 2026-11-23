/**
 * PaperForge — Syllabus Classification Matcher
 * Maps examination questions strictly into configured Singapore-Cambridge syllabi
 */

import {
  Difficulty,
  SubjectId,
  SINGAPORE_A_LEVEL_SYLLABI,
  SyllabusChapter,
  SyllabusSubtopic,
} from '@paperforge/shared';

export interface ClassificationResult {
  subject: SubjectId;
  syllabusVersion: string;
  chapter: string;
  chapterId: string;
  subtopic?: string;
  subtopicId?: string;
  confidence: number;
  matchedKeywords: string[];
  needsReview: boolean;
  reason: string;
  difficulty?: Difficulty;
}

const PROOF_LANGUAGE = /\b(prove|proof|show that|deduce|hence)\b/;

/**
 * Deterministic difficulty heuristic used as the fallback for (and a sanity
 * anchor beside) the Groq classifier. Pure function: no I/O, no clock.
 */
export function classifyDifficulty(
  subject: SubjectId,
  textContent: string,
  marks?: number | null
): Difficulty {
  const text = (textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const length = text.length;
  const markValue = typeof marks === 'number' && Number.isFinite(marks) ? marks : 0;

  const signals = [
    /∫|\\int\b|\bintegrat/.test(text),                          // integration
    /\blimits?\b|\bconverge|\basymptote/.test(text),             // limits/behaviour
    /\b3\s*-?\s*d\b|\bplane\b|\bvector/.test(text),            // 3D vectors/planes
    /\bprove\b|\bproof\b|\binduction\b/.test(text),             // formal proof
    /\bhence\b|\bd\s*educe\b|\bdirectly from/.test(text),       // chained reasoning
    /\bshow that\b/.test(text),
    /\bprobability\b|\bdistribution\b|\bhypothesis\b/.test(text),
    /\bcomplex number|\bargand|\bmodulus\b|\broot of\b/.test(text),
  ].filter(Boolean).length;

  if ((markValue >= 5 && PROOF_LANGUAGE.test(text)) || markValue >= 9) {
    return 'HARD';
  }
  if (signals >= 4) {
    return 'HARD';
  }
  if (signals === 3 && length > 220) {
    return 'HARD';
  }

  // Short, low-signal stems with small mark allocations are the EASY band.
  const shortStemLimit = subject === 'mathematics' ? 170 : 220;
  if (markValue > 0 && markValue <= 4 && signals <= 1 && length <= shortStemLimit) {
    return 'EASY';
  }
  if (markValue === 0 && signals === 0 && length <= 120) {
    return 'EASY';
  }

  return 'MEDIUM';
}

export function classifyQuestionContent(
  subject: SubjectId,
  textContent: string
): ClassificationResult {
  const syllabus = SINGAPORE_A_LEVEL_SYLLABI[subject];
  if (!syllabus) {
    throw new Error(`Unsupported subject: ${subject}`);
  }

  const lowerText = textContent.toLowerCase();
  let bestChapter: SyllabusChapter = syllabus.chapters[0];
  let bestSubtopic: SyllabusSubtopic | undefined = undefined;
  let highestScore = 0;
  let matchedWords: string[] = [];

  for (const chapter of syllabus.chapters) {
    let chapterMatches = 0;
    const currentMatched: string[] = [];

    // Check chapter name terms
    const chapterTerms = chapter.name.toLowerCase().split(/\s+/);
    for (const term of chapterTerms) {
      if (term.length > 3 && lowerText.includes(term)) {
        chapterMatches += 2;
        currentMatched.push(term);
      }
    }

    let chapterBestSubtopic: SyllabusSubtopic | undefined = undefined;
    let maxSubMatches = 0;

    for (const sub of chapter.subtopics) {
      let subMatches = 0;
      for (const kw of sub.keywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          subMatches += 3;
          currentMatched.push(kw);
        }
      }

      if (subMatches > maxSubMatches) {
        maxSubMatches = subMatches;
        chapterBestSubtopic = sub;
      }
      chapterMatches += subMatches;
    }

    if (chapterMatches > highestScore) {
      highestScore = chapterMatches;
      bestChapter = chapter;
      bestSubtopic = chapterBestSubtopic;
      matchedWords = [...new Set(currentMatched)];
    }
  }

  // Calculate confidence: score of 6+ is high confidence (>= 0.85), 3-5 is moderate (0.7-0.8), < 3 is low (< 0.7)
  let confidence: number;
  if (highestScore >= 8) {
    confidence = Math.min(0.98, 0.85 + highestScore * 0.015);
  } else if (highestScore >= 4) {
    confidence = 0.75 + (highestScore - 4) * 0.03;
  } else if (highestScore > 0) {
    confidence = 0.50 + highestScore * 0.08;
  } else {
    confidence = 0.20;
  }

  const needsReview = confidence < 0.70;

  return {
    subject,
    syllabusVersion: syllabus.effectiveVersion,
    chapter: bestChapter.name,
    chapterId: bestChapter.id,
    subtopic: bestSubtopic?.name,
    subtopicId: bestSubtopic?.id,
    confidence: parseFloat(confidence.toFixed(2)),
    matchedKeywords: matchedWords,
    needsReview,
    reason: needsReview
      ? `Low matching density (score ${highestScore}) for subject ${subject}. Routed to review queue.`
      : `High confidence match (${(confidence * 100).toFixed(0)}%) based on keywords: [${matchedWords.slice(0, 4).join(', ')}]`,
  };
}
