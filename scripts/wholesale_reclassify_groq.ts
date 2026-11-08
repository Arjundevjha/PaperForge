#!/usr/bin/env node

/**
 * PaperForge — Wholesale Groq Cloud Reclassification Engine
 * Batches examination questions into Groq (Qwen 27B / Llama 3.3) for full curriculum reclassification.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

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

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const BATCH_SIZE = 8;
const DELAY_MS = 2200; // Stay within 30 requests per minute

function sanitizeMathText(raw: string): string {
  if (!raw) return '';
  return raw
    .replaceAll('\uf0f2', '∫')
    .replaceAll('\uf0f3', '∫')
    .replaceAll('\uf0f4', '∫')
    .replaceAll('\uf0f5', '∫')
    .replaceAll('', '∫')
    .replaceAll('\uf0d6', '√')
    .replaceAll('', '√')
    .replaceAll('\uf070', 'π')
    .replaceAll('\uf071', 'θ')
    .replaceAll('\uf0a3', '≤')
    .replaceAll('\uf0b3', '≥')
    .replaceAll('\uf0b4', '×')
    .replaceAll('\uf0b1', '±')
    .replaceAll('\uf0a5', '∞')
    .trim();
}

async function callGroqBatch(items: { id: string; text: string }[]): Promise<any[]> {
  const prompt = `You are an expert Singapore-Cambridge GCE A-Level H2 Mathematics (Syllabus 9758) examiner.

Your task is to classify each of the following examination questions into EXACTLY ONE official syllabus chapter and its exact subtopic.

Official Syllabus Chapters & Subtopics:
1. Functions and Graphs:
   - Functions
   - Graphs and Transformations
   - Equations and Inequalities
2. Sequences and Series:
   - Sequences and Series
   - Arithmetic and Geometric Progressions
   - Binomial Series
3. Vectors:
   - Vectors in 2D and 3D
   - Lines and Planes in 3D
4. Complex Numbers:
   - Cartesian Form & Operations
   - Roots of Polynomials
   - Argand Diagrams & Geometric Loci
5. Calculus:
   - Differentiation Techniques & Applications
   - Integration Techniques & Applications
   - Differential Equations
   - Maclaurin Series
6. Probability and Statistics:
   - Probability and Random Variables
   - Normal Distribution
   - Hypothesis Testing
   - Linear Regression

CRITICAL MATHEMATICAL DISTINCTION RULES:
- Any question involving integral notation (∫, \\int, dx without dy/dx, substitution u = f(x), integration by parts, definite integrals, area between curves, volume of revolution) MUST be classified as "Integration Techniques & Applications". NEVER Differentiation.
- Any question asking for dy/dx, second derivatives, tangents, normals, stationary points, or connected rates of change belongs to "Differentiation Techniques & Applications".
- Any question with an equation relating dy/dx to x and y requiring separation of variables belongs to "Differential Equations".

Questions to classify:
${JSON.stringify(items, null, 2)}

Respond ONLY with valid JSON in this exact structure:
{
  "results": [
    {
      "id": "<question_id>",
      "chapter": "<Exact Chapter Name>",
      "subtopic": "<Exact Subtopic Name>",
      "confidence": <number between 0.0 and 1.0>,
      "reason": "<short explanation>"
    }
  ]
}`;

  let res: Response | null = null;
  const maxRetries = 4;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = res.headers.get('retry-after');
      const waitTime = retryAfter
        ? Math.max(1500, parseFloat(retryAfter) * 1000)
        : Math.min(12000, 2000 * Math.pow(2, attempt));
      console.warn(`[Groq 429] Rate limited. Backing off for ${Math.round(waitTime)}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    throw new Error(`Groq API returned HTTP ${res?.status}: ${await res?.text()}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) return [];

  const parsed = JSON.parse(rawContent);
  return Array.isArray(parsed.results) ? parsed.results : [];
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — WHOLESALE GROQ CLOUD RECLASSIFICATION');
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

  // Collect the curated questions across active worksheets
  const curatedQidSet = new Set<string>();
  for (const ws of store.worksheets || []) {
    for (const qid of ws.manifest?.questions || []) {
      curatedQidSet.add(qid);
    }
  }

  const targetQuestions = questions.filter((q) => curatedQidSet.has(q.id));
  console.log(`[i] Total curated questions to reclassify wholly: ${targetQuestions.length}`);

  const batches: any[][] = [];
  for (let i = 0; i < targetQuestions.length; i += BATCH_SIZE) {
    batches.push(targetQuestions.slice(i, i + BATCH_SIZE));
  }

  console.log(`[i] Partitioned into ${batches.length} batches of ${BATCH_SIZE} questions each.\n`);

  let totalReclassified = 0;
  let totalProcessed = 0;

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    const items = batch.map((q) => ({
      id: q.id,
      text: sanitizeMathText(q.textContent).slice(0, 400),
    }));

    try {
      const results = await callGroqBatch(items);
      const resultMap = new Map(results.map((r) => [r.id, r]));

      for (const q of batch) {
        const res = resultMap.get(q.id);
        if (res && res.chapter && res.subtopic) {
          const changed = q.chapter !== res.chapter || q.subtopic !== res.subtopic;
          if (changed) {
            totalReclassified++;
          }
          q.chapter = res.chapter;
          q.subtopic = res.subtopic;
          q.syllabusVersionId = 'SEAB-9758-Official';
        }
      }

      totalProcessed += batch.length;
      console.log(`[Batch ${bIdx + 1}/${batches.length}] Processed ${totalProcessed}/${targetQuestions.length} questions (${totalReclassified} updated so far)...`);

      // Flush to disk every 10 batches
      if ((bIdx + 1) % 10 === 0) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    } catch (err) {
      console.error(`[!] Error processing batch ${bIdx + 1}:`, err);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // Final flush to disk
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

  console.log('\n================================================================');
  console.log(`[✓] WHOLESALE RECLASSIFICATION COMPLETE!`);
  console.log(`    Total Questions Checked:  ${totalProcessed}`);
  console.log(`    Total Reclassified:       ${totalReclassified}`);
  console.log(`    Updated:                  ${STORE_PATH}`);
  console.log('================================================================\n');
}

main().catch(console.error);
