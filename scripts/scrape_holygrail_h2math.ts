#!/usr/bin/env node
/**
 * Holy Grail A-Level H2 Mathematics Scraper & Downloader
 * 
 * Crawls https://grail.moe -> A-Level -> H2 Mathematics,
 * discovers all examination papers and answer keys,
 * downloads them via https://api.grail.moe/note/download/:id,
 * and dumps them into the specified output directory.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

interface DocumentItem {
  id: string;
  slug: string;
  title: string;
  type: string;
  downloadUrl: string;
}

interface DownloadManifestItem {
  id: string;
  title: string;
  type: string;
  slug: string;
  filename: string;
  filePath: string;
  sizeBytes: number;
  downloadedAt: string;
}

interface ScraperOptions {
  outputDir: string;
  concurrency: number;
  limit?: number;
  filterType: 'papers' | 'all';
  dryRun: boolean;
}

function parseCliArgs(): ScraperOptions {
  const args = process.argv.slice(2);
  const options: ScraperOptions = {
    outputDir: path.resolve(process.cwd(), 'papers/h2_mathematics'),
    concurrency: 4,
    filterType: 'papers',
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      options.outputDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--concurrency' || arg === '-c') {
      options.concurrency = Math.max(1, parseInt(args[++i], 10) || 4);
    } else if (arg === '--limit' || arg === '-l') {
      const val = args[++i];
      if (val && val.toLowerCase() !== 'all') {
        options.limit = parseInt(val, 10);
      }
    } else if (arg === '--type' || arg === '-t') {
      options.filterType = args[++i]?.toLowerCase() === 'all' ? 'all' : 'papers';
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function sanitizeFilename(title: string, id: string): string {
  let clean = decodeHtmlEntities(title);
  // Replace invalid filesystem characters with underscores
  clean = clean.replace(/[/\\?%*:|"<>]/g, '_');
  // Collapse whitespace and multiple underscores
  clean = clean.replace(/\s+/g, '_').replace(/_+/g, '_');
  // Trim underscores from ends
  clean = clean.replace(/^_+|_+$/g, '');
  // Limit length to keep filesystem safe
  if (clean.length > 180) {
    clean = clean.substring(0, 180);
  }
  return `${clean}_${id}.pdf`;
}

async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 1500;
      console.warn(`[WARN] Fetch failed for ${url} (attempt ${attempt}/${retries}): ${(err as Error).message}. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

function parseItemsFromHtml(html: string): DocumentItem[] {
  const itemRegex = /<li[^>]*><a[^>]+href="\/library\/([0-9]+)\/([^"]+)"[^>]*>([\s\S]*?)<\/a><span[^>]*>([\s\S]*?)<\/span><\/li>/g;
  const items: DocumentItem[] = [];
  let m: RegExpExecArray | null;

  while ((m = itemRegex.exec(html)) !== null) {
    const id = m[1];
    const slug = m[2];
    const rawTitle = m[3];
    const rawType = m[4];

    // Strip internal HTML tags if any
    const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, '').trim());
    const type = decodeHtmlEntities(rawType.replace(/<[^>]+>/g, '').trim());

    // Filter out pagination artifacts if any
    if (type.includes('Next page') || type.includes('Previous page')) {
      continue;
    }

    items.push({
      id,
      slug,
      title,
      type,
      downloadUrl: `https://api.grail.moe/note/download/${id}`,
    });
  }

  return items;
}

export async function crawlHolyGrailCatalog(): Promise<DocumentItem[]> {
  console.log('🔍 [1/3] Crawling Holy Grail catalog: A-Level -> H2 Mathematics...');
  const baseUrl = 'https://grail.moe/notes/a-level/h2-mathematics';
  
  // Discover pages
  const catalog: DocumentItem[] = [];
  const seenIds = new Set<string>();

  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const url = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
    console.log(`  -> Fetching catalog page ${currentPage} (${url})...`);
    
    const html = await fetchPage(url);
    const pageItems = parseItemsFromHtml(html);

    if (pageItems.length === 0) {
      console.log(`  -> No items found on page ${currentPage}. End of catalog.`);
      break;
    }

    let addedCount = 0;
    for (const item of pageItems) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        catalog.push(item);
        addedCount++;
      }
    }

    console.log(`  -> Page ${currentPage}: parsed ${pageItems.length} items (${addedCount} new, total: ${catalog.length})`);

    // Check if next page link exists
    const hasNextPage = html.includes(`page=${currentPage + 1}`) || html.includes('Next page');
    if (hasNextPage && addedCount > 0) {
      currentPage++;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ [1/3] Discovered total of ${catalog.length} items across ${currentPage} pages.`);
  return catalog;
}

export function filterExamPapersAndAnswerKeys(items: DocumentItem[], filterType: 'papers' | 'all'): DocumentItem[] {
  if (filterType === 'all') {
    return items;
  }

  // Paper & Answer key categories:
  // - Exam Papers
  // - MYEs/CAs/Other Tests
  // - TYS Answers
  // - User Mock Papers
  // Or items whose title contains strong paper/solution keywords even if classified as Notes/Practices
  const targetTypes = new Set(['Exam Papers', 'MYEs/CAs/Other Tests', 'TYS Answers', 'User Mock Papers']);
  
  return items.filter((item) => {
    if (targetTypes.has(item.type)) {
      return true;
    }

    const lowerTitle = item.title.toLowerCase();
    const isPaperOrSolution =
      lowerTitle.includes('prelim') ||
      lowerTitle.includes('promo') ||
      lowerTitle.includes('paper 1') ||
      lowerTitle.includes('paper 2') ||
      lowerTitle.includes('solution') ||
      lowerTitle.includes('answer key') ||
      lowerTitle.includes('suggested ms') ||
      lowerTitle.includes('marking scheme');

    return isPaperOrSolution;
  });
}

async function downloadSingleFile(
  item: DocumentItem,
  destFolder: string,
  retries = 3
): Promise<{ filename: string; sizeBytes: number; skipped: boolean }> {
  const filename = sanitizeFilename(item.title, item.id);
  const destPath = path.join(destFolder, filename);

  // Resume check: if file already exists with valid non-zero size, skip
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 1024) {
      return { filename, sizeBytes: stat.size, skipped: true };
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(item.downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,*/*',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const tempPath = `${destPath}.tmp.${Date.now()}`;
      const fileStream = fs.createWriteStream(tempPath);
      // @ts-expect-error Node fetch stream vs Web stream
      await finished(Readable.fromWeb(res.body).pipe(fileStream));

      // Validate downloaded PDF header
      const fd = fs.openSync(tempPath, 'r');
      const headerBuf = Buffer.alloc(5);
      fs.readSync(fd, headerBuf, 0, 5, 0);
      fs.closeSync(fd);

      if (headerBuf.toString() !== '%PDF-') {
        fs.unlinkSync(tempPath);
        throw new Error('Downloaded file does not start with valid %PDF- magic bytes');
      }

      // Rename temp file to target
      fs.renameSync(tempPath, destPath);
      const stat = fs.statSync(destPath);
      return { filename, sizeBytes: stat.size, skipped: false };
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 2000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error(`Download failed after ${retries} attempts`);
}

