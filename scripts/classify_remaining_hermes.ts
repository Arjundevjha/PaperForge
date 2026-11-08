#!/usr/bin/env node

/**
 * PaperForge — Local Hermes Curriculum Reclassification Engine
 * Uses local Hermes (hermes3:3b on Ollama) to reclassify remaining curated examination questions.
 * Enforces strict JSON Schema enums and syllabus taxonomy.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const MODEL = process.env.OLLAMA_MODEL || 'hermes3:3b';
const CONCURRENCY = 3;

const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    chapter: {
      type: 'string',
      enum: [
        'Functions and Graphs',
        'Sequences and Series',
        'Vectors',
        'Complex Numbers',
        'Calculus',
        'Probability and Statistics',
      ],
    },
    subtopic: {
      type: 'string',
      enum: [
        'Functions',
        'Graphs and Transformations',
        'Equations and Inequalities',
        'Sequences and Series',
        'Arithmetic and Geometric Progressions',
        'Binomial Series',
        'Vectors in 2D and 3D',
        'Lines and Planes in 3D',
        'Cartesian Form & Operations',
        'Roots of Polynomials',
        'Argand Diagrams & Loci',
        'Differentiation & Applications',
        'Definite Integrals & Applications',
        'Differential Equations',
        'Maclaurin Series',
        'Probability and Random Variables',
        'Normal Distribution',
        'Hypothesis Testing',
        'Correlation and Linear Regression',
      ],
    },
  },
  required: ['chapter', 'subtopic'],
};

const SYSTEM_PROMPT = `You are an expert Singapore-Cambridge GCE A-Level H2 Mathematics (Syllabus 9758) examiner.
Classify the given question into EXACTLY ONE Chapter and Subtopic.

Allowed Chapters & Subtopics:
1. Functions and Graphs:
   - Functions (domain, range, composite, inverse)
   - Graphs and Transformations (conics, sketching curves, asymptotes)
   - Equations and Inequalities (polynomials, systems of equations, inequalities)
2. Sequences and Series:
   - Sequences and Series (method of differences, induction)
   - Arithmetic and Geometric Progressions (AP/GP formulas)
   - Binomial Series (binomial expansions, approximations)
3. Vectors:
   - Vectors in 2D and 3D (vectors, dot product, cross product)
   - Lines and Planes in 3D (line equations, plane equations, intersections, distances)
4. Complex Numbers:
   - Cartesian Form & Operations (cartesian form, polar form, modulus, argument)
   - Roots of Polynomials (polynomial roots, conjugate roots, De Moivre's)
   - Argand Diagrams & Loci (sketching loci, regions in Argand diagram)
5. Calculus:
   - Differentiation & Applications (derivatives, tangents, normals, rates of change, stationary points, optimization)
   - Definite Integrals & Applications (integration, definite/indefinite integrals, substitution, by parts, area under curve, volume of revolution)
   - Differential Equations (separation of variables, differential equations relating derivatives and variables)
   - Maclaurin Series (Maclaurin expansion, series approximations)
6. Probability and Statistics:
   - Probability and Random Variables (permutations, combinations, basic probability, discrete random variables, E(X), Var(X), Binomial distribution)
   - Normal Distribution (normal distribution, linear combination of independent normal variables)
   - Hypothesis Testing (null hypothesis H0, alternative H1, sample mean, Z-test, T-test, significance level, p-value)
   - Correlation and Linear Regression (scatter diagrams, product moment correlation coefficient r, regression lines y on x)

Rules:
- Questions involving integral signs (∫, \\int, dx without dy/dx, substitution, area between curves, volume of revolution) MUST be "Calculus" -> "Definite Integrals & Applications".
- Questions asking for dy/dx, derivatives, tangents, normals, maximum/minimum, rates of change MUST be "Calculus" -> "Differentiation & Applications".
- Questions with differential equations relating dy/dx to variables MUST be "Calculus" -> "Differential Equations".
- Questions with random variables X, expectation E(X), variance Var(X), discrete distributions, permutations, combinations MUST be "Probability and Statistics" -> "Probability and Random Variables".
- Questions with normal distribution N(mu, sigma^2) MUST be "Probability and Statistics" -> "Normal Distribution".
- Questions with hypothesis testing (H0, H1, significance level, p-value) MUST be "Probability and Statistics" -> "Hypothesis Testing".
- Questions with bivariate data, scatter diagrams, regression line, PMCC r MUST be "Probability and Statistics" -> "Correlation and Linear Regression".`;

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

async function classifyWithHermes(textContent: string): Promise<{ chapter: string; subtopic: string }> {
  const cleanText = sanitizeMathText(textContent).slice(0, 500);

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Question: ${cleanText}` },
      ],
      format: CLASSIFICATION_SCHEMA,
      stream: false,
      options: { temperature: 0.0 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data.message?.content?.trim();
  if (!content) {
    throw new Error('Empty response from Ollama Hermes');
  }

  const parsed = JSON.parse(content);
  if (!parsed.chapter || !parsed.subtopic) {
    throw new Error(`Incomplete classification from Hermes: ${content}`);
  }

  return {
    chapter: parsed.chapter.trim(),
    subtopic: parsed.subtopic.trim(),
  };
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — LOCAL HERMES CURRICULUM RECLASSIFICATION ENGINE');
  console.log('================================================================\n');

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
  console.log(`[i] Total curated questions in store: ${targetQuestions.length}`);

  // Default range: from 544 to 1017 (the remaining 473 questions), or configurable via CLI
  const startIndex = parseInt(process.argv[2] || '544', 10);
  const endIndex = parseInt(process.argv[3] || String(targetQuestions.length), 10);

  const workSlice = targetQuestions.slice(startIndex, endIndex);
  console.log(`[i] Processing slice [${startIndex}..${endIndex}] (${workSlice.length} questions) using ${MODEL} on Ollama...`);
  console.log(`[i] Concurrency: ${CONCURRENCY} workers\n`);

  let totalProcessed = 0;
  let totalChanged = 0;
  let errorCount = 0;
  const startTime = Date.now();

  // Worker queue processor
  let queueIdx = 0;

  async function worker(workerId: number) {
    while (queueIdx < workSlice.length) {
      const currentWorkIdx = queueIdx++;
      const q = workSlice[currentWorkIdx];
      const absIdx = startIndex + currentWorkIdx;

      try {
        const result = await classifyWithHermes(q.textContent);
        const oldChapter = q.chapter;
        const oldSubtopic = q.subtopic;
        const changed = oldChapter !== result.chapter || oldSubtopic !== result.subtopic;

        if (changed) {
          totalChanged++;
        }

        q.chapter = result.chapter;
        q.subtopic = result.subtopic;
        q.syllabusVersionId = 'SEAB-9758-Official';

        totalProcessed++;

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (totalProcessed / (Number(elapsedSec) || 1)).toFixed(2);
        const remaining = workSlice.length - totalProcessed;
        const etaSec = (remaining / (Number(rate) || 1)).toFixed(0);

        if (changed) {
          console.log(`[W${workerId}][${absIdx + 1}/${targetQuestions.length}] ${q.id}: ${oldChapter} • ${oldSubtopic} -> ${result.chapter} • ${result.subtopic} (${rate} q/s, ETA: ${etaSec}s)`);
        } else {
          process.stdout.write(`\r[Progress: ${totalProcessed}/${workSlice.length} | Changed: ${totalChanged} | ${rate} q/s | ETA: ${etaSec}s]`);
        }

        // Periodic checkpoint every 20 questions
        if (totalProcessed % 20 === 0) {
          fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
        }
      } catch (err: any) {
        errorCount++;
        console.error(`\n[W${workerId}][!] Error classifying ${q.id}:`, err.message);
      }
    }
  }

  // Launch concurrent workers
  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Final flush to disk
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\n================================================================');
  console.log(`[✓] HERMES CLASSIFICATION COMPLETE!`);
  console.log(`    Total Questions Processed: ${totalProcessed}/${workSlice.length}`);
  console.log(`    Total Reclassified:        ${totalChanged}`);
  console.log(`    Errors:                    ${errorCount}`);
  console.log(`    Time Elapsed:              ${totalTimeSec}s`);
  console.log(`    Database Store:            ${STORE_PATH}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
