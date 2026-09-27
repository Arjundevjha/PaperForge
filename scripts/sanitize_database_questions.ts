import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in apps/web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export function sanitizeMathQuestionText(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. MathType & Windows Symbol Font Private Use Area (PUA) mapping (\uF000 - \uF0FF)
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
  // Strip any remaining PUA characters
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

  // 3. Remove leading question numbers (e.g. "1\n", "12.\n", "Question 5\n")
  text = text.replace(/^\s*(?:Question\s*)?\d{1,2}\s*[\.:\)]?\s*\n/m, '');
  // Remove trailing stray page numbers at end of text
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
    .map((p) => {
      let cleaned = p
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.:;?!])/g, '$1')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\[\s+/g, '[')
        .replace(/\s+\]/g, ']')
        .replace(/\bintegral\b/gi, '∫')
        .trim();
      return cleaned;
    })
    .filter(Boolean)
    .join('\n\n');
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
  console.log('Fetching all questions from Supabase PostgreSQL...');
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

  console.log(`Retrieved ${allQuestions.length} questions from PostgreSQL.`);

  // Identify corrupted questions and sanitize valid questions
  const sanitizedQuestions: any[] = [];
  let excludedCount = 0;

  for (const q of allQuestions) {
    const t = q.text_content || '';
    const isTooLong = t.length > 2200;
    const isSolution = /Marker'?s?\s+Report|Alternative\s+Method|were\s+penalised|lecture\s+notes|Solution\s+Marking\s+Scheme/i.test(t);
    const hasLotsOfAns = (t.match(/\b(?:ans|solution|markscheme)\b/gi) || []).length > 5;

    if (isTooLong || isSolution || hasLotsOfAns) {
      sanitizedQuestions.push({
        ...q,
        status: 'EXCLUDED',
      });
      excludedCount++;
    } else {
      const cleanText = sanitizeMathQuestionText(t);
      sanitizedQuestions.push({
        ...q,
        text_content: cleanText,
        status: 'READY',
      });
    }
  }

  console.log(`Excluded ${excludedCount} corrupted questions.`);
  console.log(`Sanitizing and updating ${sanitizedQuestions.length} questions in Supabase in batches of 100...`);

  for (let i = 0; i < sanitizedQuestions.length; i += 100) {
    const batch = sanitizedQuestions.slice(i, i + 100);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error updating questions batch ${i}-${i + 100}:`, error.message);
    }
  }
  console.log('Successfully updated all questions in PostgreSQL.\n');

  // Filter valid clean questions for worksheets
  const cleanQuestions = sanitizedQuestions.filter((q) => q.status !== 'EXCLUDED');
  console.log(`Clean questions available for compilation: ${cleanQuestions.length}`);

  // Group questions by chapter
  const questionsByChapter = new Map<string, any[]>();
  for (const q of cleanQuestions) {
    const ch = q.chapter;
    if (!questionsByChapter.has(ch)) {
      questionsByChapter.set(ch, []);
    }
    questionsByChapter.get(ch)!.push(q);
  }

  console.log('Clearing existing worksheets and worksheet_questions tables...');
  await supabase.from('worksheet_questions').delete().neq('worksheet_id', '');
  await supabase.from('worksheets').delete().neq('id', '');

  const nowIso = new Date().toISOString();

  for (const cfg of CHAPTER_CONFIGS) {
    const questions = questionsByChapter.get(cfg.chapter) || [];
    console.log(`Compiling ${cfg.worksheetNumber}: "${cfg.chapter}" with ALL ${questions.length} clean questions...`);

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const schools = Array.from(
      new Set(
        questions.map((q) => {
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
      question_count: questions.length,
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

    // Insert worksheet_questions in batches of 200
    const wqRows = questions.map((q, idx) => ({
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

    console.log(`[✓] ${cfg.worksheetNumber} successfully seeded: ${questions.length} questions, ${totalMarks} marks, ${schools.length} schools.`);
  }

  console.log('\n[✓] ALL 6 CHAPTER COMPENDIUMS SANITIZED AND SYNCHRONIZED SUCCESSFULLY!');
}

main().catch(console.error);
