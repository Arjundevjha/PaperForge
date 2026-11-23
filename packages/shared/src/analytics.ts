/**
 * PaperForge — Syllabus Coverage Analytics Engine
 * Pure functions to compute question-bank coverage against the SEAB syllabus taxonomy.
 * No I/O, no store coupling: fully unit-testable.
 */

import { SubjectId, Question, Answer } from './types';
import { SyllabusChapter, SyllabusSubtopic, SINGAPORE_A_LEVEL_SYLLABI } from './syllabus';

export interface SyllabusSubtopicCoverage {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
  covered: boolean;
  questions: Question[];
  questionsWithAnswer: Question[];
  questionsWithDiagram: Question[];
  gap: boolean;
}

export interface SyllabusChapterCoverage extends Omit<SyllabusChapter, 'subtopics'> {
  subtopics: SyllabusSubtopicCoverage[];
  coveredSubtopics: number;
  totalSubtopics: number;
  coveragePct: number;
}

export interface SyllabusCoverageOverall {
  coveredSubtopics: number;
  totalSubtopics: number;
  questions: number;
  questionsWithAnswer: number;
  coveragePct: number;
}

export interface SyllabusCoverageResult {
  chapters: SyllabusChapterCoverage[];
  overall: SyllabusCoverageOverall;
}

function percentage(covered: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((covered / total) * 10000) / 100;
}

function resolveSubtopicId(subject: SubjectId, question: Question): string | undefined {
  const syllabus = SINGAPORE_A_LEVEL_SYLLABI[subject];

  // Primary key: explicit syllabus subtopic assignment (e.g. reclassified question).
  if (question.subtopicId) {
    const subtopic: SyllabusSubtopic | undefined = syllabus.chapters
      .flatMap((c) => c.subtopics)
      .find((s) => s.id === question.subtopicId);
    if (subtopic) return subtopic.id;
  }

  // Fallback: keyword overlap against the authoritative syllabus taxonomy.
  const lowerText = question.textContent.toLowerCase();
  let bestSubtopic: SyllabusSubtopic | undefined;
  let bestMatchCount = 0;
  for (const chapter of syllabus.chapters) {
    for (const subtopic of chapter.subtopics) {
      const subtopicMatches = subtopic.keywords.filter((k) =>
        lowerText.includes(k.toLowerCase())
      ).length;
      if (subtopicMatches > bestMatchCount) {
        bestMatchCount = subtopicMatches;
        bestSubtopic = subtopic;
      }
    }
  }
  return bestSubtopic?.id;
}

export function computeSyllabusCoverage(
  subject: SubjectId,
  questions: Question[],
  answers?: Map<string, Answer>
): SyllabusCoverageResult {
  const syllabus = SINGAPORE_A_LEVEL_SYLLABI[subject];
  const answerMap = answers ?? new Map<string, Answer>();

  const subjectQuestions = questions.filter((q) => q.subject === subject);

  const chapters: SyllabusChapterCoverage[] = syllabus.chapters.map((chapter: SyllabusChapter) => {
    const subtopics: SyllabusSubtopicCoverage[] = chapter.subtopics.map((subtopic) => {
      const matchedQuestions = subjectQuestions.filter(
        (q) => resolveSubtopicId(subject, q) === subtopic.id
      );
      const questionsWithAnswer = matchedQuestions.filter((q) => answerMap.has(q.id));
      const questionsWithDiagram = questionsWithAnswer.filter(
        (q) => !!answerMap.get(q.id)?.diagramUrl
      );
      const covered = matchedQuestions.length > 0;
      return {
        id: subtopic.id,
        name: subtopic.name,
        slug: subtopic.slug,
        keywords: subtopic.keywords,
        covered,
        questions: matchedQuestions,
        questionsWithAnswer,
        questionsWithDiagram,
        gap: !covered,
      };
    });

    const coveredSubtopics = subtopics.filter((s) => s.covered).length;
    const totalSubtopics = subtopics.length;

    return {
      id: chapter.id,
      name: chapter.name,
      slug: chapter.slug,
      chapterNumber: chapter.chapterNumber,
      description: chapter.description,
      subtopics,
      coveredSubtopics,
      totalSubtopics,
      coveragePct: percentage(coveredSubtopics, totalSubtopics),
    };
  });

  const allSubtopics = chapters.flatMap((c) => c.subtopics);
  const coveredSubtopics = allSubtopics.filter((s) => s.covered).length;
  const totalSubtopics = allSubtopics.length;

  const resolvedQuestionIds = new Set<string>();
  for (const subtopic of allSubtopics) {
    for (const q of subtopic.questions) resolvedQuestionIds.add(q.id);
  }
  const uniqueMatched = subjectQuestions.filter((q) => resolvedQuestionIds.has(q.id));
  const questionsAnswered = uniqueMatched.filter((q) => answerMap.has(q.id)).length;

  return {
    chapters,
    overall: {
      coveredSubtopics,
      totalSubtopics,
      questions: uniqueMatched.length,
      questionsWithAnswer: questionsAnswered,
      coveragePct: percentage(coveredSubtopics, totalSubtopics),
    },
  };
}

export const SYLLABUS_COVERAGE_CSV_HEADER =
  'chapter,chapter_id,subtopic,subtopic_id,covered,questions,questions_with_answer,questions_with_diagram,gap';

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildSyllabusCoverageCsv(chapters: SyllabusChapterCoverage[]): string {
  const lines: string[] = [SYLLABUS_COVERAGE_CSV_HEADER];
  for (const chapter of chapters) {
    for (const subtopic of chapter.subtopics) {
      lines.push(
        [
          csvEscape(chapter.name),
          chapter.id,
          csvEscape(subtopic.name),
          subtopic.id,
          subtopic.covered ? 'true' : 'false',
          String(subtopic.questions.length),
          String(subtopic.questionsWithAnswer.length),
          String(subtopic.questionsWithDiagram.length),
          subtopic.gap ? 'true' : 'false',
        ].join(',')
      );
    }
  }
  return lines.join('\n');
}
