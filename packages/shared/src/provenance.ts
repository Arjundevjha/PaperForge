/**
 * PaperForge — Provenance Formatter & Parser
 * Preserves exact academic citation coordinates for all examination questions
 */

import { QuestionProvenance, SingaporeSchoolCode, SINGAPORE_SCHOOLS } from './types.js';

export function formatProvenance(
  school: SingaporeSchoolCode,
  year: number,
  subjectName: string,
  paperType: string,
  paperNumber: number,
  questionNumber: string,
  sourceDocumentId = ''
): QuestionProvenance {
  const normPaperType = paperType.toUpperCase();
  const citation = `[${school} ${year} ${subjectName} ${normPaperType} P${paperNumber} ${questionNumber}]`;

  return {
    school,
    year,
    paperType: normPaperType,
    paperNumber,
    questionNumber,
    sourceDocumentId,
    citation,
  };
}

export function parseCitation(citation: string): Partial<QuestionProvenance> | null {
  // Matches e.g. "[RI 2025 H2 Chemistry PRELIM P2 Q7(b)(ii)]"
  const regex = /^\[([A-Z]+)\s+(\d{4})\s+(.+?)\s+([A-Z_]+)\s+P(\d+)\s+([a-zA-Z0-9().]+)\]$/;
  const match = citation.trim().match(regex);
  if (!match) return null;

  const [, schoolStr, yearStr, , paperType, paperNumStr, questionNum] = match;
  const school = schoolStr as SingaporeSchoolCode;

  if (!SINGAPORE_SCHOOLS[school]) {
    return null;
  }

  return {
    school,
    year: parseInt(yearStr, 10),
    paperType,
    paperNumber: parseInt(paperNumStr, 10),
    questionNumber: questionNum,
    citation,
  };
}
