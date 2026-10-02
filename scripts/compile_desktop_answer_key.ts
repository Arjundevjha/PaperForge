#!/usr/bin/env node
/**
 * PaperForge — Desktop Worksheet & Answer Key PDF Compiler
 * Compiles official Cambridge A4 PDFs and writes them directly to Desktop
 * Supports WS-MATH-01 (Functions & Graphs) and WS-MATH-03 (Vectors)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getGlobalStore, bootstrapCanonicalPapers } from '../packages/db/src/index.ts';
import { compileWorksheetDocuments } from '../packages/worksheets/src/index.ts';

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — COMPILING DESKTOP ANSWER KEYS & WORKSHEETS');
  console.log('================================================================\n');

  const store = getGlobalStore();
  bootstrapCanonicalPapers(store);

  const worksheets = store.listWorksheets('mathematics');
  const targetWorksheets = [
    {
      match: (w: any) => w.id === 'ws_math_functions_graphs' || w.worksheetNumber === 'WS-MATH-01',
      name: 'WS-MATH-01_Functions_and_Graphs',
      label: 'WS-MATH-01: Functions & Graphs',
    },
    {
      match: (w: any) => w.id === 'ws_math_vectors' || w.worksheetNumber === 'WS-MATH-03',
      name: 'WS-MATH-03_Vectors',
      label: 'WS-MATH-03: Vectors',
    },
  ];

  const desktopDir = '/Users/abc/Desktop';

  for (const target of targetWorksheets) {
    const ws = worksheets.find(target.match);
    if (!ws) {
      console.warn(`[!] Worksheet ${target.label} not found in store.`);
      continue;
    }

    console.log(`[i] Compiling ${ws.worksheetNumber}: ${ws.title}`);
    console.log(`    Total Questions: ${ws.manifest.questions.length}`);

    const { questions, answers } = store.getWorksheetQuestions(ws.id);
    console.log(`    Found ${questions.length} questions and ${answers.length} answers.`);

    const startTime = Date.now();
    const { questionPdf, answerPdf } = await compileWorksheetDocuments(ws, questions, answers);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const targetAnswerKey = path.join(desktopDir, `${target.name}_AnswerKey.pdf`);
    const targetQuestions = path.join(desktopDir, `${target.name}_Questions.pdf`);

    fs.writeFileSync(targetAnswerKey, Buffer.from(answerPdf));
    fs.writeFileSync(targetQuestions, Buffer.from(questionPdf));

    // Also update legacy filename if WS-MATH-01
    if (ws.worksheetNumber === 'WS-MATH-01') {
      const targetAnswerKey1 = path.join(desktopDir, `${target.name}_AnswerKey (1).pdf`);
      fs.writeFileSync(targetAnswerKey1, Buffer.from(answerPdf));
    }

    console.log(`[✓] Compiled ${ws.worksheetNumber} in ${duration}s!`);
    console.log(`    Updated Answer Key: ${targetAnswerKey} (${(answerPdf.length / 1024).toFixed(1)} KB)`);
    console.log(`    Updated Questions:  ${targetQuestions} (${(questionPdf.length / 1024).toFixed(1)} KB)\n`);
  }
}

main().catch((err) => {
  console.error('Compilation failed:', err);
  process.exit(1);
});
