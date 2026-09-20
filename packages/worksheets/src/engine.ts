/**
 * PaperForge — Worksheet Engine
 * Automatically generates and maintains chapter-based worksheets and immutable manifests
 */

import {
  Question,
  Answer,
  Worksheet,
  WorksheetManifest,
  SubjectId,
  SingaporeSchoolCode,
} from '@paperforge/shared';
import { generateQuestionPaperPdf, generateAnswerKeyPdf } from '@paperforge/pdf';

export interface WorksheetGenerationOptions {
  worksheetNumber: string; // e.g. "WS-01"
  subject: SubjectId;
  chapter: string;
  syllabusVersionId: string;
  targetQuestionCount?: number;
}

export function selectWorksheetQuestions(
  allQuestions: Question[],
  options: {
    subject: SubjectId;
    chapter: string;
    targetCount?: number;
    excludedQuestionIds?: Set<string>;
  }
): Question[] {
  const target = options.targetCount || 10;
  const excluded = options.excludedQuestionIds || new Set<string>();

  // Filter candidates
  const candidates = allQuestions.filter(
    (q) =>
      q.subject === options.subject &&
      q.chapter === options.chapter &&
      q.status !== 'EXCLUDED' &&
      !excluded.has(q.id)
  );

  // Group by JC to ensure diversity
  const bySchool = new Map<SingaporeSchoolCode, Question[]>();
  for (const q of candidates) {
    const school = q.provenance.school;
    if (!bySchool.has(school)) bySchool.set(school, []);
    bySchool.get(school)!.push(q);
  }

  const selected: Question[] = [];
  const schools = Array.from(bySchool.keys());
  let schoolIdx = 0;

  while (selected.length < target && selected.length < candidates.length) {
    const school = schools[schoolIdx % schools.length];
    const list = bySchool.get(school)!;

    if (list.length > 0) {
      const q = list.shift()!;
      selected.push(q);
    }

    schoolIdx++;
    // Break if all empty
    if (schools.every((s) => bySchool.get(s)!.length === 0)) {
      break;
    }
  }

  return selected;
}

export function buildWorksheetManifest(
  worksheetId: string,
  version: number,
  subject: SubjectId,
  chapter: string,
  questions: Question[]
): WorksheetManifest {
  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  const manifest: WorksheetManifest = {
    worksheetId,
    version,
    subject,
    chapter,
    questions: Object.freeze(questions.map((q) => q.id)) as unknown as string[],
    totalMarks,
    frozenAt: new Date().toISOString(),
  };

  return Object.freeze(manifest);
}

export async function compileWorksheetDocuments(
  worksheet: Worksheet,
  questions: Question[],
  answers: Answer[]
): Promise<{ questionPdf: Uint8Array; answerPdf: Uint8Array }> {
  // Invariant 1: Question count must match manifest question count
  if (questions.length !== worksheet.manifest.questions.length) {
    throw new Error(
      `Invariant violation: question count (${questions.length}) does not match manifest count (${worksheet.manifest.questions.length})`
    );
  }

  // Invariant 1b: Exact question ID sequence order must match manifest
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].id !== worksheet.manifest.questions[i]) {
      throw new Error(
        `Invariant violation: question ID sequence mismatch at position ${i} (expected ${worksheet.manifest.questions[i]}, got ${questions[i].id})`
      );
    }
  }

  // Invariant 2: Answers must match questions 1:1 with identical count
  if (answers.length !== questions.length) {
    throw new Error(
      `Invariant violation: answer count (${answers.length}) does not match question count (${questions.length})`
    );
  }

  const answerMap = new Map<string, Answer>();
  for (const a of answers) {
    answerMap.set(a.questionId, a);
  }

  for (const q of questions) {
    if (!answerMap.has(q.id)) {
      throw new Error(`Invariant violation: question ${q.id} missing corresponding answer in manifest`);
    }
  }

  // Generate Question Paper PDF
  const questionPdf = await generateQuestionPaperPdf({
    worksheetNumber: worksheet.worksheetNumber,
    chapterTitle: worksheet.chapter,
    subject: worksheet.subject,
    totalMarks: worksheet.totalMarks,
    questions: questions.map((q) => ({
      questionNumber: q.questionNumber,
      textContent: q.textContent,
      marks: q.marks,
      citation: q.provenance.citation,
    })),
  });

  // Generate Answer Key PDF in exact same question order
  const answerPdf = await generateAnswerKeyPdf({
    worksheetNumber: worksheet.worksheetNumber,
    chapterTitle: worksheet.chapter,
    subject: worksheet.subject,
    totalMarks: worksheet.totalMarks,
    answers: questions.map((q) => {
      const a = answerMap.get(q.id)!;
      return {
        questionNumber: q.questionNumber,
        answerContent: a.answerContent,
        markSchemeNotes: a.markSchemeNotes,
        marks: q.marks,
        citation: a.provenance.citation,
      };
    }),
  });

  return { questionPdf, answerPdf };
}
