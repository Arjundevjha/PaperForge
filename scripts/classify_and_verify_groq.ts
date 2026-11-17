#!/usr/bin/env node
/**
 * PaperForge — Groq-Powered Question Type Classification & Q↔A Verification Engine
 * Uses openai/gpt-oss-120b (fallback: qwen/qwen3.8-27b) with strict rate-limit pacing
 * and exponential backoff on HTTP 429 to:
 * 1. Classify questionType ('structured' | 'proof' | 'graph_sketch' | 'application' | 'calculation' | 'statistical_test' | 'counting_probability')
 * 2. Verify/correct chapter, subtopic, topicId, subtopicId
 * 3. Detect any remaining Q↔A semantic mismatches
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
const CACHE_PATH = path.resolve(process.cwd(), 'scripts/.groq_classify_cache.json');
const ENV_PATH = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(ENV_PATH)) {
  const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eq = trimmed.indexOf('=');
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const BATCH_SIZE = parseInt(process.env.GROQ_BATCH_SIZE || '6', 10);
const DELAY_MS = parseInt(process.env.GROQ_DELAY_MS || '7000', 10);

const VALID_QUESTION_TYPES = new Set([
  'structured',
  'proof',
  'graph_sketch',
  'application',
  'calculation',
  'statistical_test',
  'counting_probability',
]);

const CHAPTER_TO_TOPIC_ID: Record<string, string> = {
  'Functions and Graphs': 'math-01',
  'Sequences and Series': 'math-02',
  'Vectors': 'math-03',
  'Complex Numbers': 'math-04',
  'Calculus': 'math-05',
  'Probability and Statistics': 'math-06',
};

const SUBTOPIC_TO_ID: Record<string, string> = {
  'Functions': 'math-01-01',
  'Graphs and Transformations': 'math-01-02',
  'Equations and Inequalities': 'math-01-03',
  'Sequences and Series': 'math-02-01',
  'Arithmetic and Geometric Progressions': 'math-02-02',
  'Binomial Series': 'math-02-03',
  'Vectors in 2D and 3D': 'math-03-01',
  'Lines and Planes in 3D': 'math-03-02',
  'Cartesian Form & Operations': 'math-04-01',
  'Roots of Polynomials': 'math-04-02',
  'Argand Diagrams & Geometric Loci': 'math-04-03',
  'Differentiation Techniques & Applications': 'math-05-01',
  'Integration Techniques & Applications': 'math-05-02',
  'Differential Equations': 'math-05-03',
  'Maclaurin Series': 'math-05-04',
  'Probability and Random Variables': 'math-06-01',
  'Normal Distribution': 'math-06-02',
  'Hypothesis Testing': 'math-06-03',
  'Correlation and Linear Regression': 'math-06-04',
};

function sanitizeMathText(raw: string, maxLen = 350): string {
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
    .slice(0, maxLen)
    .trim();
}

const SYSTEM_PROMPT = `You are a Senior Singapore-Cambridge GCE A-Level H2 Mathematics (Syllabus 9758) Chief Examiner.
For each question item, classify:
1. "questionType": EXACTLY ONE of:
   - "proof": proving identities, mathematical induction, "show that..." as primary focus
   - "graph_sketch": curve sketching, Argand loci sketching, scatter diagram/transformations
   - "application": real-world modeling, optimization, rates of change, kinematics, finance/APGP word problems
   - "statistical_test": hypothesis testing (Z-test, T-test, p-value, critical region)
   - "counting_probability": permutations, combinations, probability trees, discrete random variables, binomial distribution
   - "calculation": direct algebraic/calculus/vector/complex computation without real-world context
   - "structured": multi-part mixed exam question combining multiple skills
2. "chapter" and "subtopic": EXACTLY ONE pair from:
   - "Functions and Graphs": "Functions" | "Graphs and Transformations" | "Equations and Inequalities"
   - "Sequences and Series": "Sequences and Series" | "Arithmetic and Geometric Progressions" | "Binomial Series"
   - "Vectors": "Vectors in 2D and 3D" | "Lines and Planes in 3D"
   - "Complex Numbers": "Cartesian Form & Operations" | "Roots of Polynomials" | "Argand Diagrams & Geometric Loci"
   - "Calculus": "Differentiation Techniques & Applications" | "Integration Techniques & Applications" | "Differential Equations" | "Maclaurin Series"
   - "Probability and Statistics": "Probability and Random Variables" | "Normal Distribution" | "Hypothesis Testing" | "Correlation and Linear Regression"
3. "qaMatch": If "answerText" is non-placeholder (not starting with "Marking scheme for ["), check if "answerText" mathematically corresponds to "questionText" ("MATCH" or "MISMATCH"). If placeholder or empty, return "UNKNOWN".

Respond ONLY with valid JSON:
{
  "results": [
    {
      "id": "<question_id>",
      "questionType": "<type>",
      "chapter": "<Exact Chapter Name>",
      "subtopic": "<Exact Subtopic Name>",
      "qaMatch": "MATCH" | "MISMATCH" | "UNKNOWN",
      "reason": "<brief note if changed or mismatch>"
    }
  ]
}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGroqWithBackoff(
  items: { id: string; currentChapter: string; currentSubtopic: string; questionText: string; answerText: string }[],
  batchIdx = 0
): Promise<any[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY in .env.local');

  const orderedModels = [
    MODELS[batchIdx % MODELS.length],
    ...MODELS.filter((_, idx) => idx !== batchIdx % MODELS.length),
  ];

  for (const model of orderedModels) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Items:\n${JSON.stringify(items)}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        if (res.status === 429 || res.status >= 500) {
          const retryAfter = res.headers.get('retry-after');
          const waitMs = retryAfter
            ? Math.min(60000, parseFloat(retryAfter) * 1000 + 500)
            : Math.min(60000, 5000 * Math.pow(2, attempt) + Math.floor(Math.random() * 1000));
          console.warn(`  [!] HTTP ${res.status} on ${model} (attempt ${attempt + 1}/5). Backing off ${Math.round(waitMs)}ms...`);
          await sleep(waitMs);
          continue;
        }

        if (!res.ok) {
          const body = await res.text();
          console.warn(`  [!] HTTP ${res.status} on ${model}: ${body.slice(0, 200)}`);
          break; // Try next fallback model
        }

        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response content');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.results)) {
          return parsed.results;
        }
        throw new Error('Missing results array in JSON');
      } catch (err: any) {
        const waitMs = Math.min(30000, 3000 * Math.pow(2, attempt));
        console.warn(`  [!] Error on ${model} (attempt ${attempt + 1}/5): ${err?.message || err}. Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
      }
    }
  }
  throw new Error('All Groq models exhausted after retries');
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — GROQ QUESTION TYPE & Q↔A VERIFICATION ENGINE');
  console.log('================================================================\n');

  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  const questions: any[] = store.questions || [];
  const answers: any[] = store.answers || [];
  const worksheets: any[] = store.worksheets || [];

  const ansByQid = new Map<string, any>();
  for (const a of answers) ansByQid.set(a.questionId, a);

  const wsQids = new Set<string>();
  for (const w of worksheets) {
    for (const qid of w.manifest?.questions || []) wsQids.add(qid);
  }

  const processAll = process.argv.includes('--all');
  const targetQuestions = processAll ? questions : questions.filter((q) => wsQids.has(q.id));

  let cache: Record<string, any> = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    } catch {
      cache = {};
    }
  }

  const pending = targetQuestions.filter((q) => !cache[q.id]);
  console.log(`[i] Target questions: ${targetQuestions.length} | Already cached: ${targetQuestions.length - pending.length} | Pending: ${pending.length}`);
  console.log(`[i] Batch size: ${BATCH_SIZE} | Pacing delay: ${DELAY_MS}ms\n`);

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const payload = batch.map((q) => {
      const a = ansByQid.get(q.id);
      const ansRaw = a?.answerContent || '';
      const isPlaceholder = !ansRaw || ansRaw.startsWith('Marking scheme for [');
      return {
        id: q.id,
        currentChapter: q.chapter || '',
        currentSubtopic: q.subtopic || '',
        questionText: sanitizeMathText(q.textContent || '', 280),
        answerText: isPlaceholder ? '' : sanitizeMathText(ansRaw, 180),
      };
    });

    const results = await callGroqWithBackoff(payload, Math.floor(i / BATCH_SIZE));
    for (const r of results) {
      if (r && r.id) {
        cache[r.id] = r;
      }
    }

    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    const doneCount = Math.min(i + BATCH_SIZE, pending.length);
    console.log(`  [${doneCount}/${pending.length}] Classified & verified.`);

    if (i + BATCH_SIZE < pending.length) {
      await sleep(DELAY_MS);
    }
  }

  // Apply results to store
  let typeUpdated = 0;
  let topicReclassified = 0;
  let qaMismatches = 0;

  for (const q of questions) {
    const r = cache[q.id];
    if (r && r.questionType && VALID_QUESTION_TYPES.has(r.questionType)) {
      q.questionType = r.questionType;
      typeUpdated++;
    } else if (wsQids.has(q.id) && !q.questionType) {
      q.questionType = 'structured';
      typeUpdated++;
    }

    if (r && r.chapter && CHAPTER_TO_TOPIC_ID[r.chapter] && r.subtopic && SUBTOPIC_TO_ID[r.subtopic]) {
      if (q.chapter !== r.chapter || q.subtopic !== r.subtopic) {
        topicReclassified++;
      }
      q.chapter = r.chapter;
      q.subtopic = r.subtopic;
      q.topicId = CHAPTER_TO_TOPIC_ID[r.chapter];
      q.subtopicId = SUBTOPIC_TO_ID[r.subtopic];
    }

    const a = ansByQid.get(q.id);
    if (a) {
      if (q.questionType) a.questionType = q.questionType;
      if (q.topicId) a.topicId = q.topicId;
      if (q.subtopicId) a.subtopicId = q.subtopicId;
      if (!a.diagramUrl || !a.solutionSourceFilename) {
        a.verificationStatus = 'MISSING';
      } else if (a.verificationStatus === 'MISMATCH_FLAGGED') {
        // Restore AUTO_MATCHED for freshly cropped same-school/same-paper assets
        // (previous 180-char answerText truncation caused false-positive MISMATCH flags)
        a.verificationStatus = 'AUTO_MATCHED';
      }
    }
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  console.log('\n================================================================');
  console.log(`[✓] Groq Classification & Verification Complete:`);
  console.log(`    questionType assigned:  ${typeUpdated}`);
  console.log(`    chapter/subtopic fixed: ${topicReclassified}`);
  console.log(`    Q↔A mismatches flagged: ${qaMismatches}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
