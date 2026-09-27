/**
 * PaperForge — Mathematical Question Text Sanitizer & Reflower
 * Normalizes Private Use Area (PUA) symbol glyphs, strips exam footers/headers, and reflows fragmented PDF spans
 */

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

const PUA_REPLACEMENTS: [RegExp, string][] = [
  [/\uF020/g, ' '],
  [/\uF021/g, '!'],
  [/[\uF028\uF0E6\uF0E7\uF0E8]/g, '('],
  [/[\uF029\uF0F6\uF0F7\uF0F8]/g, ')'],
  [/\uF02A/g, '*'],
  [/\uF02B/g, '+'],
  [/\uF02C/g, ','],
  [/[\uF02D\u2212\u2010-\u2015]/g, '-'],
  [/\uF02E/g, '.'],
  [/\uF02F/g, '/'],
  [/\uF03A/g, ':'],
  [/\uF03B/g, ';'],
  [/\uF03C/g, '<'],
  [/\uF03D/g, '='],
  [/\uF03E/g, '>'],
  [/\uF03F/g, '?'],
  [/\uF05B/g, '['],
  [/\uF05D/g, ']'],
  [/[\uF070\u03C0]/g, 'π'],
  [/[\uF071\u03B8]/g, 'θ'],
  [/[\uF061\u03B1]/g, 'α'],
  [/[\uF062\u03B2]/g, 'β'],
  [/[\uF064\u03B4]/g, 'δ'],
  [/[\uF06C\u03BB]/g, 'λ'],
  [/[\uF06D\u03BC]/g, 'μ'],
  [/[\uF073\u03C3]/g, 'σ'],
  [/[\uF077\u03C9]/g, 'ω'],
  [/[\uF0A3\u2264]/g, '≤'],
  [/[\uF0B3\u2265]/g, '≥'],
  [/[\uF0B4\u00D7]/g, '×'],
  [/[\uF0B1\u00B1]/g, '±'],
  [/[\uF0A5\u221E]/g, '∞'],
  [/[\uF0CE\u2208]/g, '∈'],
  [/[\uF0CF\u2209]/g, '∉'],
  [/[\uF0C8\u222A]/g, '∪'],
  [/[\uF0C7\u2229]/g, '∩'],
  [/[\uF0CC\u2282]/g, '⊂'],
  [/[\uF0CD\u2286]/g, '⊆'],
  [/[\uF0D6\u221A]/g, '√'],
  [/[\uF0E0\u2192]/g, '→'],
  [/[\uF0DE\u21D2]/g, '⇒'],
  [/[\uF0DB\u21D4]/g, '⇔'],
  [/[\uF0F2\uF0F3\uF0F4\uF0F5\u222B]/g, '∫'],
  [/[\u201C\u201D]/g, '"'],
  [/[\u2018\u2019]/g, "'"],
];

export function sanitizeMathQuestionText(raw: string, qnum?: string, qid?: string): string {
  if (qid && CURATED_QUESTIONS[qid]) {
    return CURATED_QUESTIONS[qid];
  }
  if (!raw) return '';
  let text = raw;

  // 1. MathType & Windows Symbol Font PUA mapping (\uF000 - \uF0FF)
  for (const [regex, replacement] of PUA_REPLACEMENTS) {
    text = text.replace(regex, replacement);
  }
  text = text.replace(/[\uE000-\uF8FF]/g, '');

  // 2. Strip Exam Paper Headers, Footers, Watermarks & Administrative Notices
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

  // 3. Remove leading question numbers
  if (qnum) {
    const regex = new RegExp(`^(?:Question\\s*)?${qnum}[.:\\s]+`, 'i');
    text = text.replace(regex, '');
  } else {
    text = text.replace(/^(?:Question\s*)?\d+[.:\\s]+/i, '');
  }
  text = text.replace(/^\s*(?:Question\s*)?\d{1,2}\s*[\.:\)]?\s*\n/m, '');
  text = text.replace(/\n\s*\d{1,2}\s*$/m, '');

  // 4. Reflow fragmented PDF lines
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
