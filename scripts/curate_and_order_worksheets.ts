import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in apps/web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Hand-curated authentic Singapore JC examination questions with exact LaTeX typography
const CURATED_QUESTIONS: Record<string, string> = {
  'yijc-2020-p2-q01': `(i) State the derivative of $\\tan(x^3)$. [1]\n\n(ii) Find $\\int 6x^5 \\sec^2(x^3)\\,\\mathrm{d}x$. [3]`,
  'rvhs-2021-p1-q06': `A curve $C$ has parametric equations $x = \\mathrm{e}^t$, $y = \\sin t$ where $0 \\le t \\le \\pi$.\n\n(i) Find $\\int \\mathrm{e}^t \\sin t\\,\\mathrm{d}t$. [4]\n\n(ii) Sketch the graph of $C$. [1]\n\n(iii) Find the area of the region bounded by $C$, the $x$-axis, the lines $x = 1$ and $x = \\mathrm{e}^a$, where $a$ is a positive real constant, in terms of $a$. [2]`,
  'ri-2024-p1-q02': `A graphing calculator is not to be used in answering this question.\n\nGiven that $3 - 4\\mathrm{i}$ is a root of the equation $z^3 + az^2 + bz + 25 = 0$, find the values of the real numbers $a$ and $b$ and the remaining roots of the equation. [4]`,
  'nyjc-2012-p1-q08': `(a) Solve the equation $\\mathrm{i}z^5 = -32$, giving your roots in the form $r\\mathrm{e}^{\\mathrm{i}\\theta}$, where $r > 0$ and $-\\pi < \\theta \\le \\pi$.\n\nSketch on an Argand diagram the points $P_1, P_2, P_3, P_4, P_5$ representing these roots, where $P_1$ represents the root with the smallest argument and $P_1 P_2 P_3 P_4 P_5$ is a polygon described in an anticlockwise sense. Find the area of $P_1 P_2 P_3 P_4 P_5$. [6]\n\n(b) On an Argand diagram sketch clearly the locus of $P$ where $P$ represents the complex number $z$ such that $z$ satisfies both $|z - 2 - 2\\mathrm{i}| \\le 1$ and $\\arg(z - 1) = \\arg(1 + \\mathrm{i}\\sqrt{3})$.\n\nFind the range of values of $\\arg(z - 3 - 2\\mathrm{i})$, given that $|z - 2 - 2\\mathrm{i}| \\le 1$ and $\\arg(z - 1) = \\arg(1 + \\mathrm{i}\\sqrt{3})$. [4]`,
  'nyjc-2012-p2-q01': `(a) The complex numbers $z$ and $w$ are such that $z = 1 + \\mathrm{i}a$, $w = -b - \\mathrm{i}$ where $a$ and $b$ are real and positive. Given that $zw = 6 - 11\\mathrm{i}$, find the exact values of $a$ and $b$. [4]\n\n(b) The conjugate of a complex number $u$ has modulus 2 and argument $\\frac{2\\pi}{3}$ and another complex number $v$ has modulus 5 and argument $\\frac{3\\pi}{4}$. Find the exact values of the modulus and argument of $\\frac{v}{u}$. [2]\n\nHence, find the smallest positive integer $n$ such that the point representing $\\left(\\frac{v}{u}\\right)^{2n}$ lies on the negative imaginary axis. [2]`,
  'tjc-2012-p1-q04': `(i) Find the roots of the equation $z^3 + 8\\mathrm{i} = 0$, giving them in cartesian form $a + \\mathrm{i}b$, where $a$ and $b$ are exact real numbers. [3]\n\n(ii) The roots of the equation $(z - 3 - 2\\mathrm{i})^3 + 8\\mathrm{i} = 0$ are $z_1, z_2, z_3$ such that $\\text{Re}(z_1) < \\text{Re}(z_2) < \\text{Re}(z_3)$. Hence find $z_1, z_2, z_3$ in cartesian form $a + \\mathrm{i}b$, where $a$ and $b$ are exact real numbers. [2]\n\n(iii) Show $z_1, z_2, z_3$ on an Argand diagram. [1]\n\n(iv) Explain why the locus of all points $z$ such that $|z - z_2| = |z - z_3|$ passes through the point representing $z_1$. Draw this locus on your Argand diagram and find the minimum value of $|z|$. [5]`,
  'vjc-2012-p1-q12': `(a) Let $z$ be the complex number $-1 + \\mathrm{i}\\sqrt{3}$. Find:\n(i) $\\arg(z)$ [1]\n(ii) the real number $a$ such that $\\arg(z(z + a)) = \\frac{\\pi}{6}$. [4]\n\n(b) Solve the equation $z^3 = 3 - 3\\mathrm{i}\\sqrt{3}$, leaving your answers in the form $r\\mathrm{e}^{\\mathrm{i}\\theta}$, where $r > 0$ and $-\\pi < \\theta \\le \\pi$. [5]\n\nDeduce the roots of $w^6 = 3 - 3\\mathrm{i}\\sqrt{3}$. [3]`,
  'yijc-2020-p2-q02': `(a) Given that $z = \\frac{\\lambda - 4\\mathrm{i}}{1 - \\lambda\\mathrm{i}}$ where $\\lambda \\in \\mathbb{R}$ and $\\arg(z) = \\pi$, find the value of $z$. [3]\n\n(b) Do not use a calculator in answering this question.\nThe complex numbers $z$ and $w$ are given by $z = \\frac{1+\\mathrm{i}}{1-\\mathrm{i}}$ and $w = 1 + \\mathrm{i}\\sqrt{2}$.\n\n(i) Express $z$ and $w$ in exact polar form $r\\mathrm{e}^{\\mathrm{i}\\theta}$ where $r > 0$ and $-\\pi < \\theta \\le \\pi$. [2]\n\n(ii) On a single Argand diagram, sketch the points $A, B$ and $C$ representing the complex numbers $z, w$ and $z+w$ respectively. State the geometric shape of $OACB$. [2]`,
  'nyjc-2012-p1-q02': `The vectors $\\mathbf{a}$ and $\\mathbf{b}$ are given by $\\mathbf{a} = (\\sin \\theta)\\mathbf{i} + (\\cos \\theta)\\mathbf{j} + \\mathbf{k}$ and $\\mathbf{b} = (\\sin \\phi)\\mathbf{i} + (\\cos \\phi)\\mathbf{j} + \\mathbf{k}$, where $0 \\le \\theta \\le \\phi \\le \\pi$.\n\nFind an expression for $\\mathbf{a} \\times \\mathbf{b}$ in terms of $\\delta$, where $\\delta = \\frac{1}{2}(\\phi - \\theta)$. [5]\n\nDeduce that the angle $\\alpha$ between $\\mathbf{a}$ and $\\mathbf{b}$ is given by $\\sin \\frac{\\alpha}{2} = \\sin \\delta \\sqrt{1 + \\cos^2 \\delta}$. [2]`,
  'vjc-2012-p2-q01': `The complex number $z$ satisfies $\\arg(z - 1 - 2\\mathrm{i}) = \\theta$, where $\\theta$ is a fixed angle in the interval $-\\pi < \\theta \\le \\pi$.\n\n(i) Give a geometrical description of the locus of the point $P$ representing $z$. [1]\n\n(ii) Given that $\\theta = \\frac{\\pi}{3}$, find the exact minimum value of $|z - 3 - 5\\mathrm{i}|$. [3]`,
};

