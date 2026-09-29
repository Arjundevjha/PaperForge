#!/usr/bin/env node
/**
 * PaperForge — Desktop Worksheet & Answer Key PDF Compiler
 * Compiles official Cambridge A4 PDFs and writes them directly to Desktop
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getGlobalStore, bootstrapCanonicalPapers } from '../packages/db/src/index.ts';
import { compileWorksheetDocuments } from '../packages/worksheets/src/index.ts';

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — COMPILING DESKTOP ANSWER KEY & WORKSHEET');
  console.log('================================================================\n');

  const store = getGlobalStore();
  bootstrapCanonicalPapers(store);

  const worksheets = store.listWorksheets('mathematics');
  const ws = worksheets.find(
    (w) => w.id === 'ws_math_functions_graphs' || w.worksheetNumber === 'WS-MATH-01'
  );

  if (!ws) {
    console.error('[X] Worksheet WS-MATH-01 (Functions and Graphs) not found in store.');
    process.exit(1);
  }

  console.log(`[i] Compiling ${ws.worksheetNumber}: ${ws.title}`);
  console.log(`    Total Questions: ${ws.manifest.questions.length}`);

  const { questions, answers } = store.getWorksheetQuestions(ws.id);
  console.log(`    Found ${questions.length} questions and ${answers.length} answers.`);

  const startTime = Date.now();
  const { questionPdf, answerPdf } = await compileWorksheetDocuments(ws, questions, answers);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  const desktopDir = '/Users/abc/Desktop';
  const targetAnswerKey1 = path.join(desktopDir, 'WS-MATH-01_Functions_and_Graphs_AnswerKey (1).pdf');
  const targetAnswerKey = path.join(desktopDir, 'WS-MATH-01_Functions_and_Graphs_AnswerKey.pdf');
  const targetQuestions = path.join(desktopDir, 'WS-MATH-01_Functions_and_Graphs_Questions.pdf');

  fs.writeFileSync(targetAnswerKey1, Buffer.from(answerPdf));
  fs.writeFileSync(targetAnswerKey, Buffer.from(answerPdf));
  fs.writeFileSync(targetQuestions, Buffer.from(questionPdf));

  console.log(`\n[✓] Compiled in ${duration}s!`);
  console.log(`    Updated: ${targetAnswerKey1} (${(answerPdf.length / 1024).toFixed(1)} KB)`);
  console.log(`    Updated: ${targetAnswerKey} (${(answerPdf.length / 1024).toFixed(1)} KB)`);
  console.log(`    Updated: ${targetQuestions} (${(questionPdf.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('Compilation failed:', err);
  process.exit(1);
});
