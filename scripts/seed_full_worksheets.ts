import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in apps/web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Group questions by chapter
  const questionsByChapter = new Map<string, any[]>();
  for (const q of allQuestions) {
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
    console.log(`Compiling ${cfg.worksheetNumber}: "${cfg.chapter}" with ALL ${questions.length} questions...`);

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const schools = Array.from(
      new Set(
        questions.map((q) => {
          const parts = q.id.split('-');
          return parts[0]?.toUpperCase() || 'JPJC';
        })
      )
    );

    const questionIds = questions.map((q) => q.id);

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

    const { error: wsErr } = await supabase.from('worksheets').upsert(worksheetRow, { onConflict: 'id' });
    if (wsErr) {
      console.error(`Error saving worksheet ${cfg.worksheetNumber}:`, wsErr);
      continue;
    }

    // Insert all worksheet_questions in chunks of 500
    if (questionIds.length > 0) {
      const wqRows = questionIds.map((qid, idx) => ({
        worksheet_id: cfg.id,
        question_id: qid,
        position: idx + 1,
      }));

      for (let i = 0; i < wqRows.length; i += 500) {
        const chunk = wqRows.slice(i, i + 500);
        const { error: wqErr } = await supabase.from('worksheet_questions').upsert(chunk, { onConflict: 'worksheet_id,question_id' });
        if (wqErr) {
          console.error(`Error saving questions chunk for ${cfg.worksheetNumber}:`, wqErr);
        }
      }
    }

    console.log(`✓ ${cfg.worksheetNumber} published successfully with ${questions.length} questions, ${totalMarks} marks across ${schools.length} schools.`);
  }

  // Verify final counts
  const { count: wsCount } = await supabase.from('worksheets').select('*', { count: 'exact', head: true });
  const { count: wqCount } = await supabase.from('worksheet_questions').select('*', { count: 'exact', head: true });
  console.log(`\nVerification Complete:`);
  console.log(`- Total Worksheets Published: ${wsCount} (Target: 6)`);
  console.log(`- Total Worksheet Question Links: ${wqCount} (Target: ${allQuestions.filter(q => q.subject === 'mathematics').length})`);
}

main().catch(console.error);
