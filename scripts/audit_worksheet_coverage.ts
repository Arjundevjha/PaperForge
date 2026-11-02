#!/usr/bin/env node

/**
 * PaperForge — Nationwide Worksheet Question & Answer Coverage Audit CLI
 * Audits every question in all 6 worksheets across both local store and Supabase database.
 * Checks local files, Supabase Storage CDN, answer slices, and text fallback risks.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
const QUESTIONS_DIR = path.resolve(process.cwd(), 'apps/web/public/questions');
const ANSWERS_DIR = path.resolve(process.cwd(), 'apps/web/public/answers');

// Load environment variables
const envFiles = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'apps/web/.env.local'),
];
for (const file of envFiles) {
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf-8');
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mavqeszmyxfdppckqprw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'paperforge';
const cdnBase = `${supabaseUrl}/storage/v1/object/public/${bucket}`;

const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

interface QuestionAudit {
  qid: string;
  worksheetNum: string;
  source: string;
  localQuestion: boolean;
  localAnswer: boolean;
  localAnswerSlices: number;
  cdnQuestion?: boolean;
  cdnAnswer?: boolean;
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — QUESTION & ANSWER COVERAGE AUDIT');
  console.log('================================================================\n');

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`Store not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  const localWorksheets: any[] = store.worksheets || [];

  console.log(`[i] Local store has ${localWorksheets.length} worksheets.`);

  // 1. Fetch remote worksheets and questions if Supabase is available
  let remoteWorksheets: any[] = [];
  let remoteWorksheetQuestions: any[] = [];
  if (supabase) {
    console.log('[+] Fetching worksheets and worksheet_questions from Supabase PostgreSQL...');
    const wsRes = await supabase.from('worksheets').select('*').order('worksheet_number');
    const wqRes = await supabase.from('worksheet_questions').select('*').order('position').range(0, 5000);
    remoteWorksheets = wsRes.data || [];
    remoteWorksheetQuestions = wqRes.data || [];
    console.log(`[✓] Supabase has ${remoteWorksheets.length} worksheets and ${remoteWorksheetQuestions.length} worksheet_question rows.\n`);
  }

  // Map remote questions by worksheet id
  const remoteQMap = new Map<string, string[]>();
  for (const row of remoteWorksheetQuestions) {
    if (!remoteQMap.has(row.worksheet_id)) {
      remoteQMap.set(row.worksheet_id, []);
    }
    remoteQMap.get(row.worksheet_id)!.push(row.question_id);
  }

  // Compare worksheet questions between store and Supabase
  console.log('----------------------------------------------------------------');
  console.log('  WORKSHEET COMPARISON: LOCAL STORE VS SUPABASE DB');
  console.log('----------------------------------------------------------------');
  for (const ws of localWorksheets) {
    const wsId = ws.id;
    const wsNum = ws.worksheetNumber || ws.worksheet_number;
    const localQids: string[] = ws.manifest?.questions || [];
    const remoteQids = remoteQMap.get(wsId) || [];

    const diffLocalNotRemote = localQids.filter((q) => !remoteQids.includes(q));
    const diffRemoteNotLocal = remoteQids.filter((q) => !localQids.includes(q));

    console.log(`  ${wsNum} (${wsId}):`);
    console.log(`    - Local store questions:    ${localQids.length}`);
    console.log(`    - Supabase DB questions:    ${remoteQids.length}`);
    if (diffLocalNotRemote.length > 0 || diffRemoteNotLocal.length > 0) {
      console.log(`    [!] DESYNCHRONIZED:`);
      console.log(`        In local but not remote: ${diffLocalNotRemote.length} (e.g. ${diffLocalNotRemote.slice(0, 3).join(', ')})`);
      console.log(`        In remote but not local: ${diffRemoteNotLocal.length} (e.g. ${diffRemoteNotLocal.slice(0, 3).join(', ')})`);
    } else {
      console.log(`    [✓] Synchronized (${localQids.length} questions identical)`);
    }
  }
  console.log('----------------------------------------------------------------\n');

  // Collect ALL questions across all sources
  const allAuditedQids = new Map<string, { wsNum: string; source: string }>();
  for (const ws of localWorksheets) {
    const wsNum = ws.worksheetNumber || ws.worksheet_number;
    for (const qid of ws.manifest?.questions || []) {
      if (!allAuditedQids.has(qid)) {
        allAuditedQids.set(qid, { wsNum, source: 'local_store' });
      }
    }
  }
  for (const [wsId, qids] of remoteQMap.entries()) {
    const ws = remoteWorksheets.find((w) => w.id === wsId);
    const wsNum = ws?.worksheet_number || wsId;
    for (const qid of qids) {
      if (!allAuditedQids.has(qid)) {
        allAuditedQids.set(qid, { wsNum, source: 'supabase_db' });
      } else {
        const cur = allAuditedQids.get(qid)!;
        cur.source = 'both';
      }
    }
  }

  // Also include vjc-2012-p1-q06 explicitly if not present
  if (!allAuditedQids.has('vjc-2012-p1-q06')) {
    allAuditedQids.set('vjc-2012-p1-q06', { wsNum: 'WS-MATH-01 (explicit)', source: 'test_case' });
  }

  console.log(`[+] Total distinct questions to audit across worksheets: ${allAuditedQids.size}`);

  const missingLocalQuestions: string[] = [];
  const missingLocalAnswers: string[] = [];
  const missingCdnQuestions: string[] = [];
  const missingCdnAnswers: string[] = [];

  const results: QuestionAudit[] = [];

  for (const [qid, info] of allAuditedQids.entries()) {
    const localQ = fs.existsSync(path.join(QUESTIONS_DIR, `${qid}.png`));
    const localA = fs.existsSync(path.join(ANSWERS_DIR, `${qid}.png`));

    let slices = 0;
    for (let i = 1; i <= 10; i++) {
      if (fs.existsSync(path.join(ANSWERS_DIR, `${qid}_${i}.png`))) {
        slices++;
      } else {
        break;
      }
    }

    if (!localQ) missingLocalQuestions.push(qid);
    if (!localA && slices === 0) missingLocalAnswers.push(qid);

    results.push({
      qid,
      worksheetNum: info.wsNum,
      source: info.source,
      localQuestion: localQ,
      localAnswer: localA || slices > 0,
      localAnswerSlices: slices,
    });
  }

  console.log(`\n================================================================`);
  console.log('  LOCAL ASSET DEFECT AUDIT');
  console.log('================================================================');
  console.log(`  Total Questions Audited:           ${results.length}`);
  console.log(`  Missing Local Question Screenshots: ${missingLocalQuestions.length}`);
  if (missingLocalQuestions.length > 0) {
    console.log(`    -> ${missingLocalQuestions.join(', ')}`);
  }
  console.log(`  Missing Local Answer Crops (0 slices): ${missingLocalAnswers.length}`);
  if (missingLocalAnswers.length > 0) {
    for (const qid of missingLocalAnswers) {
      const r = results.find((x) => x.qid === qid);
      console.log(`    - [${qid}] in ${r?.worksheetNum} (${r?.source})`);
    }
  }
  console.log('================================================================\n');

  // Verify CDN for a batch of sample questions or all
  console.log('[+] Verifying Supabase CDN availability for all audited questions...');
  let cdnQFail = 0;
  let cdnAFail = 0;
  const cdnQFailedList: string[] = [];
  const cdnAFailedList: string[] = [];

  // Concurrently check CDN status in chunks of 50
  const qidList = Array.from(allAuditedQids.keys());
  const CHUNK_SIZE = 40;
  for (let i = 0; i < qidList.length; i += CHUNK_SIZE) {
    const chunk = qidList.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (qid) => {
        const qUrl = `${cdnBase}/questions/${qid}.png`;
        const aUrl = `${cdnBase}/answers/${qid}.png`;
        const [qOk, aOk] = await Promise.all([checkUrl(qUrl), checkUrl(aUrl)]);
        if (!qOk) {
          cdnQFail++;
          cdnQFailedList.push(qid);
        }
        if (!aOk) {
          cdnAFail++;
          cdnAFailedList.push(qid);
        }
      })
    );
    process.stdout.write(`\r  Checked ${Math.min(i + CHUNK_SIZE, qidList.length)}/${qidList.length} assets on Supabase CDN...`);
  }

  console.log('\n\n================================================================');
  console.log('  SUPABASE STORAGE CDN HEALTH REPORT');
  console.log('================================================================');
  console.log(`  CDN Base URL:                      ${cdnBase}`);
  console.log(`  CDN 404 Question Screenshots:      ${cdnQFail}`);
  if (cdnQFail > 0) {
    console.log(`    Failed Questions on CDN (${cdnQFail}):`);
    for (const qid of cdnQFailedList.slice(0, 15)) {
      const r = results.find((x) => x.qid === qid);
      console.log(`      - [${qid}] (local exists: ${r?.localQuestion})`);
    }
  }
  console.log(`  CDN 404 Answer Slices/Composites:  ${cdnAFail}`);
  if (cdnAFail > 0) {
    console.log(`    Failed Answers on CDN (${cdnAFail}):`);
    for (const qid of cdnAFailedList.slice(0, 15)) {
      const r = results.find((x) => x.qid === qid);
      console.log(`      - [${qid}] (local slices: ${r?.localAnswerSlices})`);
    }
  }
  console.log('================================================================\n');
}

main().catch(console.error);
