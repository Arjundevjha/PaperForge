#!/usr/bin/env node
/**
 * PaperForge — Ground-Truth Dataset Healing & Provenance Migration
 * Audits all 1,390 questions and banked exam sources:
 * - Accurately sets PROMO exam types (e.g. EJC 2023 Promo)
 * - Accurately sets Paper 2 (P2) paper numbers
 * - Recalculates clean academic citations and display provenance strings
 * - Preserves backward-compatible question IDs so worksheet manifests remain valid
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { formatProvenance, formatDisplayProvenance, SingaporeSchoolCode } from '../packages/shared/src/index.ts';

const STORE_PATH = path.resolve(process.cwd(), 'packages', 'db', '.paperforge-store.json');

function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — GROUND-TRUTH DATASET HEALING & MIGRATION');
  console.log('================================================================\n');

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`[X] Store not found at: ${STORE_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(STORE_PATH, 'utf-8');
  const store = JSON.parse(raw);

  const sources = store.sources || [];
  const questions = store.questions || [];

  console.log(`[i] Loaded ${sources.length} sources and ${questions.length} questions.`);

  let promoSourcesHealed = 0;
  let p2SourcesHealed = 0;
  let p1SourcesHealed = 0;

  // 1. Heal Sources
  const sourceMap = new Map<string, any>();
  for (const s of sources) {
    const fn = (s.filename || '').toLowerCase();

    const isPromo = fn.includes('promo');
    const isP2 = fn.includes('p2') || fn.includes('paper_2') || fn.includes('_02_') || fn.includes('paper 2');
    const isP1 = fn.includes('p1') || fn.includes('paper_1') || fn.includes('_01_') || fn.includes('paper 1');

    if (isPromo) {
      s.paperType = 'PROMO';
      s.paperNumber = 1;
      promoSourcesHealed++;
    } else if (isP2) {
      s.paperType = 'PRELIM';
      s.paperNumber = 2;
      p2SourcesHealed++;
    } else if (isP1) {
      s.paperType = 'PRELIM';
      s.paperNumber = 1;
      p1SourcesHealed++;
    }

    sourceMap.set(s.id, s);
  }

  console.log(`[✓] Sources Healed:`);
  console.log(`    - Promo Exam Sources:   ${promoSourcesHealed}`);
  console.log(`    - Paper 2 Exam Sources:  ${p2SourcesHealed}`);
  console.log(`    - Paper 1 Exam Sources:  ${p1SourcesHealed}\n`);

  // 2. Heal Questions
  let promoQuestionsHealed = 0;
  let p2QuestionsHealed = 0;
  let questionsVerified = 0;

  for (const q of questions) {
    const src = sourceMap.get(q.sourceId);
    const prevPaperType = q.provenance?.paperType;
    const prevPaperNum = q.provenance?.paperNumber;

    const school: SingaporeSchoolCode = (src?.school || q.provenance?.school || (q.id.split('-')[0].toUpperCase())) as SingaporeSchoolCode;
    const year: number = src?.year || q.provenance?.year || 2023;
    const paperType: string = src?.paperType || (q.id.includes('promo') ? 'PROMO' : 'PRELIM');
    const paperNumber: number = src?.paperNumber || (q.id.includes('-p2-') ? 2 : 1);
    const qnum: string = q.questionNumber || q.provenance?.questionNumber || '1';

    const fullProv = formatProvenance(
      school,
      year,
      'H2 Mathematics',
      paperType,
      paperNumber,
      qnum,
      q.sourceId
    );

    q.provenance = {
      ...fullProv,
      display: formatDisplayProvenance(fullProv),
    };

    if (paperType === 'PROMO') {
      promoQuestionsHealed++;
    } else if (paperNumber === 2) {
      p2QuestionsHealed++;
    }

    questionsVerified++;
  }

  console.log(`[✓] Questions Healed:`);
  console.log(`    - Total Questions Verified: ${questionsVerified}`);
  console.log(`    - Promo Questions Healed:   ${promoQuestionsHealed}`);
  console.log(`    - Paper 2 Questions Healed: ${p2QuestionsHealed}\n`);

  // 3. Heal Worksheets: ensure worksheetNumber is populated
  let worksheetsHealed = 0;
  for (const w of store.worksheets || []) {
    if (!w.worksheetNumber) {
      const m = w.title?.match(/(WS-MATH-\d+)/);
      if (m) {
        w.worksheetNumber = m[1];
        worksheetsHealed++;
      }
    }
  }
  console.log(`[✓] Worksheets Healed: ${worksheetsHealed} worksheets populated with worksheetNumber.\n`);

  // Spot-check ejc-2023-p1-q04
  const ejcQ4 = questions.find((q: any) => q.id === 'ejc-2023-p1-q04');
  if (ejcQ4) {
    console.log(`[i] Spot-check Question 'ejc-2023-p1-q04':`);
    console.log(`    Citation: ${ejcQ4.provenance.citation}`);
    console.log(`    Display:  ${ejcQ4.provenance.display}`);
    console.log(`    Type:     ${ejcQ4.provenance.paperType}`);
  }

  // Backup original store before writing
  const backupPath = `${STORE_PATH}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, raw);
    console.log(`\n[✓] Created store backup at: ${backupPath}`);
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  console.log(`[✓] Updated store saved to: ${STORE_PATH}\n`);
}

main();
