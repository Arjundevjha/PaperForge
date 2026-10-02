/**
 * PaperForge — Provenance Formatter & Parser
 * Preserves exact academic citation coordinates for all examination questions
 */

import { QuestionProvenance, SingaporeSchoolCode, SINGAPORE_SCHOOLS } from './types';

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
  const qClean = questionNumber.startsWith('Q') ? questionNumber : `Q${questionNumber}`;
  const citation =
    normPaperType === 'PROMO'
      ? `[${school} ${year} ${subjectName} PROMO ${qClean}]`
      : `[${school} ${year} ${subjectName} ${normPaperType} P${paperNumber} ${qClean}]`;

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

export function formatDisplayProvenance(prov: Partial<QuestionProvenance> | any): string {
  if (!prov) return 'Singapore GCE A-Level';
  const school = prov.school || '';
  const year = prov.year || '';
  const ptype = (prov.paperType || 'PRELIM').toUpperCase();
  const pnum = prov.paperNumber || 1;
  const rawQ = prov.questionNumber || '';
  const qnum = rawQ ? (String(rawQ).startsWith('Q') ? String(rawQ) : `Q${rawQ}`) : '';

  if (ptype === 'PROMO') {
    return `${school} ${year} Promo ${qnum}`.trim();
  }
  return `${school} ${year} Prelim P${pnum} ${qnum}`.trim();
}

export function parseCitation(citation: string): Partial<QuestionProvenance> | null {
  // Matches e.g. "[RI 2025 H2 Chemistry PRELIM P2 Q7(b)(ii)]" or "[EJC 2023 H2 Mathematics PROMO Q4]"
  const promoRegex = /^\[([A-Z]+)\s+(\d{4})\s+(.+?)\s+PROMO\s+([a-zA-Z0-9().]+)\]$/;
  const promoMatch = citation.trim().match(promoRegex);
  if (promoMatch) {
    const [, schoolStr, yearStr, , questionNum] = promoMatch;
    const school = schoolStr as SingaporeSchoolCode;
    if (!SINGAPORE_SCHOOLS[school]) return null;
    return {
      school,
      year: parseInt(yearStr, 10),
      paperType: 'PROMO',
      paperNumber: 1,
      questionNumber: questionNum.replace(/^Q/i, ''),
      citation,
    };
  }

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
    questionNumber: questionNum.replace(/^Q/i, ''),
    citation,
  };
}
