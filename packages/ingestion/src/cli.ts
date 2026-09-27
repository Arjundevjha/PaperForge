#!/usr/bin/env node

/**
 * PaperForge — Standalone Bulk Examination Paper Ingestion CLI
 * Discovers, pairs, and concurrently ingests Singapore JC examination papers into the Question Bank.
 *
 * Usage:
 *   npm run ingest:bulk -- --dir ./papers --dry-run
 *   npm run ingest:bulk -- --dir ./papers --concurrency 4
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { scanLocalDirectory } from './scanner';
import { pairDiscoveredPdfs } from './pairing';
import { runBulkIngestion } from './pipeline';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.substring(0, eq).trim();
        let val = trimmed.substring(eq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
PaperForge Bulk Ingestion CLI
Usage:
  paperforge-ingest [options]

Options:
  --dir <path>         Local folder containing exam PDFs (default: ./)
  --dry-run            Scan & pair manifest audit only without executing extraction
  --concurrency <num>  Parallel worker pool size (default: 4)
  --help, -h           Show this help message
`);
  process.exit(0);
}

const dirIdx = args.indexOf('--dir');
const targetDir = dirIdx >= 0 && args[dirIdx + 1] ? args[dirIdx + 1] : process.cwd();
const isDryRun = args.includes('--dry-run') || args.includes('--scan-only');
const concIdx = args.indexOf('--concurrency');
const concurrency = concIdx >= 0 && args[concIdx + 1] ? parseInt(args[concIdx + 1], 10) : 4;

async function run() {
  console.log('================================================================');
  console.log('  PAPERFORGE — BULK EXAMINATION INGESTION ENGINE');
  console.log('================================================================\n');

  console.log(`[i] Target Directory:   ${path.resolve(targetDir)}`);
  console.log(`[i] Concurrency:        ${concurrency} parallel workers`);
  console.log(`[i] Execution Mode:     ${isDryRun ? 'DRY-RUN (Manifest Audit Only)' : 'LIVE INGESTION'}\n`);

  console.log('[+] Phase 1: Scanning directory for Singapore JC examination PDFs...');
  const discovered = await scanLocalDirectory(targetDir);
  console.log(`[✓] Discovered ${discovered.length} total PDF files.\n`);

  console.log('[+] Phase 2: Running QP ↔ Answer Key Auto-Pairing Engine...');
  const manifest = pairDiscoveredPdfs(discovered, targetDir, 'local');

  console.log('----------------------------------------------------------------');
  console.log('  SCAN & PAIRING AUDIT MANIFEST');
  console.log('----------------------------------------------------------------');
  console.log(`  Total PDFs Discovered:     ${manifest.totalDiscovered}`);
  console.log(`  Fully Paired Sets (QP+MS): ${manifest.pairedCount}`);
  console.log(`  Question Papers (No MS):   ${manifest.unpairedQpCount}`);
  console.log(`  Orphaned Answer Keys:      ${manifest.orphanedMsCount}`);
  console.log(`  Duplicate PDFs (SHA-256):  ${manifest.duplicateCount}`);
  console.log('----------------------------------------------------------------\n');

  if (manifest.sets.length === 0) {
    console.log('[!] No examination paper sets found in the target directory.');
    return;
  }

  console.log('Discovered Examination Sets:');
  for (const s of manifest.sets) {
    const qpName = s.questionPaper.filename;
    const msName = s.markScheme ? s.markScheme.filename : '[No Solution Booklet]';
    console.log(`  • ${s.title}`);
    console.log(`    QP: ${qpName}`);
    console.log(`    MS: ${msName}`);
  }
  console.log('');

  if (isDryRun) {
    console.log('[✓] Dry run complete. Manifest verified. Remove --dry-run to execute ingestion.');
    console.log('================================================================');
    return;
  }

  console.log('[+] Phase 3: Executing Concurrent Ingestion Pipeline...');
  const report = await runBulkIngestion(manifest.sets, concurrency, (completed, total, label) => {
    const pct = Math.round((completed / total) * 100);
    console.log(`  [${completed}/${total}] (${pct}%) Ingested: ${label}`);
  });

  console.log('\n================================================================');
  console.log('  BULK INGESTION RUN REPORT');
  console.log('================================================================');
  console.log(`  Total Sets Processed:      ${report.totalSets}`);
  console.log(`  Successful Ingestions:     ${report.successfulSets}`);
  console.log(`  Failed Ingestions:         ${report.failedSets}`);
  console.log(`  Total Questions Ingested:  ${report.totalQuestionsIngested}`);
  console.log(`  Total Answers Ingested:    ${report.totalAnswersIngested}`);
  console.log(`  Total Duration:            ${(report.totalDurationMs / 1000).toFixed(2)}s`);
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('[X] Ingestion Failure:', err);
  process.exit(1);
});
