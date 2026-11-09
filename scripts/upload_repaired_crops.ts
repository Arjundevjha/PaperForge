import * as fs from 'node:fs';
import * as path from 'node:path';
import { getStorageProvider, SupabaseStorageProvider } from '../packages/storage/src/index';

const REPAIRED_QIDS = [
  'dhs-2023-p2-q04',
  'dhs-2024-p1-q03',
  'ri-2024-p1-q01',
  'sajc-2022-p1-q12',
  'tmjc-2025-p2-q01',
  'vjc-2012-p2-q06',
  'vjc-2025-p2-q06',
  'ejc-2020-p1-q02',
];

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — UPLOAD REPAIRED ANSWER CROPS TO SUPABASE CDN');
  console.log('================================================================\n');

  const storage = getStorageProvider('supabase') as SupabaseStorageProvider;
  const answersDir = path.resolve(process.cwd(), 'apps/web/public/answers');

  for (const qid of REPAIRED_QIDS) {
    const mainFile = path.join(answersDir, `${qid}.png`);
    if (fs.existsSync(mainFile)) {
      const buf = fs.readFileSync(mainFile);
      const res = await storage.upload(`answers/${qid}.png`, buf, 'image/png');
      console.log(`[✓] Uploaded answers/${qid}.png (${(buf.length / 1024).toFixed(1)} KB) -> ${res.publicUrl}`);
    }

    // Upload slices if any
    for (let s = 1; s <= 5; s++) {
      const sliceFile = path.join(answersDir, `${qid}_${s}.png`);
      if (fs.existsSync(sliceFile)) {
        const buf = fs.readFileSync(sliceFile);
        const res = await storage.upload(`answers/${qid}_${s}.png`, buf, 'image/png');
        console.log(`  [+] Uploaded answers/${qid}_${s}.png (${(buf.length / 1024).toFixed(1)} KB) -> ${res.publicUrl}`);
      }
    }
  }

  console.log('\n[✓] All repaired answer crops uploaded to Supabase Storage CDN successfully.');
}

main().catch((err) => {
  console.error('[!] Upload error:', err);
  process.exit(1);
});
