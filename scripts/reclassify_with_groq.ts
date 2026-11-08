#!/usr/bin/env node

/**
 * PaperForge — Groq Cloud Reclassification Engine
 * Audits questions in .paperforge-store.json and reclassifies them using Groq (Llama 3.3 / Qwen)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { classifyWithGroq } from '../packages/classification/src/groq';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
const ENV_PATH = path.resolve(process.cwd(), '.env.local');

// Load environment variables from .env.local
if (fs.existsSync(ENV_PATH)) {
  const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — GROQ CLOUD RECLASSIFICATION ENGINE');
  console.log('================================================================\n');

  if (!process.env.GROQ_API_KEY) {
    console.error('[!] Missing GROQ_API_KEY in .env.local');
    process.exit(1);
  }

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`[!] Store file not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  const questions: any[] = store.questions || [];

  const curatedQidSet = new Set<string>();
  for (const ws of store.worksheets || []) {
    for (const qid of ws.manifest?.questions || []) {
      curatedQidSet.add(qid);
    }
  }

  // Identify questions needing verification within curated worksheets
  const candidates = questions.filter((q) => {
    if (!curatedQidSet.has(q.id)) return false;
    if (!q.subtopic || q.subtopic === 'undefined' || q.subtopic === 'null') return true;
    if (q.id === 'jpjc-2025-p1-q05') return true;
    if (q.chapter === 'Calculus' && (q.subtopic === 'Differentiation & Applications' || !q.subtopic)) {
      const t = q.textContent || '';
      return (
        t.includes('∫') ||
        t.includes('\uf0f2') ||
        t.includes('\uf0f3') ||
        t.includes('\\int') ||
        /\bsubstitution\b/i.test(t) ||
        /\bdefinite integral\b/i.test(t) ||
        /\bintegrate\b/i.test(t)
      );
    }
    return false;
  });

  console.log(`[+] Found ${candidates.length} candidate questions to audit via Groq Cloud LLM.\n`);

  let reclassifiedCount = 0;
  let unchangedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const q = candidates[i];
    const prevSubtopic = q.subtopic;
    const prevChapter = q.chapter;

    try {
      const res = await classifyWithGroq('mathematics', q.textContent);

      if (res.subtopic && (res.chapter !== prevChapter || res.subtopic !== prevSubtopic)) {
        console.log(`[${i + 1}/${candidates.length}] RECLASSIFIED: ${q.id}`);
        console.log(`    Before: ${prevChapter} • ${prevSubtopic}`);
        console.log(`    After:  ${res.chapter} • ${res.subtopic} (Confidence: ${res.confidence})`);
        console.log(`    Reason: ${res.reason}\n`);

        q.chapter = res.chapter;
        q.subtopic = res.subtopic;
        q.syllabusVersionId = res.syllabusVersion;
        reclassifiedCount++;
      } else {
        unchangedCount++;
      }
    } catch (err) {
      console.warn(`[!] Failed to classify ${q.id}:`, err);
    }

    // 2100ms pause to guarantee staying under Groq's 30 RPM rate limit
    await new Promise((r) => setTimeout(r, 2100));
  }

  // Save updated store
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

  console.log('================================================================');
  console.log(`[✓] AUDIT COMPLETE:`);
  console.log(`    Total Audited:      ${candidates.length}`);
  console.log(`    Reclassified:       ${reclassifiedCount}`);
  console.log(`    Confirmed Correct:  ${unchangedCount}`);
  console.log(`    Saved:              ${STORE_PATH}`);
  console.log('================================================================\n');
}

main().catch(console.error);