export function cleanTextContent(raw: string, qid?: string): string {
  if (qid && CURATED_QUESTIONS[qid]) {
    return CURATED_QUESTIONS[qid];
  }
  if (!raw) return '';

  let text = raw;

  // 1. MathType PUA Characters
  const puaMap: Record<string, string> = {
    '\uf020': ' ',
    '\uf021': '!',
    '\uf028': '(',
    '\uf029': ')',
    '\uf02a': '*',
    '\uf02b': '+',
    '\uf02c': ',',
    '\uf02d': '-',
    '\uf02e': '.',
    '\uf02f': '/',
    '\uf03a': ':',
    '\uf03b': ';',
    '\uf03c': '<',
    '\uf03d': '=',
    '\uf03e': '>',
    '\uf03f': '?',
    '\uf05b': '[',
    '\uf05d': ']',
    '\uf070': 'π',
    '\uf071': 'θ',
    '\uf072': 'ρ',
    '\uf073': 'σ',
    '\uf074': 'τ',
    '\uf075': 'υ',
    '\uf076': 'φ',
    '\uf077': 'ω',
    '\uf061': 'α',
    '\uf062': 'β',
    '\uf063': 'χ',
    '\uf064': 'δ',
    '\uf065': 'ε',
    '\uf066': 'φ',
    '\uf067': 'γ',
    '\uf068': 'η',
    '\uf069': 'ι',
    '\uf06a': 'φ',
    '\uf06b': 'κ',
    '\uf06c': 'λ',
    '\uf06d': 'μ',
    '\uf06e': 'ν',
    '\uf07a': 'ζ',
    '\uf0a3': '≤',
    '\uf0b3': '≥',
    '\uf0b4': '×',
    '\uf0b1': '±',
    '\uf0a5': '∞',
    '\uf0ce': '∈',
    '\uf0c8': '∪',
    '\uf0c7': '∩',
    '\uf0cc': '⊂',
    '\uf0cd': '⊆',
    '\uf0d6': '√',
    '\uf0e0': '→',
    '\uf0de': '⇒',
    '\uf0db': '⇔',
    '\uf0f2': '∫',
    '\uf0f3': '∫',
    '\uf0f4': '∫',
    '\uf0f5': '∫',
    '': '∫',
    '': '',
    '': '',
    '': '≤',
    '': '≥',
    '': '×',
    '−': '-',
    '–': '-',
    '—': '-',
    '“': '"',
    '”': '"',
    '’': "'",
    '‘': "'",
    '': '(',
    '': ')',
    '': 'π',
    '': 'θ',
    '': 'α',
    '': 'β',
    '': 'λ',
    '': 'μ',
    '': 'σ',
    '': 'ω',
    '': '∈',
    '': '∉',
    '': '<',
    '': '>',
    '': '+',
    '': '-',
    '': '=',
    '': '±',
    '': '∞',
    '': '√',
    '': '→',
    '': '⇒',
    '': '⇔',
    '': '∴',
    '': '∪',
    '': '∩',
  };

  for (const [k, v] of Object.entries(puaMap)) {
    text = text.replaceAll(k, v);
  }
  text = text.replace(/[\uE000-\uF8FF]/g, '');

  // 2. Exam Headers, Footers, Watermarks & Margins
  text = text.replace(/©\s*[A-Z0-9/.\s_\-]+(?:\n|$)/gi, '\n');
  text = text.replace(/\b(?:9758|9740)\/\d{2}\/(?:[A-Za-z0-9]+\/)?\d{2}\b/gi, '');
  text = text.replace(/\[\s*Turn\s*[oO]ver\s*\]?/gi, '');
  text = text.replace(/\b(?:End\s+of\s+Paper|BLANK\s+PAGE)\b/gi, '');
  text = text.replace(/\bIntegration\s+not\s+tested\s+in\s+[^\n]*/gi, '');
  text = text.replace(/\b\d{4}\s+[A-Z]{2,6}\s+(?:9758|9740)\/\d{2}\b/gi, '');
  text = text.replace(/\b\d+\s*\|\s*P\s*a\s*g\s*e\b/gi, '');
  text = text.replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '');
  text = text.replace(/DO\s+NOT\s+WRITE\s+IN\s+THIS\s+MARGIN/gi, '');
  text = text.replace(/\bSection\s+[A-Z]:\s*[^\n\[]+(?:\[\d+\s*marks?\])?/gi, '');

  // 3. Question numbering prefixes and trailing stray numbers
  text = text.replace(/^\s*(?:Question\s*)?\d{1,2}\s*[\.:\)]?\s*\n/m, '');
  text = text.replace(/\n\s*\d{1,2}\s*$/m, '');

  // 4. Reflow lines into paragraphs
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const paragraphs: string[] = [];
  let currentGroup: string[] = [];
  const partMarker = /^(\([a-z0-9ivx]+\)|\b(?:Question\s*)?\d+[\.\)]|\bpart\s+[a-z0-9ivx]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (partMarker.test(line)) {
      if (currentGroup.length > 0) {
        paragraphs.push(currentGroup.join(' '));
        currentGroup = [];
      }
      currentGroup.push(line);
    } else {
      const prev = currentGroup[currentGroup.length - 1];
      if (prev && /\[\s*\d+\s*(?:marks?|m)?\s*\]$/i.test(prev)) {
        paragraphs.push(currentGroup.join(' '));
        currentGroup = [line];
      } else {
        currentGroup.push(line);
      }
    }
  }
  if (currentGroup.length > 0) {
    paragraphs.push(currentGroup.join(' '));
  }

  return paragraphs
    .map((p) =>
      p
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.:;?!])/g, '$1')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\[\s+/g, '[')
        .replace(/\s+\]/g, ']')
        .replace(/\bintegral\b/gi, '∫')
        .trim()
    )
    .filter(Boolean)
    .join('\n\n');
}

