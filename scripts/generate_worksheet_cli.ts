#!/usr/bin/env node
/**
 * PaperForge — Worksheet Generation CLI
 * Generates verified Singapore Cambridge A4 Student Worksheets & Matching Teacher Answer Keys
 * 
 * Usage:
 *   npm run worksheet:generate
 *   npm run worksheet:generate -- --subject mathematics --chapter "Functions and Graphs" --count 8
 *   npm run worksheet:generate -- --output ./generated_worksheets
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getGlobalStore, bootstrapCanonicalPapers } from '../packages/db/src/index.ts';
import {
  selectWorksheetQuestions,
  buildWorksheetManifest,
  compileWorksheetDocuments,
} from '../packages/worksheets/src/index.ts';
import { SubjectId, Worksheet } from '../packages/shared/src/index.ts';

interface CliArgs {
  subject: SubjectId;
  chapter: string;
  count: number;
  outputDir: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const options: CliArgs = {
    subject: 'mathematics',
    chapter: 'all',
    count: 10,
    outputDir: path.resolve(process.cwd(), 'generated_worksheets'),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--subject' || arg === '-s') {
      options.subject = (args[++i] || 'mathematics') as SubjectId;
    } else if (arg === '--chapter' || arg === '-c') {
      options.chapter = args[++i] || 'all';
    } else if (arg === '--count' || arg === '-n') {
      options.count = parseInt(args[++i], 10) || 10;
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = path.resolve(process.cwd(), args[++i]);
    }
  }

  return options;
}

export async function main() {
  const options = parseArgs();

  console.log('================================================================');
  console.log('  PAPERFORGE — CAMBRIDGE A4 WORKSHEET COMPILER');
  console.log('================================================================');
  console.log(`📚 Subject:     ${options.subject.toUpperCase()}`);
  console.log(`📖 Chapter:     ${options.chapter === 'all' ? 'All Topics / Exam Revision' : options.chapter}`);
  console.log(`🔢 Question Target: ${options.count}`);
  console.log(`📁 Output Path: ${options.outputDir}`);
  console.log('================================================================\n');

  const store = getGlobalStore();
  // Ensure canonical database questions are loaded
  bootstrapCanonicalPapers(store);

  const allQuestions = store.listQuestions({ subject: options.subject });
  if (allQuestions.length === 0) {
    console.error(`[X] No questions found for subject "${options.subject}".`);
    process.exit(1);
  }

  // Filter questions with corresponding verified answers
  const availableQuestions = allQuestions.filter((q) => store.getAnswerByQuestionId(q.id));

  const isAll = options.chapter === 'all' || options.chapter.toLowerCase() === 'promotional exam revision';
  const candidateQuestions = isAll
    ? availableQuestions
    : availableQuestions.filter(
        (q) => q.chapter.trim().toLowerCase() === options.chapter.trim().toLowerCase()
      );

  if (candidateQuestions.length === 0) {
    const chapters = Array.from(new Set(availableQuestions.map((q) => q.chapter)));
    console.error(`[X] No questions found for chapter "${options.chapter}".`);
    console.log(`Available chapters:`);
    chapters.forEach((c) => console.log(`  • ${c}`));
    process.exit(1);
  }

  // Use round-robin JC diversity selector
  const selectedQuestions = selectWorksheetQuestions(candidateQuestions, {
    subject: options.subject,
    chapter: isAll ? candidateQuestions[0].chapter : options.chapter,
    targetCount: Math.min(options.count, candidateQuestions.length),
  });

  const finalQuestions = selectedQuestions.length > 0 ? selectedQuestions : candidateQuestions.slice(0, options.count);
  const finalAnswers = finalQuestions.map((q) => store.getAnswerByQuestionId(q.id)!);

  const existingCount = store.listWorksheets(options.subject).length;
  const wsNumber = `WS-${options.subject.toUpperCase().slice(0, 4)}-${String(existingCount + 1).padStart(2, '0')}`;
  const wsId = `ws_${options.subject}_${Date.now()}`;
  const resolvedChapter = isAll ? 'Promotional Exam Revision (All Topics)' : options.chapter;

  const manifest = buildWorksheetManifest(
    wsId,
    1,
    options.subject,
    resolvedChapter,
    finalQuestions
  );

  const worksheet: Worksheet = {
    id: wsId,
    worksheetNumber: wsNumber,
    title: `${wsNumber}: ${resolvedChapter} (Singapore A-Level)`,
    subject: options.subject,
    chapter: resolvedChapter,
    syllabusVersionId: 'SEAB-9758-Official',
    version: 1,
    questionCount: finalQuestions.length,
    totalMarks: manifest.totalMarks,
    status: 'PUBLISHED',
    sourceCoverage: Array.from(new Set(finalQuestions.map((q) => q.provenance.school))),
    manifest,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(`[+] Compiling Cambridge A4 Documents...`);
  console.log(`  • Questions: ${finalQuestions.length}`);
  console.log(`  • Total Marks: ${manifest.totalMarks}`);
  console.log(`  • Schools Covered: ${worksheet.sourceCoverage.join(', ')}\n`);

  const { questionPdf, answerPdf } = await compileWorksheetDocuments(
    worksheet,
    finalQuestions,
    finalAnswers
  );

  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  const cleanChapter = resolvedChapter.replace(/[^a-zA-Z0-9]/g, '_');
  const qpFilename = `${wsNumber}_${cleanChapter}_Questions.pdf`;
  const msFilename = `${wsNumber}_${cleanChapter}_AnswerKey.pdf`;

  const qpPath = path.join(options.outputDir, qpFilename);
  const msPath = path.join(options.outputDir, msFilename);

  fs.writeFileSync(qpPath, Buffer.from(questionPdf));
  fs.writeFileSync(msPath, Buffer.from(answerPdf));

  // Save worksheet to store
  store.addWorksheet(worksheet);

  console.log('================================================================');
  console.log('  WORKSHEET GENERATION COMPLETE!');
  console.log('================================================================');
  console.log(`📄 Student Question Paper:  ${qpPath} (${(questionPdf.length / 1024).toFixed(1)} KB)`);
  console.log(`🔑 Teacher Answer Key:      ${msPath} (${(answerPdf.length / 1024).toFixed(1)} KB)`);
  console.log('================================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Worksheet generation failed:', err);
    process.exit(1);
  });
}