async function runWorkerPool<T, R>(
  items: T[],
  concurrency: number,
  workerFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      results[index] = await workerFn(item, index);
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(pool);
  return results;
}

export async function main() {
  const options = parseCliArgs();

  console.log('====================================================');
  console.log('   Holy Grail A-Level H2 Mathematics Scraper');
  console.log('====================================================');
  console.log(`📁 Output Directory: ${options.outputDir}`);
  console.log(`⚡ Concurrency:      ${options.concurrency} workers`);
  console.log(`🎯 Scope:            ${options.filterType === 'papers' ? 'Exam Papers & Answer Keys only' : 'All materials'}`);
  console.log(`🔢 Limit:            ${options.limit ?? 'All matching'}`);
  console.log(`🧪 Dry Run:          ${options.dryRun}`);
  console.log('====================================================\n');

  // Ensure output directory exists
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  // 1. Crawl catalog
  const catalog = await crawlHolyGrailCatalog();

  // 2. Filter papers and answer keys
  console.log('\n🎯 [2/3] Filtering Exam Papers & Answer Keys...');
  let targetItems = filterExamPapersAndAnswerKeys(catalog, options.filterType);
  console.log(`  -> Filtered ${targetItems.length} papers & answer keys from ${catalog.length} total items.`);

  if (options.limit && options.limit > 0) {
    targetItems = targetItems.slice(0, options.limit);
    console.log(`  -> Applied limit: proceeding with ${targetItems.length} items.`);
  }

  if (options.dryRun) {
    console.log('\n🧪 [DRY RUN] Items that would be downloaded:');
    targetItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.type}] ${item.title} (ID: ${item.id}) -> ${sanitizeFilename(item.title, item.id)}`);
    });
    return;
  }

  // 3. Download files
  console.log(`\n⬇️  [3/3] Downloading ${targetItems.length} files into ${options.outputDir}...`);
  const manifest: DownloadManifestItem[] = [];
  const startTime = Date.now();
  let downloadedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;

  await runWorkerPool(targetItems, options.concurrency, async (item, index) => {
    const progress = `[${index + 1}/${targetItems.length}]`;
    try {
      const { filename, sizeBytes, skipped } = await downloadSingleFile(item, options.outputDir);
      totalBytes += sizeBytes;

      if (skipped) {
        skippedCount++;
        console.log(`  ${progress} ⏩ Skipped (already exists): ${filename} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        downloadedCount++;
        console.log(`  ${progress} ✅ Downloaded: ${item.title} -> ${filename} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
      }

      manifest.push({
        id: item.id,
        title: item.title,
        type: item.type,
        slug: item.slug,
        filename,
        filePath: path.join(options.outputDir, filename),
        sizeBytes,
        downloadedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`  ${progress} ❌ Error downloading ${item.title} (ID: ${item.id}): ${(err as Error).message}`);
    }
  });

  // Write manifest.json
  const manifestPath = path.join(options.outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalMb = (totalBytes / 1024 / 1024).toFixed(2);

  console.log('\n====================================================');
  console.log('   Download Run Complete!');
  console.log('====================================================');
  console.log(`⏱️  Elapsed Time:     ${elapsedSec}s`);
  console.log(`📥 Downloaded:       ${downloadedCount} files`);
  console.log(`⏩ Skipped Existing: ${skippedCount} files`);
  console.log(`💾 Total Data:       ${totalMb} MB`);
  console.log(`📄 Manifest File:    ${manifestPath}`);
  console.log(`📁 Files Location:   ${options.outputDir}`);
  console.log('====================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error running Holy Grail scraper:', err);
    process.exit(1);
  });
}
