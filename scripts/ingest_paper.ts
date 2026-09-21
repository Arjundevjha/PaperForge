#!/usr/bin/env node

/**
 * PaperForge — CLI Examination Paper Ingestion Script
 * Simulates production ingestion of Singapore Junior College examination papers:
 * - Promo Practise Paper 3 (JPJC 2022 H2 Mathematics Promo Paper 1)
 * - Promo Practise Paper 4 (EJC + DHS 2022 H2 Mathematics Promo Paper 2)
 *
 * Usage:
 *   node scripts/ingest_paper.mjs --paper 3
 *   node scripts/ingest_paper.mjs --paper 4
 *   node scripts/ingest_paper.mjs --all
 */

import {
  getGlobalStore,
  REAL_PAPER_3_PACKAGE,
  REAL_PAPER_4_PACKAGE,
  ingestPaperPackage,
} from '@paperforge/db';

const args = process.argv.slice(2);
const paperArg = args.includes('--paper') ? args[args.indexOf('--paper') + 1] : null;
const ingestAll = args.includes('--all') || (!paperArg && !args.length);

console.log('================================================================');
console.log('  PAPERFORGE — SINGAPORE GCE A-LEVEL PRODUCTION INGESTION');
console.log('================================================================\n');

const store = getGlobalStore();

function runIngestion(pkg, label) {
  console.log(`[+] INGESTING: ${label}`);
  console.log(`    File:        ${pkg.source.filename}`);
  console.log(`    School:      ${pkg.source.school}`);
  console.log(`    Year:        ${pkg.source.year}`);
  console.log(`    SHA-256:     ${pkg.source.sourceHash}`);
  console.log(`    Questions:   ${pkg.questions.length} questions parsed`);
  console.log(`    Answers:     ${pkg.answers.length} marking scheme steps parsed`);

  const result = ingestPaperPackage(store, pkg);

  if (!result.success) {
    if (result.duplicate) {
      console.log(`\n[!] DEDUPLICATION WARNING: ${result.message}`);
    } else {
      console.error(`\n[X] INGESTION FAILED: ${result.message}`);
    }
    return;
  }

  console.log(`\n[✓] INGESTION SUCCESS: ${result.message}`);
  console.log(`    Total Marks:        ${result.telemetry?.totalMarks} marks`);
  console.log(`    Processing Time:    ${result.telemetry?.processingTimeMs} ms`);
  console.log(`    Duplicates Found:   ${result.duplicatesFound}`);
  console.log(`    Variants Detected:  ${result.variantsFound}`);
  console.log(`    Review Items Sent:  ${result.reviewItemsCreated}`);
  console.log('----------------------------------------------------------------\n');
}

if (paperArg === '3' || ingestAll) {
  runIngestion(REAL_PAPER_3_PACKAGE, 'Promo Practise Paper 3 (JPJC 2022 H2 Math)');
}

if (paperArg === '4' || ingestAll) {
  runIngestion(REAL_PAPER_4_PACKAGE, 'Promo Practise Paper 4 (EJC + DHS 2022 H2 Math)');
}

console.log(`Current PaperForge State:`);
console.log(`- Ingested Sources:   ${store.listSources().length}`);
console.log(`- Extracted Questions:${store.listQuestions().length}`);
console.log(`- Review Queue Items: ${store.listReviewItems().length}`);
console.log('\n================================================================');
