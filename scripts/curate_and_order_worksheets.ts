import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
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
  'jpjc-2022-p1-q08': `(a) By expressing the equation of the curve $y = \\frac{12x+11}{2x+1}$ in the form $y = A + \\frac{B}{2x+1}$, where $A$ and $B$ are constants, describe a sequence of three transformations which maps the graph of $y = \\frac{1}{2x-3}$ onto the graph of $y = \\frac{12x+11}{2x+1}$. [4]\n\n(b) The diagram shows the graph of $y = \\mathrm{f}(x)$. The curve has a maximum point at $(0,-5)$ and a minimum point at $(6,-4)$. The equations of the asymptotes of the curve are $x = -2$, $x = 2$ and $y = -2$.\n\nSketch the graph of $y = \\mathrm{f}(-x+2)+4$, indicating clearly the equations of the asymptotes and the coordinates of the axial intercepts and turning points. [3]`,
};

function isIsolatedCrop(qid: string): boolean {
  const imgPath = path.resolve(process.cwd(), 'apps/web/public/questions', `${qid}.png`);
  if (!fs.existsSync(imgPath)) return false;
  try {
    const fd = fs.openSync(imgPath, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    // Strict isolated crop: single question between 80px and 1350px tall, and > 200px wide
    // Excludes any full-page clumped captures (height > 1350)
    return width > 200 && height >= 80 && height <= 1350;
  } catch {
    return false;
  }
}

export function cleanTextContent(raw: string, qid?: string): string {
  if (qid && CURATED_QUESTIONS[qid]) {
    return CURATED_QUESTIONS[qid];
  }
  if (!raw) return '';

  let text = raw;
  const puaMap: Record<string, string> = {
    '\uf028': '(', '\uf029': ')', '\uf02b': '+', '\uf02d': '-', '\uf03d': '=',
    '\uf03c': '<', '\uf03e': '>', '\uf05b': '[', '\uf05d': ']', '\uf070': 'π',
    '\uf071': 'θ', '\uf061': 'α', '\uf062': 'β', '\uf06c': 'λ', '\uf06d': 'μ',
    '\uf0a3': '≤', '\uf0b3': '≥', '\uf0b4': '×', '\uf0b1': '±', '\uf0a5': '∞',
    '\uf0ce': '∈', '\uf0d6': '√', '\uf0e0': '→', '\uf0de': '⇒', '\uf0db': '⇔',
    '\uf0f2': '∫', '\uf0f3': '∫', '\uf0f4': '∫', '\uf0f5': '∫', '': '∫',
    '': '≤', '': '≥',
  };

  for (const [pua, repl] of Object.entries(puaMap)) {
    text = text.split(pua).join(repl);
  }

  text = text.replace(/[\ue000-\uf8ff]/g, '');
  text = text.replace(/\0/g, '').replace(/\\u0000/g, '').replace(/[\uD800-\uDFFF]/g, '');
  text = text.replace(/©\s*[A-Z0-9\s\-_.,/]+/gi, '');
  text = text.replace(/\[\s*Turn\s+over\s*\]?/gi, '');
  text = text.replace(/\b(?:H2|9758|9740)\b[^\n]*/gi, '');

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const filteredLines = lines.filter((l) => {
    if (/^(?:page\s+\d+|\d+\s+of\s+\d+|\[\d+\]\s*page)/i.test(l)) return false;
    if (/^\d{1,2}\s*$/.test(l)) return false;
    return true;
  });

  return filteredLines.join('\n\n');
}

export function classifyQuestionText(text: string): { chapter: string; subtopic: string } {
  const t = text.toLowerCase();
  const scores: Record<string, number> = {
    'Complex Numbers': 0,
    'Vectors': 0,
    'Sequences and Series': 0,
    'Probability and Statistics': 0,
    'Calculus': 0,
    'Functions and Graphs': 0,
  };

  // Complex Numbers
  if (/\bcomplex number\b|\bargand\b|\barg\s*\(|\b\|z\||\bmodulus and argument\b|\bpolar form\b|\bcartesian form a\s*\+\s*ib\b|\bpurely imaginary\b|\bpurely real\b/i.test(t)) {
    scores['Complex Numbers'] += 40;
  }
  if (/\b[z|w]\b\s*=\s*.*i\b/i.test(t) || /e\^\{?i/i.test(t) || /\biz\^/i.test(t) || /\be\^i\b/i.test(t) || /\bconjugate\b/i.test(t) || /\bpolynomial.*root\b|\broot.*polynomial\b|\bz\^3\b|\bz\^4\b|a\s*\+\s*ib/i.test(t)) {
    scores['Complex Numbers'] += 25;
  }

  // Vectors
  if (/\bposition vector\b|\bperpendicular from\b|\bfoot of perpendicular\b|\blines and planes\b|\bacute angle between the planes\b|\bpoint of intersection of the planes\b|\bline of intersection\b|\bnon-parallel\b|\bcollinear\b|\bplanes?\s*(\u03c0|pi|[12])\b/i.test(t)) {
    scores['Vectors'] += 40;
  }
  if (/\bvectors?\b|\bplanes?\b|\bdirection vector\b|\bnormal vector\b|\bdot product\b|\bcross product\b|\bprojection\b|\bcoordinates.*planes?\b|\ba\.b\b|\bscalar product\b|\btwo planes\b|\bthe plane\b/i.test(t) || t.includes('\\mathbf') || t.includes('\\vec')) {
    scores['Vectors'] += 25;
  }

  // Sequences and Series
  if (/\barithmetic progression\b|\bgeometric progression\b|\bcommon ratio\b|\bcommon difference\b|\bsum to infinity\b|\bmathematical induction\b|\bbinomial expansion\b|\bbinomial theorem\b|\bmaclaurin\b|\bprove by induction\b|\bgeometric sequence\b|\barithmetic sequence\b|sequence.*arithmetic|sequence.*geometric/i.test(t)) {
    scores['Sequences and Series'] += 40;
  }
  if (/\ba sequence\b|\bu_1\b|\bu_2\b|\bu_n\b|\bsequence u\b|\bap\/gp\b|\bfirst term a\b|\bs_n\b|\bu_\{?n\b|\bby induction\b|\bpositive integers n\b|\bstandard series\b|\bcompound interest\b|\binterest rate\b|\bstudy loan\b|\brepayment plan\b/i.test(t)) {
    scores['Sequences and Series'] += 30;
  }

  // Probability and Statistics
  if (/\bprobability\b|\brandom variable\b|\bnormal distribution\b|\bbinomial distribution\b|\bhypothesis test\b|\bnull hypothesis\b|\bpoisson\b|\bexpectation\b|\bvariance\b|\bunbiased estimate\b|\bsignificance level\b|\bcorrelation coefficient\b|\bregression line\b|\bscatter diagram\b/i.test(t)) {
    scores['Probability and Statistics'] += 40;
  }
  if (/\bselected at random\b|\bwithout replacement\b|\bwith replacement\b|\bscore is the largest\b|\bfair dice\b|\bfair die\b|\bstandard deviation\b|\bsample mean\b|\bindependent events\b|\bmutually exclusive\b|\bsection b:\s*statistics\b|\bround table\b|\bcommittee\b|\bnumber of ways\b|\barrangements?\b|\bseating\b|\bsurvey\b|\bparticipants\b/i.test(t) || /p\([a-z]\s*\|\s*[a-z]\)/i.test(t) || /events\s+[a-z]\s+and\s+[a-z]/i.test(t)) {
    scores['Probability and Statistics'] += 30;
  }

  // Calculus (Integrals, Derivatives, Differential Equations, Area & Volume)
  if (/\bderivative\b|\bdifferentiate\b|\bdifferentiation\b|\bintegral\b|\bintegrate\b|\bintegration\b|\bdifferential equation\b|\btangent to the curve\b|\bnormal to the curve\b|\bstationary point\b|\bturning point\b|\bvolume of revolution\b|\bintegration by parts\b|\barea bounded by\b|\barea of the region bounded\b|\barea of region bounded\b/i.test(t)) {
    scores['Calculus'] += 40;
  }
  if (/\bdy\/dx\b|\bd\^2y\/dx\^2\b|\bsec\^2\b|\bsubstitution\b|\bdx\b|\bdt\b|\bdefinite integral\b|\bmaximum volume\b|\brate of change\b|\brate of increase\b|\brate of decrease\b|\brate of flow\b|\bconnected rates\b/i.test(t) || t.includes('∫') || t.includes('\\int') || t.includes('')) {
    scores['Calculus'] += 25;
  }

  // Functions and Graphs (Only Pure Graphs, Transformations, Inverses, Functions)
  if (/\bcomposite function\b|\binverse function\b|\bdomain of f\b|\brange of f\b|\bone-one\b|\basymptotes?\b|\baxial intercepts?\b|\bsequence of transformations\b|\btransformation.*maps\b|\bfunctions?\s+f\s+and\s+g\b|\bf\s*:\s*x|\bg\s*:\s*x|\bf\^\{-?1\}|\bexists and find f\^\{-?1\}|\bdetermine whether.*one-one\b/i.test(t)) {
    scores['Functions and Graphs'] += 40;
  }
  if (/\bsketch the graph\b|\bsketch the curve\b|\bthe curve c has equation\b|\bf\(x\)|\bfunction f\b|\bgraph of y\b|\bcurve has equation\b|\baxes, sketch\b|\bsolve the inequality\b|\binequality/i.test(t)) {
    scores['Functions and Graphs'] += 15;
  }

  let bestChapter = 'Unclassified';
  let maxScore = 0;
  for (const [ch, sc] of Object.entries(scores)) {
    if (sc > maxScore) {
      maxScore = sc;
      bestChapter = ch;
    }
  }

  if (bestChapter === 'Unclassified') {
    return { chapter: 'Unclassified', subtopic: 'Unclassified' };
  }

  let subtopic = bestChapter;
  if (bestChapter === 'Functions and Graphs') {
    if (/transform/i.test(t)) subtopic = 'Graphs and Transformations';
    else if (/inverse|composite|domain|range/i.test(t)) subtopic = 'Functions';
    else subtopic = 'Equations and Inequalities';
  } else if (bestChapter === 'Sequences and Series') {
    if (/induction/i.test(t)) subtopic = 'Mathematical Induction';
    else if (/binomial/i.test(t)) subtopic = 'Binomial Series';
    else subtopic = 'Arithmetic and Geometric Progressions';
  } else if (bestChapter === 'Vectors') {
    if (/plane/i.test(t)) subtopic = 'Lines and Planes in 3D';
    else subtopic = 'Vectors';
  } else if (bestChapter === 'Complex Numbers') {
    if (/argand|locus|loci/i.test(t)) subtopic = 'Argand Diagrams and Loci';
    else if (/root|polynomial/i.test(t)) subtopic = 'Roots of Polynomials';
    else subtopic = 'Complex Numbers';
  } else if (bestChapter === 'Calculus') {
    if (/differential equation/i.test(t)) subtopic = 'Differential Equations';
    else if (/integral|integrate|area|volume/i.test(t)) subtopic = 'Definite Integrals & Applications';
    else subtopic = 'Differentiation & Applications';
  } else if (bestChapter === 'Probability and Statistics') {
    if (/hypothesis|null hypothesis/i.test(t)) subtopic = 'Hypothesis Testing';
    else if (/normal/i.test(t)) subtopic = 'Normal Distribution';
    else if (/correlation|regression/i.test(t)) subtopic = 'Linear Regression';
    else subtopic = 'Probability and Random Variables';
  }

  return { chapter: bestChapter, subtopic };
}

function scoreQuestion(q: any): number {
  let score = 0;
  const t = q.text_content || '';
  const qid = q.id || '';

  if (CURATED_QUESTIONS[qid]) score += 1000;
  if (t.includes('$')) score += 200;
  if (t.includes('\\frac')) score += 50;
  if (t.includes('\\int')) score += 50;
  if (t.includes('\\mathbf')) score += 50;
  if (t.includes('\\mathrm')) score += 30;

  if (t.includes('(i)')) score += 20;
  if (t.includes('(ii)')) score += 20;
  if (t.includes('[') && t.includes(']')) score += 10;
  if (/^[A-Z]/.test(t) || /^\([a-z0-9]+\)/i.test(t)) score += 10;

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
  console.log('  PAPERFORGE — RECLASSIFY, SANITIZE & COMPILE CHAPTER WORKSHEETS');
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

  // 1. Reclassify & Filter out clumped full pages
  const localStorePath = path.resolve(process.cwd(), 'packages', 'db', '.paperforge-store.json');
  const localStore = fs.existsSync(localStorePath) ? JSON.parse(fs.readFileSync(localStorePath, 'utf-8')) : null;
  const localQuestionsMap = new Map((localStore?.questions || []).map((q: any) => [q.id, q]));

  const updatedQuestions: any[] = [];
  let excludedCount = 0;
  let reclassifiedCount = 0;

  for (const q of allQuestions) {
    const localQ = localQuestionsMap.get(q.id);
    const rawText = (localQ?.textContent && localQ.textContent.length > 25)
      ? localQ.textContent
      : (q.text_content || '');
    const cleanText = cleanTextContent(rawText, q.id);
    const validCrop = isIsolatedCrop(q.id);
    const { chapter, subtopic } = classifyQuestionText(cleanText);

    if (!validCrop || cleanText.length < 20 || chapter === 'Unclassified') {
      updatedQuestions.push({
        ...q,
        chapter: chapter !== 'Unclassified' ? chapter : q.chapter,
        subtopic: chapter !== 'Unclassified' ? subtopic : q.subtopic,
        text_content: cleanText,
        status: 'EXCLUDED',
      });
      excludedCount++;
      continue;
    }

    if (chapter !== q.chapter) {
      reclassifiedCount++;
    }

    updatedQuestions.push({
      ...q,
      chapter,
      subtopic,
      text_content: cleanText,
      status: 'READY',
    });
  }

  console.log(`[i] Processed: ${updatedQuestions.length} total questions.`);
  console.log(`    Excluded (clumped full pages or <20 chars): ${excludedCount}`);
  console.log(`    Reclassified into authentic syllabus chapters: ${reclassifiedCount}`);

  console.log(`[+] Updating questions in Supabase PostgreSQL in batches of 100...`);
  for (let i = 0; i < updatedQuestions.length; i += 100) {
    const batch = updatedQuestions.slice(i, i + 100);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error updating questions batch ${i}:`, error.message);
    }
  }
  console.log(`[✓] Supabase questions updated successfully.\n`);

  // 2. Group clean questions by authentic chapter
  const cleanQuestions = updatedQuestions.filter((q) => q.status === 'READY');
  const questionsByChapter = new Map<string, any[]>();
  for (const q of cleanQuestions) {
    if (!questionsByChapter.has(q.chapter)) {
      questionsByChapter.set(q.chapter, []);
    }
    questionsByChapter.get(q.chapter)!.push(q);
  }

  // 3. Clear existing worksheets and worksheet_questions in Supabase
  console.log('[+] Rebuilding worksheets and worksheet_questions...');
  await supabase.from('worksheet_questions').delete().neq('worksheet_id', '');
  await supabase.from('worksheets').delete().neq('id', '');

  const nowIso = new Date().toISOString();
  const compiledWorksheets: any[] = [];

  for (const cfg of CHAPTER_CONFIGS) {
    const rawList = questionsByChapter.get(cfg.chapter) || [];

    const sortedQuestions = rawList.map((q) => ({
      ...q,
      score: scoreQuestion(q),
    }));

    sortedQuestions.sort((a, b) => b.score - a.score);

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

    compiledWorksheets.push({
      ...worksheetRow,
      manifest: {
        worksheetId: cfg.id,
        questions: sortedQuestions.map((q) => q.id),
      },
    });

    console.log(`[✓] ${cfg.worksheetNumber} [${cfg.chapter}]: ${sortedQuestions.length} questions, ${totalMarks} marks.`);
    console.log(`    Top #1: ${sortedQuestions[0]?.id} (${sortedQuestions[0]?.subtopic})`);
    console.log(`    Top #2: ${sortedQuestions[1]?.id} (${sortedQuestions[1]?.subtopic})`);
    console.log(`    Top #3: ${sortedQuestions[2]?.id} (${sortedQuestions[2]?.subtopic})`);
  }

  // 4. Update local .paperforge-store.json
  const storeFilePath = path.resolve(process.cwd(), 'packages', 'db', '.paperforge-store.json');
  if (fs.existsSync(storeFilePath)) {
    const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
    const qMap = new Map(updatedQuestions.map((q) => [q.id, q]));

    storeData.questions = (storeData.questions || []).map((q: any) => {
      const up = qMap.get(q.id);
      if (up) {
        return {
          ...q,
          chapter: up.chapter,
          subtopic: up.subtopic,
          textContent: up.text_content,
          status: up.status,
          diagramUrl: `/questions/${q.id}.png`,
        };
      }
      return q;
    });

    storeData.worksheets = compiledWorksheets;
    fs.writeFileSync(storeFilePath, JSON.stringify(storeData, null, 2));
    console.log('\n[✓] Local .paperforge-store.json synchronized successfully.');
  }

  console.log('\n================================================================');
  console.log('  RECLASSIFICATION AND CHAPTER COMPILATION COMPLETE!');
  console.log('================================================================\n');
}

main().catch(console.error);
