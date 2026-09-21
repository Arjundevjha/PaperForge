/**
 * PaperForge — Cambridge A4 PDF Compiler
 * Produces official Singapore-Cambridge GCE A-Level examination worksheets and matching answer keys
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SubjectId, SUBJECT_METADATA } from '@paperforge/shared';

export interface ExamQuestionInput {
  questionNumber: string;
  textContent: string;
  marks?: number | null;
  citation: string;
}

export interface ExamPaperOptions {
  worksheetNumber: string; // e.g. "WS-01"
  chapterTitle: string;
  subject: SubjectId;
  totalMarks: number;
  questions: ExamQuestionInput[];
}

export interface AnswerKeyInput {
  questionNumber: string;
  answerContent: string;
  markSchemeNotes?: string;
  marks?: number | null;
  citation: string;
}

export interface AnswerKeyOptions {
  worksheetNumber: string;
  chapterTitle: string;
  subject: SubjectId;
  totalMarks: number;
  answers: AnswerKeyInput[];
}

// A4 dimensions in points: 595.28 x 841.89
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_LEFT = 54; // ~19mm
const MARGIN_RIGHT = 54;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export function sanitizeForPdf(input: string): string {
  if (!input) return '';
  return input
    .replace(/[\u2212\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2264\uf0a3]/g, '<=')
    .replace(/[\u2265\uf0b3]/g, '>=')
    .replace(/[\u2260]/g, '!=')
    .replace(/[\u00b1]/g, '+/-')
    .replace(/[\u00d7\uf0b4]/g, '*')
    .replace(/[\u00f7]/g, '/')
    .replace(/[\u00b0]/g, ' deg')
    .replace(/[\u2022\u2023\u25e6]/g, '*')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u03b8\uf071]/g, 'theta')
    .replace(/[\u03bb\uf06c]/g, 'lambda')
    .replace(/[\u03bc\uf06d]/g, 'mu')
    .replace(/[\u03b1\uf061]/g, 'alpha')
    .replace(/[\u03b2\uf062]/g, 'beta')
    .replace(/[\u03c0\uf070]/g, 'pi')
    .replace(/[\u221a]/g, 'sqrt')
    .replace(/[\u222b\uf0f2\uf0f3\uf0f4\uf0f5]/g, 'integral ')
    .replace(/[\uf0a5]/g, 'inf')
    .replace(/[\uf0ce]/g, 'in')
    .replace(/[\uf0d0]/g, 'angle ')
    .replace(/[\uf0e6\uf0e7\uf0e8]/g, '(')
    .replace(/[\uf0f6\uf0f7\uf0f8]/g, ')')
    .replace(/[\ue000-\uf8ff]/g, '')
    .replace(/[^\x20-\x7E\t\n]/g, '');
}

export async function generateQuestionPaperPdf(options: ExamPaperOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontSans = await doc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  const meta = SUBJECT_METADATA[options.subject];

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - 50;

  // Header Banner
  page.drawText('PAPERFORGE AUTOMATED EXAMINATION SERIES', {
    x: MARGIN_LEFT,
    y,
    size: 10,
    font: fontSansBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('SINGAPORE-CAMBRIDGE GCE A-LEVEL', {
    x: A4_WIDTH - MARGIN_RIGHT - 180,
    y,
    size: 9,
    font: fontSans,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 16;
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y },
    thickness: 1.5,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 22;
  page.drawText(`${meta.level.toUpperCase()} ${meta.name.toUpperCase()} • CODE ${meta.syllabusCode}`, {
    x: MARGIN_LEFT,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  y -= 16;
  page.drawText(sanitizeForPdf(`Chapter: ${options.chapterTitle} [${options.worksheetNumber}]`), {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fontRegular,
    color: rgb(0.15, 0.15, 0.15),
  });

  y -= 26;
  // Student Name & Class Field Box
  page.drawRectangle({
    x: MARGIN_LEFT,
    y,
    width: CONTENT_WIDTH,
    height: 24,
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 0.8,
  });

  page.drawText('NAME: _____________________________________   CLASS: _________   INDEX NO: ______', {
    x: MARGIN_LEFT + 10,
    y: y + 7,
    size: 9,
    font: fontSans,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 24;
  page.drawText(`Total Marks: ${options.totalMarks} marks   •   Time Allowed: 1 Hour 15 Minutes`, {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: fontSansBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 12;
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y },
    thickness: 0.8,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 24;

  // Questions loop
  for (let i = 0; i < options.questions.length; i++) {
    const q = options.questions[i];

    // Check if new page needed
    if (y < 120) {
      page.drawText('[Turn Over', {
        x: A4_WIDTH - MARGIN_RIGHT - 60,
        y: 35,
        size: 9,
        font: fontSans,
        color: rgb(0.3, 0.3, 0.3),
      });

      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      y = A4_HEIGHT - 60;
    }

    // Question Header & Number
    const qTitle = `${q.questionNumber}.`;
    page.drawText(qTitle, {
      x: MARGIN_LEFT,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    if (q.marks) {
      const marksText = `[${q.marks}]`;
      page.drawText(marksText, {
        x: A4_WIDTH - MARGIN_RIGHT - 25,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    y -= 14;

    // Text content lines (wrap lines)
    const sanitizedText = sanitizeForPdf(q.textContent);
    const words = sanitizedText.split(/\s+/).filter(Boolean);
    let line = '';
    const lineHeight = 14;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = fontRegular.widthOfTextAtSize(testLine, 10);

      if (width > CONTENT_WIDTH - 30) {
        page.drawText(line, {
          x: MARGIN_LEFT + 15,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.1),
        });
        line = word;
        y -= lineHeight;

        if (y < 90) {
          page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
          y = A4_HEIGHT - 60;
        }
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, {
        x: MARGIN_LEFT + 15,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
    }

    // Citation tag
    y -= 4;
    page.drawText(sanitizeForPdf(`CITATION: ${q.citation}`), {
      x: MARGIN_LEFT + 15,
      y,
      size: 8,
      font: fontMono,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 22;
  }

  // Final footer on last page
  page.drawLine({
    start: { x: MARGIN_LEFT + 100, y: 50 },
    end: { x: A4_WIDTH - MARGIN_RIGHT - 100, y: 50 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText('— END OF PAPER —', {
    x: A4_WIDTH / 2 - 45,
    y: 38,
    size: 9,
    font: fontSansBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  return await doc.save();
}

export async function generateAnswerKeyPdf(options: AnswerKeyOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontSans = await doc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  const meta = SUBJECT_METADATA[options.subject];

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - 50;

  // Header Banner
  page.drawText('PAPERFORGE TUTOR SOLUTION & MARK SCHEME KEY', {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fontSansBold,
    color: rgb(0.1, 0.3, 0.5),
  });

  page.drawText('OFFICIAL VERIFIED SOLUTIONS', {
    x: A4_WIDTH - MARGIN_RIGHT - 160,
    y,
    size: 9,
    font: fontSansBold,
    color: rgb(0.1, 0.5, 0.2),
  });

  y -= 16;
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y },
    thickness: 1.5,
    color: rgb(0.1, 0.3, 0.5),
  });

  y -= 22;
  page.drawText(sanitizeForPdf(`${meta.name.toUpperCase()} • ${options.chapterTitle} [${options.worksheetNumber}]`), {
    x: MARGIN_LEFT,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  y -= 16;
  page.drawText(`Total Marks: ${options.totalMarks} marks • Strict Cambridge Assessment Criteria`, {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: fontSans,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 12;
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: A4_WIDTH - MARGIN_RIGHT, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });

  y -= 24;

  // Answers loop
  for (let i = 0; i < options.answers.length; i++) {
    const a = options.answers[i];

    if (y < 120) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      y = A4_HEIGHT - 60;
    }

    // Answer Question Header
    page.drawText(`Solution for Q${a.questionNumber}`, {
      x: MARGIN_LEFT,
      y,
      size: 10,
      font: fontSansBold,
      color: rgb(0.1, 0.25, 0.45),
    });

    if (a.marks) {
      page.drawText(`[Total: ${a.marks}m]`, {
        x: A4_WIDTH - MARGIN_RIGHT - 65,
        y,
        size: 9,
        font: fontSansBold,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    y -= 14;

    // Answer Content wrapped lines
    const sanitizedAnswer = sanitizeForPdf(a.answerContent);
    const rawLines = sanitizedAnswer.split('\n');
    for (const rawLine of rawLines) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      let line = '';
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const width = fontRegular.widthOfTextAtSize(testLine, 9.5);
        if (width > CONTENT_WIDTH - 30) {
          page.drawText(line, {
            x: MARGIN_LEFT + 15,
            y,
            size: 9.5,
            font: fontRegular,
            color: rgb(0.1, 0.1, 0.1),
          });
          line = word;
          y -= 13;
          if (y < 90) {
            page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
            y = A4_HEIGHT - 60;
          }
        } else {
          line = testLine;
        }
      }
      if (line) {
        page.drawText(line, {
          x: MARGIN_LEFT + 15,
          y,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 13;
        if (y < 90) {
          page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
          y = A4_HEIGHT - 60;
        }
      }
    }

    if (a.markSchemeNotes) {
      y -= 3;
      page.drawText(sanitizeForPdf(`Marking Guide: ${a.markSchemeNotes}`), {
        x: MARGIN_LEFT + 15,
        y,
        size: 8.5,
        font: fontSans,
        color: rgb(0.1, 0.45, 0.15),
      });
      y -= 13;
    }

    // Provenance
    y -= 3;
    page.drawText(sanitizeForPdf(`SOURCE: ${a.citation}`), {
      x: MARGIN_LEFT + 15,
      y,
      size: 8,
      font: fontMono,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 20;
  }

  return await doc.save();
}
