#!/usr/bin/env node

/**
 * PaperForge — Storage Management & Synchronization CLI
 * Inspects bucket health, tests uploads, and synchronizes diagram assets to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/storage_cli.ts --status
 *   npx tsx scripts/storage_cli.ts --sync-diagrams
 *   npx tsx scripts/storage_cli.ts --list incoming
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getStorageProvider, SupabaseStorageProvider } from '../packages/storage/src/index';

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
const isStatus = args.includes('--status') || args.length === 0;
const isSyncDiagrams = args.includes('--sync-diagrams');
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

  console.log('\n================================================================');
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
