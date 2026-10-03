#!/usr/bin/env node

/**
 * PaperForge — Synchronize Question and Answer Crops to Supabase Storage
 * Uploads all authentic question and marking scheme screenshots for all 6 worksheets
 * directly to the Supabase Storage bucket ('paperforge') under questions/ and answers/.
 *
 * This allows the live web application (TeacherResourceHub canvas) to load high-resolution
 * authentic paper screenshots directly from the Supabase CDN, eliminating all 404 errors
 * and preventing any fallback to raw scanned OCR text.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getStorageProvider, SupabaseStorageProvider } from '../packages/storage/src/index';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
const QUESTIONS_DIR = path.resolve(process.cwd(), 'apps/web/public/questions');
const ANSWERS_DIR = path.resolve(process.cwd(), 'apps/web/public/answers');

interface UploadTask {
  localPath: string;
  remotePath: string;
  type: 'question' | 'answer';
  size: number;
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — CLOUD ASSET SYNCHRONIZATION ENGINE');
  console.log('================================================================\n');

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`[!] Store file not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const storage = getStorageProvider('supabase') as SupabaseStorageProvider;
  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  const worksheets: any[] = store.worksheets || [];

  // Collect all unique question IDs used in the 6 worksheets
  const worksheetQids = new Set<string>();
  for (const ws of worksheets) {
    for (const qid of ws.manifest?.questions || []) {
      worksheetQids.add(qid);
    }
  }

  console.log(`[i] Total unique questions in curated worksheets: ${worksheetQids.size}`);

  const tasks: UploadTask[] = [];

  for (const qid of worksheetQids) {
    // 1. Question Screenshot
    const qPath = path.join(QUESTIONS_DIR, `${qid}.png`);
    if (fs.existsSync(qPath)) {
      tasks.push({
        localPath: qPath,
        remotePath: `questions/${qid}.png`,
        type: 'question',
        size: fs.statSync(qPath).size,
      });
    }

    // 2. Answer Composite Screenshot
    const aPath = path.join(ANSWERS_DIR, `${qid}.png`);
    if (fs.existsSync(aPath)) {
      tasks.push({
        localPath: aPath,
        remotePath: `answers/${qid}.png`,
        type: 'answer',
        size: fs.statSync(aPath).size,
      });
    }
  }

  const totalBytes = tasks.reduce((sum, t) => sum + t.size, 0);
  console.log(`[i] Prepared ${tasks.length} image asset upload tasks (${(totalBytes / (1024 * 1024)).toFixed(2)} MB).`);
  console.log(`    - Question crops: ${tasks.filter((t) => t.type === 'question').length}`);
  console.log(`    - Answer composites: ${tasks.filter((t) => t.type === 'answer').length}\n`);

  console.log(`[+] Starting concurrent upload to Supabase Storage ("paperforge" bucket)...`);
  const startTime = Date.now();
  let completed = 0;
  let failed = 0;
  const CONCURRENCY = 15;

  let taskIndex = 0;
  async function worker() {
    while (taskIndex < tasks.length) {
      const idx = taskIndex++;
      const task = tasks[idx];
      try {
        const buffer = fs.readFileSync(task.localPath);
        await storage.upload(task.remotePath, buffer, 'image/png');
        completed++;
      } catch (err: unknown) {
        failed++;
        console.error(`  [!] Failed to upload ${task.remotePath}:`, err instanceof Error ? err.message : err);
      }

      if (completed % 100 === 0 || completed === tasks.length) {
        const pct = ((completed / tasks.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`    [Progress] ${completed}/${tasks.length} uploaded (${pct}%) in ${elapsed}s...`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n================================================================`);
  console.log(`[✓] CLOUD ASSET SYNCHRONIZATION COMPLETE in ${duration}s!`);
  console.log(`    Successfully Uploaded: ${completed} / ${tasks.length}`);
  console.log(`    Failed Uploads:        ${failed}`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('[X] Fatal sync error:', err);
  process.exit(1);
});
