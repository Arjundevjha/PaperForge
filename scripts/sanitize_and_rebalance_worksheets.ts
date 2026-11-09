#!/usr/bin/env node

/**
 * PaperForge — Worksheet Sanitization & Pedagogical Rebalancing Engine
 * 1. Purges legacy RI Answer Key / Suggested Solution leaks from active worksheets.
 * 2. Rebalances hybrid questions (Functions vs Differentiation, Asymptotes vs Differentiation)
 *    using strict Cambridge SEAB pedagogical hierarchy.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');

// Sources where holy-grail provided Suggested Solutions instead of Question Papers
const LEAK_SOURCE_IDS = new Set([
  'src_ri_mathematics_2014_p1_1790501159041',
  'src_ri_mathematics_2015_p1_1790501162135',
  'src_ri_mathematics_2016_p1_1790501164340',
  'src_ri_mathematics_2018_p1_1790501191523',
  'src_ri_mathematics_2017_p1_1790501178843',
  'src_ri_mathematics_2019_p1_1790501181042',
]);

function isAnswerKeyLeak(q: any): boolean {
  if (LEAK_SOURCE_IDS.has(q.sourceId)) return true;
  const t = (q.textContent || '').toLowerCase();
  if (
    t.includes('suggested solution') ||
    t.includes('remarks for student') ||
    t.includes('marking scheme') ||
    t.includes('no. suggested solution')
  ) {
    return true;
  }
  return false;
}

function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — SANITIZE LEAKS & REBALANCE HYBRID QUESTIONS');
  console.log('================================================================\n');

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`[!] Store file not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  const questions: any[] = store.questions || [];

  // Phase 1: Mark and filter answer key leaks
  let leakCount = 0;
  const leakQidSet = new Set<string>();

  for (const q of questions) {
    if (isAnswerKeyLeak(q)) {
      q.isAnswerKeyLeak = true;
      leakQidSet.add(q.id);
      leakCount++;
    }
  }
  console.log(`[✓] Identified ${leakCount} answer-key leak questions across the database.`);

  // Phase 2: Rebalance hybrid cross-topic questions
  let rebalancedCount = 0;

  for (const q of questions) {
    if (leakQidSet.has(q.id)) continue;
    const t = (q.textContent || '').toLowerCase();

    // RULE 1: Functions Dominance
    // If testing f^{-1}, composite functions, domain/range, condition for composite to exist
    const isFunctionsQuestion =
      (t.includes('composite function') ||
        t.includes('inverse function') ||
        t.includes('f^{-1}') ||
        t.includes('f^-1')) &&
      (t.includes('range') || t.includes('domain') || t.includes('exists') || t.includes('one-to-one') || t.includes('1-1'));

    if (isFunctionsQuestion) {
      if (q.subtopic !== 'Functions' || q.chapter !== 'Functions and Graphs') {
        console.log(`[Functions Rule] ${q.id}: ${q.chapter} • ${q.subtopic} -> Functions and Graphs • Functions`);
        q.chapter = 'Functions and Graphs';
        q.subtopic = 'Functions';
        rebalancedCount++;
        continue;
      }
    }

    // RULE 2: Graphs & Asymptotes Dominance
    // Rational curve sketching with asymptotes, turning points, and graphical roots
    const isGraphsQuestion =
      t.includes('asymptote') &&
      (t.includes('sketch') ||
        t.includes('curve c has equation') ||
        t.includes('equation of a curve') ||
        t.includes('axial-intercept') ||
        t.includes('axial intercept'));

    if (isGraphsQuestion) {
      if (q.subtopic !== 'Graphs and Transformations' || q.chapter !== 'Functions and Graphs') {
        console.log(`[Graphs Rule] ${q.id}: ${q.chapter} • ${q.subtopic} -> Functions and Graphs • Graphs and Transformations`);
        q.chapter = 'Functions and Graphs';
        q.subtopic = 'Graphs and Transformations';
        rebalancedCount++;
        continue;
      }
    }
  }

  console.log(`[✓] Rebalanced ${rebalancedCount} hybrid questions into canonical topics.\n`);

  // Write changes to store
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  console.log(`[✓] Updated ${STORE_PATH}`);
}

main();
