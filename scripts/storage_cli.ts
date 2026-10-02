#!/usr/bin/env node

/**
 * PaperForge — Storage Management & Synchronization CLI
 * Inspects bucket health, tests uploads, and synchronizes diagram assets to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/storage_cli.ts --status
 *   npx tsx scripts/storage_cli.ts --sync-diagrams
 *   npx tsx scripts/storage_cli.ts --list incoming
 *   npx tsx scripts/storage_cli.ts --upload-worksheets
 *   npx tsx scripts/storage_cli.ts --upload-worksheets --worksheet WS-MATH-01
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getStorageProvider, SupabaseStorageProvider } from '../packages/storage/src/index';
import { getGlobalStore, bootstrapCanonicalPapers } from '../packages/db/src/index';
import { compileWorksheetDocuments } from '../packages/worksheets/src/index';

// Load environment from .env.local if not already in process.env
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
const isStatus = (args.includes('--status') || args.length === 0) && !args.includes('--upload-worksheets');
const isSyncDiagrams = args.includes('--sync-diagrams');
const isUsage = args.includes('--usage') || args.includes('--quota');
const isUploadWorksheets = args.includes('--upload-worksheets');
const wsIdx = args.indexOf('--worksheet');
const targetWorksheetArg = wsIdx >= 0 && args[wsIdx + 1] ? args[wsIdx + 1] : null;
const limitIdx = args.indexOf('--set-limit');
const setLimitMB = limitIdx >= 0 && args[limitIdx + 1] ? Number(args[limitIdx + 1]) : null;
const listIdx = args.indexOf('--list');
const listPrefix = listIdx >= 0 && args[listIdx + 1] ? args[listIdx + 1] : null;

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — STORAGE ENGINE & OBJECT STORE CONSOLE');
  console.log('================================================================\n');

  const storage = getStorageProvider('supabase');
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'paperforge';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Configured';

  console.log(`[i] Storage Driver:    Supabase Storage`);
  console.log(`[i] Project URL:       ${url}`);
  console.log(`[i] Target Bucket:     ${bucketName}`);
  console.log(`[i] Service Key Auth:  ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'Configured (Active)' : 'Missing'}\n`);

  if (isStatus) {
    console.log('[+] Verifying live bucket connectivity...');
    try {
      const items = await storage.list('');
      console.log(`[✓] BUCKET ONLINE: Connected to "${bucketName}" successfully!`);
      console.log(`    Root Objects/Prefixes found: ${items.length}`);
      try {
        const sp = storage as any;
        if (sp.client && sp.client.storage) {
          const { data: bData } = await sp.client.storage.getBucket(bucketName);
          if (bData) {
            console.log(`    Bucket File Size Limit: ${bData.file_size_limit ? (bData.file_size_limit / (1024 * 1024)).toFixed(0) + ' MB' : 'Unlimited / Global Default'}`);
          }
        }
      } catch {}
      if (items.length > 0) {
        for (const item of items.slice(0, 10)) {
          console.log(`    - ${item.name} (${(item.size / 1024).toFixed(1)} KB)`);
        }
      } else {
        console.log('    (Bucket is ready and currently waiting for examination papers)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[X] BUCKET ERROR: ${msg}`);
    }
  }

  if (setLimitMB) {
    console.log(`[+] Attempting to update bucket "${bucketName}" file size limit to ${setLimitMB} MB...`);
    try {
      const sp = storage as any;
      if (sp.client && sp.client.storage) {
        const { error } = await sp.client.storage.updateBucket(bucketName, {
          fileSizeLimit: setLimitMB * 1024 * 1024,
        });
        if (error) {
          console.error(`[X] Failed to update bucket limit: ${error.message}`);
        } else {
          console.log(`[✓] Successfully updated bucket limit to ${setLimitMB} MB!`);
        }
      }
    } catch (err: unknown) {
      console.error(`[X] Error updating bucket limit: ${err}`);
    }
  }

  if (isUsage) {
    console.log('[+] Auditing Supabase Storage usage and Free Tier quota...');
    try {
      let totalFiles = 0;
      let totalBytes = 0;
      const folderBreakdown: Record<string, { files: number; bytes: number }> = {};

      async function crawl(prefix: string) {
        const items = await storage.list(prefix);
        for (const item of items) {
          if (item.name.endsWith('.pdf') || item.name.endsWith('.png') || item.name.endsWith('.jpg')) {
            totalFiles++;
            totalBytes += item.size;
            const topLevel = item.path.split('/')[0] || 'root';
            if (!folderBreakdown[topLevel]) {
              folderBreakdown[topLevel] = { files: 0, bytes: 0 };
            }
            folderBreakdown[topLevel].files++;
            folderBreakdown[topLevel].bytes += item.size;
          } else {
            // It's a directory / prefix
            await crawl(item.path);
          }
        }
      }

      await crawl('');

      const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
      const freeTierLimitMB = 1024; // 1 GB
      const percentUsed = ((totalBytes / (1024 * 1024 * 1024)) * 100).toFixed(1);
      const remainingMB = (freeTierLimitMB - Number(totalMB)).toFixed(2);

      console.log('\n================================================================');
      console.log('         SUPABASE STORAGE USAGE & FREE TIER QUOTA REPORT        ');
      console.log('================================================================');
      console.log(`Total Uploaded Objects: ${totalFiles}`);
      console.log(`Total Storage Used:     ${totalMB} MB (${totalBytes} bytes)`);
      console.log(`Free Tier Limit:        1,024.00 MB (1.00 GB)`);
      console.log(`Quota Consumption:      ${percentUsed}%`);
      console.log(`Remaining Free Space:   ${remainingMB} MB`);
      console.log('----------------------------------------------------------------');
      console.log('Top-Level Folder Breakdown:');
      for (const [folder, data] of Object.entries(folderBreakdown)) {
        console.log(`  - ${folder.padEnd(16)}: ${data.files.toString().padStart(5)} files | ${(data.bytes / (1024 * 1024)).toFixed(2)} MB`);
      }
      console.log('================================================================\n');
    } catch (err: unknown) {
      console.error('[X] Quota audit failed:', err instanceof Error ? err.message : err);
    }
  }

  if (listPrefix !== null) {
    console.log(`\n[+] Listing contents under prefix: "${listPrefix}"...`);
    try {
      const items = await storage.list(listPrefix);
      console.log(`    Found ${items.length} items:`);
      for (const item of items) {
        console.log(`    - ${item.path} [${(item.size / 1024).toFixed(1)} KB]`);
      }
    } catch (err: unknown) {
      console.error(`[X] List failed:`, err instanceof Error ? err.message : err);
    }
  }

  if (isSyncDiagrams) {
    console.log('\n[+] Synchronizing local diagram assets to Supabase Storage...');
    const diagramsBase = path.resolve(process.cwd(), 'apps', 'web', 'public', 'diagrams');
    let uploadedCount = 0;

    for (const sub of ['questions', 'answers']) {
      const subDir = path.join(diagramsBase, sub);
      if (!fs.existsSync(subDir)) continue;

      const files = fs.readdirSync(subDir).filter((f) => f.endsWith('.png'));
      for (const file of files) {
        const filePath = path.join(subDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const remotePath = `diagrams/${sub}/${file}`;

        try {
          const res = await storage.upload(remotePath, fileBuffer, 'image/png');
          console.log(`    [✓] Synced: ${remotePath} -> ${res.publicUrl}`);
          uploadedCount++;
        } catch (err: unknown) {
          console.error(`    [!] Failed to sync ${file}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    console.log(`\n[✓] Diagram sync complete: ${uploadedCount} diagram PNG assets uploaded to Supabase Storage.`);
  }

  if (isUploadWorksheets) {
    console.log('[+] Compiling and uploading publication-grade worksheets to Supabase Storage bucket...');
    const store = getGlobalStore();
    bootstrapCanonicalPapers(store);

    const worksheets = store.listWorksheets('mathematics');
    console.log(`    Found ${worksheets.length} worksheets in store.\n`);

    const targetList = targetWorksheetArg
      ? worksheets.filter(
          (w) =>
            w.id === targetWorksheetArg ||
            w.worksheetNumber?.toLowerCase() === targetWorksheetArg.toLowerCase()
        )
      : worksheets;

    if (targetList.length === 0) {
      console.error(`[!] No matching worksheet found for "${targetWorksheetArg}".`);
      return;
    }

    let successCount = 0;
    for (const ws of targetList) {
      const cleanChapter = ws.chapter.replace(/[^a-zA-Z0-9]/g, '_');
      const qFilename = `${ws.worksheetNumber}_${cleanChapter}_Questions.pdf`;
      const aFilename = `${ws.worksheetNumber}_${cleanChapter}_AnswerKey.pdf`;
      const qPath = `worksheets/${qFilename}`;
      const aPath = `worksheets/${aFilename}`;

      console.log(`----------------------------------------------------------------`);
      console.log(`[i] Compiling ${ws.worksheetNumber}: ${ws.title}`);
      console.log(`    Manifest Questions: ${ws.manifest?.questions?.length || 0}`);

      const { questions, answers } = store.getWorksheetQuestions(ws.id);
      console.log(`    Banked Questions: ${questions.length}, Answers: ${answers.length}`);

      const startTime = Date.now();
      const { questionPdf, answerPdf } = await compileWorksheetDocuments(ws, questions, answers);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`    [✓] Compiled in ${duration}s (Questions: ${(questionPdf.length / (1024 * 1024)).toFixed(2)} MB, Answers: ${(answerPdf.length / (1024 * 1024)).toFixed(2)} MB)`);

      // 1. Upload Questions PDF
      console.log(`    [+] Uploading ${qPath}...`);
      const qRes = await storage.upload(qPath, Buffer.from(questionPdf), 'application/pdf');
      console.log(`        -> Storage URL: ${qRes.publicUrl}`);

      // 2. Upload Answer Key PDF
      console.log(`    [+] Uploading ${aPath}...`);
      const aRes = await storage.upload(aPath, Buffer.from(answerPdf), 'application/pdf');
      console.log(`        -> Storage URL: ${aRes.publicUrl}`);

      successCount += 2;
    }

    console.log(`\n[✓] Publication-Grade Upload Complete: ${successCount} PDFs uploaded to "paperforge" storage bucket!`);
  }

  console.log('\n================================================================');
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