function scoreQuestion(q: any): number {
  let score = 0;
  const t = q.text_content || '';
  const qid = q.id || '';

  // Boost curated questions
  if (CURATED_QUESTIONS[qid]) score += 1000;

  // Boost questions with LaTeX
  if (t.includes('$')) score += 200;
  if (t.includes('\\frac')) score += 50;
  if (t.includes('\\int')) score += 50;
  if (t.includes('\\mathbf')) score += 50;
  if (t.includes('\\mathrm')) score += 30;

  // Boost questions from real papers with verified diagrams and subparts
  if (qid.startsWith('jpjc-2022') || qid.startsWith('ejc-2022') || qid.startsWith('dhs-2022')) {
    score += 150;
  }

  // Structure boosts
  if (t.includes('(i)')) score += 20;
  if (t.includes('(ii)')) score += 20;
  if (t.includes('[') && t.includes(']')) score += 10;
  if (/^[A-Z]/.test(t) || /^\([a-z0-9]+\)/i.test(t)) score += 10;

  // Penalties
  if (/©[A-Z]+/i.test(t)) score -= 100;
  if (/\[Turn over/i.test(t)) score -= 100;
  if (/\b\w\s+\w\s+\w\s*=\s*\+/i.test(t)) score -= 150;
  if (/\(\)\s*\d/i.test(t)) score -= 150;
  if (/sec\s+d\s+x/i.test(t)) score -= 150;
  if (t.length < 35) score -= 100;
  if (t.length > 2000) score -= 200;

  return score;
}

const CHAPTER_CONFIGS = [
  {
    worksheetNumber: 'WS-MATH-01',
    id: 'ws_math_functions_graphs',
    title: 'WS-MATH-01: Functions and Graphs (Complete Chapter Compendium)',
    chapter: 'Functions and Graphs',
    syllabusVersionId: 'SEAB-9758-Official',
  },
  {
    worksheetNumber: 'WS-MATH-02',
    id: 'ws_math_sequences_series',
    title: 'WS-MATH-02: Sequences and Series: AP/GP & Binomial (Complete Chapter Compendium)',
    chapter: 'Sequences and Series',
    syllabusVersionId: 'SEAB-9758-Official',
  },
  {
    worksheetNumber: 'WS-MATH-03',
    id: 'ws_math_vectors',
    title: 'WS-MATH-03: Vectors: Lines & Planes in 3D (Complete Chapter Compendium)',
    chapter: 'Vectors',
    syllabusVersionId: 'SEAB-9758-Official',
  },
  {
    worksheetNumber: 'WS-MATH-04',
    id: 'ws_math_complex_numbers',
    title: 'WS-MATH-04: Complex Numbers: Cartesian, Roots & Argand (Complete Chapter Compendium)',
    chapter: 'Complex Numbers',
    syllabusVersionId: 'SEAB-9758-Official',
  },
  {
    worksheetNumber: 'WS-MATH-05',
    id: 'ws_math_calculus',
    title: 'WS-MATH-05: Calculus: Differentiation, Maclaurin & Integration (Complete Chapter Compendium)',
    chapter: 'Calculus',
    syllabusVersionId: 'SEAB-9758-Official',
  },
  {
    worksheetNumber: 'WS-MATH-06',
    id: 'ws_math_probability_statistics',
    title: 'WS-MATH-06: Probability & Statistics: Distributions & Hypothesis (Complete Chapter Compendium)',
    chapter: 'Probability and Statistics',
    syllabusVersionId: 'SEAB-9758-Official',
  },
];

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — CURATE, ENHANCE & PRIORITIZE WORKSHEETS');
  console.log('================================================================\n');

  console.log('[+] Fetching all questions from Supabase PostgreSQL...');
  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`[i] Retrieved ${allQuestions.length} total questions.`);

  // 1. Sanitize & Apply Curated LaTeX
  const sanitizedList: any[] = [];
  let updatedCount = 0;
  for (const q of allQuestions) {
    const cleanText = cleanTextContent(q.text_content, q.id);
    const isExcluded = q.status === 'EXCLUDED' || cleanText.length < 20 || cleanText.length > 2200;
    sanitizedList.push({
      ...q,
      text_content: cleanText,
      status: isExcluded ? 'EXCLUDED' : 'READY',
    });
    if (cleanText !== q.text_content) updatedCount++;
  }

  console.log(`[+] Updating ${sanitizedList.length} questions in Supabase in batches of 100...`);
  for (let i = 0; i < sanitizedList.length; i += 100) {
    const batch = sanitizedList.slice(i, i + 100);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error in batch ${i}-${i + 100}:`, error.message);
    }
  }
  console.log(`[✓] Supabase questions updated successfully.\n`);

  // 2. Filter clean questions & group by chapter
  const cleanQuestions = sanitizedList.filter((q) => q.status === 'READY');
  console.log(`[i] Active clean questions for compendiums: ${cleanQuestions.length}`);

  const questionsByChapter = new Map<string, any[]>();
  for (const q of cleanQuestions) {
    const ch = q.chapter;
    if (!questionsByChapter.has(ch)) {
      questionsByChapter.set(ch, []);
    }
    questionsByChapter.get(ch)!.push(q);
  }

  // 3. Clear existing worksheet_questions and re-seed with prioritized order
  console.log('[+] Rebuilding worksheet_questions with academic quality sorting...');
  await supabase.from('worksheet_questions').delete().neq('worksheet_id', '');
  await supabase.from('worksheets').delete().neq('id', '');

  const nowIso = new Date().toISOString();

  for (const cfg of CHAPTER_CONFIGS) {
    const rawList = questionsByChapter.get(cfg.chapter) || [];

    // Score and sort questions so high-quality, authentic LaTeX questions appear first
    const sortedQuestions = rawList.map((q) => ({
      ...q,
      score: scoreQuestion(q),
    }));

    sortedQuestions.sort((a, b) => b.score - a.score);

    console.log(`[>] Compiling ${cfg.worksheetNumber}: "${cfg.chapter}" (${sortedQuestions.length} questions)...`);
    console.log(`    Top question #1: [${sortedQuestions[0]?.id}] (score ${sortedQuestions[0]?.score})`);
    console.log(`    Top question #2: [${sortedQuestions[1]?.id}] (score ${sortedQuestions[1]?.score})`);
    console.log(`    Top question #3: [${sortedQuestions[2]?.id}] (score ${sortedQuestions[2]?.score})`);

    const totalMarks = sortedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const schools = Array.from(
      new Set(
        sortedQuestions.map((q) => {
          const parts = q.id.split('-');
          return parts[0]?.toUpperCase() || 'JPJC';
        })
      )
    );

    const worksheetRow = {
      id: cfg.id,
      worksheet_number: cfg.worksheetNumber,
      title: cfg.title,
      subject: 'mathematics',
      chapter: cfg.chapter,
      syllabus_version_id: cfg.syllabusVersionId,
      version: 1,
      question_count: sortedQuestions.length,
      total_marks: totalMarks,
      status: 'PUBLISHED',
      source_coverage: schools,
      generated_at: nowIso,
      updated_at: nowIso,
    };

    const { error: wsErr } = await supabase.from('worksheets').insert(worksheetRow);
    if (wsErr) {
      console.error(`Error inserting worksheet ${cfg.worksheetNumber}:`, wsErr.message);
      continue;
    }

    const wqRows = sortedQuestions.map((q, idx) => ({
      worksheet_id: cfg.id,
      question_id: q.id,
      position: idx + 1,
    }));

    for (let i = 0; i < wqRows.length; i += 200) {
      const batch = wqRows.slice(i, i + 200);
      const { error: wqErr } = await supabase.from('worksheet_questions').insert(batch);
      if (wqErr) {
        console.error(`Error inserting worksheet_questions for ${cfg.worksheetNumber} batch ${i}:`, wqErr.message);
      }
    }

    console.log(`[✓] ${cfg.worksheetNumber} successfully persisted: ${sortedQuestions.length} questions, ${totalMarks} marks.\n`);
  }

  console.log('================================================================');
  console.log('  ALL CHAPTER COMPENDIUMS SUCCESSFULLY CURATED & PRIORITIZED!');
  console.log('================================================================\n');
}

main().catch(console.error);
