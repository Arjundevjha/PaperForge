#!/usr/bin/env node

/**
 * PaperForge — GPT-120B / Qwen Enterprise Cloud Reclassification Engine
 * Completely cleanses and reclassifies examination questions using 120-Billion parameter
 * LLM intelligence on Groq Cloud, eliminating Hermes 3B hallucinations.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
const ENV_PATH = path.resolve(process.cwd(), '.env.local');

// Load environment variables
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
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';
const BATCH_SIZE = 5;
const DELAY_MS = 6200; // 6.2s delay to strictly stay under 8,000 TPM

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

const SYSTEM_PROMPT = `You are a Senior Singapore-Cambridge GCE A-Level H2 Mathematics (Syllabus 9758) Chief Examiner.
Your task is to accurately classify each examination question into EXACTLY ONE official syllabus chapter and exact subtopic.

OFFICIAL SYLLABUS TAXONOMY:
1. Functions and Graphs:
   - Functions (domain, range, composite, inverse)
   - Graphs and Transformations (curve sketching, asymptotes, turning points, axial intercepts, conics, transformations like y=f(ax), y=1/f(x))
   - Equations and Inequalities (polynomials, systems of linear equations, inequalities)
2. Sequences and Series:
   - Sequences and Series (method of differences, mathematical induction)
   - Arithmetic and Geometric Progressions (AP/GP formulas, sum to infinity)
   - Binomial Series (binomial expansion, approximations)
3. Vectors:
   - Vectors in 2D and 3D (vectors, dot product, cross product)
   - Lines and Planes in 3D (vector equations of lines and planes, intersections, distances, angles)
4. Complex Numbers:
   - Cartesian Form & Operations (cartesian form, polar form, modulus, argument)
   - Roots of Polynomials (polynomial roots, conjugate roots, De Moivre's theorem)
   - Argand Diagrams & Geometric Loci (sketching loci, regions in Argand diagram)
5. Calculus:
   - Differentiation Techniques & Applications (derivatives, tangents, normals, rates of change, stationary points, optimization)
   - Integration Techniques & Applications (indefinite/definite integrals, substitution, integration by parts, partial fractions, area between curves, volume of revolution)
   - Differential Equations (differential equations relating dy/dx to variables, separation of variables)
   - Maclaurin Series (Maclaurin expansion, series approximations)
6. Probability and Statistics:
   - Probability and Random Variables (permutations, combinations, basic probability, discrete random variables, E(X), Var(X), Binomial distribution)
   - Normal Distribution (normal distribution N(mu, sigma^2), linear combinations of independent normals)
   - Hypothesis Testing (null hypothesis H0, alternative H1, Z-test, T-test, significance level, p-value)
   - Correlation and Linear Regression (scatter diagrams, product moment correlation coefficient r, regression lines y on x)

STRICT MATHEMATICAL BOUNDARY RULES:
- Curve sketching, finding asymptotes (vertical, horizontal, oblique), finding range of rational functions like y=(ax^2+bx+c)/(dx+e), and graph transformations MUST be classified under "Functions and Graphs" -> "Graphs and Transformations" or "Functions". NEVER Calculus / Integration!
- Integration questions MUST involve explicit integral notation (∫, \\int, dx without dy/dx, substitution, area bounded by curve, volume of revolution).
- Derivatives, finding gradients, tangents, normals, stationary points belong to "Calculus" -> "Differentiation Techniques & Applications".
- Hypothesis testing with H0/H1 belongs to "Probability and Statistics" -> "Hypothesis Testing".

Respond ONLY with valid JSON:
{
  "results": [
    {
      "id": "<question_id>",
      "chapter": "<Exact Chapter Name>",
      "subtopic": "<Exact Subtopic Name>",
      "reason": "<one sentence explanation>"
    }
  ]
}`;

async function callGroqWithModel(model: string, items: { id: string; text: string }[]): Promise<any[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Questions to classify:\n${JSON.stringify(items, null, 2)}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after');
    const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 8000;
    console.warn(`[${model} 429] Rate limited. Waiting ${Math.round(waitMs)}ms...`);
    await new Promise((r) => setTimeout(r, Math.min(15000, waitMs)));
    throw new Error(`429 on ${model}`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${model}: ${await res.text()}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) return [];

  const parsed = JSON.parse(rawContent);
  return Array.isArray(parsed.results) ? parsed.results : [];
}

async function callGroqBatch(items: { id: string; text: string }[]): Promise<any[]> {
  try {
    return await callGroqWithModel(PRIMARY_MODEL, items);
  } catch (err: any) {
    console.warn(`[Failover] Primary model (${PRIMARY_MODEL}) failed: ${err.message}. Trying fallback (${FALLBACK_MODEL})...`);
    return await callGroqWithModel(FALLBACK_MODEL, items);
  }
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — GPT-120B HIGH-INTELLIGENCE RECLASSIFIER');
  console.log('================================================================\n');

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

  const targetQuestions = questions.filter((q) => curatedQidSet.has(q.id));
  console.log(`[i] Total curated questions: ${targetQuestions.length}`);

  // Reclassify the 473 questions (index 544..1017) that Hermes degraded
  const startIndex = parseInt(process.argv[2] || '544', 10);
  const endIndex = parseInt(process.argv[3] || String(targetQuestions.length), 10);

  const targetSlice = targetQuestions.slice(startIndex, endIndex);
  console.log(`[i] Cleansing slice [${startIndex}..${endIndex}] (${targetSlice.length} questions)...`);

  const batches: any[][] = [];
  for (let i = 0; i < targetSlice.length; i += BATCH_SIZE) {
    batches.push(targetSlice.slice(i, i + BATCH_SIZE));
  }
  console.log(`[i] Partitioned into ${batches.length} batches of ${BATCH_SIZE} questions each.\n`);

  let totalProcessed = 0;
  let totalChanged = 0;

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    const items = batch.map((q) => ({
      id: q.id,
      text: sanitizeMathText(q.textContent).slice(0, 400).replace(/\s+/g, ' '),
    }));

    try {
      const results = await callGroqBatch(items);
      const resultMap = new Map(results.map((r) => [r.id, r]));

      for (const q of batch) {
        const res = resultMap.get(q.id);
        if (res && res.chapter && res.subtopic) {
          const changed = q.chapter !== res.chapter || q.subtopic !== res.subtopic;
          if (changed) {
            totalChanged++;
            console.log(`[+] ${q.id}: ${q.chapter} • ${q.subtopic} -> ${res.chapter} • ${res.subtopic}`);
          }
          q.chapter = res.chapter;
          q.subtopic = res.subtopic;
          q.syllabusVersionId = 'SEAB-9758-Official';
        }
      }

      totalProcessed += batch.length;
      console.log(`[Batch ${bIdx + 1}/${batches.length}] Processed ${totalProcessed}/${targetSlice.length} questions (${totalChanged} corrected)...`);

      // Flush every 5 batches
      if ((bIdx + 1) % 5 === 0) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    } catch (err: any) {
      console.error(`[!] Error in batch ${bIdx + 1}:`, err.message);
      await new Promise((r) => setTimeout(r, 6000));
    }
  }

  // Final flush to disk
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

  console.log('\n================================================================');
  console.log(`[✓] CLEANSING & RECLASSIFICATION COMPLETE!`);
  console.log(`    Total Questions Checked:   ${totalProcessed}`);
  console.log(`    Total Fixed / Corrected:   ${totalChanged}`);
  console.log(`    Updated Store:             ${STORE_PATH}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
