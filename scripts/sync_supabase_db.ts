import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import { REAL_PAPER_3_PACKAGE, REAL_PAPER_4_PACKAGE } from '../packages/db/src/real-papers';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log('--- 1. Syncing Supabase Storage Bucket -> PostgreSQL sources table ---');
  const { data: years, error: yearsErr } = await supabase.storage.from('paperforge').list('incoming');
  if (yearsErr) {
    console.error('Error listing incoming years:', yearsErr);
    return;
  }

  const sourcesToUpsert: any[] = [];

  for (const y of years || []) {
    const yearNum = parseInt(y.name, 10);
    if (isNaN(yearNum)) continue;

    const { data: schools } = await supabase.storage.from('paperforge').list(`incoming/${y.name}`);
    for (const s of schools || []) {
      const schoolCode = s.name;
      const { data: files } = await supabase.storage.from('paperforge').list(`incoming/${y.name}/${s.name}`);

      for (const f of files || []) {
        if (!f.name.endsWith('.pdf')) continue;

        const isQP = f.name.includes('_QP_') || !f.name.includes('_MS_');
        const paperMatch = f.name.match(/_P([1-4])_/i);
        const paperNumber = paperMatch ? parseInt(paperMatch[1], 10) : 1;
        const hashMatch = f.name.match(/_([a-f0-9]{8})\.pdf$/i);
        const sourceHash = hashMatch ? hashMatch[1] : Buffer.from(f.name).toString('hex').slice(0, 8);
        const isPromo = f.name.toLowerCase().includes('promo');

        const docId = `src_${schoolCode.toLowerCase()}_math_${yearNum}_p${paperNumber}_${sourceHash}`;

        sourcesToUpsert.push({
          id: docId,
          filename: f.name,
          school: schoolCode,
          year: yearNum,
          subject: 'mathematics',
          paper_type: isPromo ? 'PROMO' : 'PRELIM',
          paper_number: paperNumber,
          source_hash: sourceHash,
          storage_key: `incoming/${y.name}/${s.name}/${f.name}`,
          page_count: 8,
          status: 'READY',
          created_at: f.created_at || new Date().toISOString(),
          updated_at: f.updated_at || new Date().toISOString(),
        });
      }
    }
  }

  console.log(`Discovered ${sourcesToUpsert.length} PDF papers in storage bucket.`);

  // Upsert in batches of 50
  for (let i = 0; i < sourcesToUpsert.length; i += 50) {
    const batch = sourcesToUpsert.slice(i, i + 50);
    const { error } = await supabase.from('sources').upsert(batch, { onConflict: 'source_hash' });
    if (error) {
      console.error(`Error upserting batch ${i} - ${i + 50}:`, error);
    }
  }
  console.log('✓ Successfully populated Supabase sources table!');

  console.log('\n--- 2. Seeding Canonical Questions & Answers into PostgreSQL ---');
  // First ensure canonical seed sources are in sources table
  const p3Source = {
    id: REAL_PAPER_3_PACKAGE.source.id,
    filename: REAL_PAPER_3_PACKAGE.source.filename,
    school: REAL_PAPER_3_PACKAGE.source.school,
    year: REAL_PAPER_3_PACKAGE.source.year,
    subject: REAL_PAPER_3_PACKAGE.source.subject,
    paper_type: REAL_PAPER_3_PACKAGE.source.paperType,
    paper_number: REAL_PAPER_3_PACKAGE.source.paperNumber,
    source_hash: REAL_PAPER_3_PACKAGE.source.sourceHash,
    storage_key: REAL_PAPER_3_PACKAGE.source.storageKey,
    page_count: REAL_PAPER_3_PACKAGE.source.pageCount,
    status: REAL_PAPER_3_PACKAGE.source.status,
  };
  const p4Source = {
    id: REAL_PAPER_4_PACKAGE.source.id,
    filename: REAL_PAPER_4_PACKAGE.source.filename,
    school: REAL_PAPER_4_PACKAGE.source.school,
    year: REAL_PAPER_4_PACKAGE.source.year,
    subject: REAL_PAPER_4_PACKAGE.source.subject,
    paper_type: REAL_PAPER_4_PACKAGE.source.paperType,
    paper_number: REAL_PAPER_4_PACKAGE.source.paperNumber,
    source_hash: REAL_PAPER_4_PACKAGE.source.sourceHash,
    storage_key: REAL_PAPER_4_PACKAGE.source.storageKey,
    page_count: REAL_PAPER_4_PACKAGE.source.pageCount,
    status: REAL_PAPER_4_PACKAGE.source.status,
  };

  await supabase.from('sources').upsert([p3Source, p4Source], { onConflict: 'source_hash' });

  // Questions
  const allQuestions = [...REAL_PAPER_3_PACKAGE.questions, ...REAL_PAPER_4_PACKAGE.questions];
  const questionsRows = allQuestions.map((q) => ({
    id: q.id,
    source_id: q.sourceId,
    question_number: q.questionNumber,
    parent_question_id: q.parentQuestionId,
    subject: q.subject,
    chapter: q.chapter,
    subtopic: q.subtopic,
    syllabus_version_id: q.syllabusVersionId,
    text_content: q.textContent,
    marks: q.marks,
    text_hash: q.textHash,
    visual_hash: q.visualHash,
    status: q.status,
  }));

  const { error: qErr } = await supabase.from('questions').upsert(questionsRows, { onConflict: 'id' });
  if (qErr) console.error('Error upserting questions:', qErr);
  else console.log(`✓ Upserted ${questionsRows.length} canonical questions.`);

  // Answers
  const allAnswers = [...REAL_PAPER_3_PACKAGE.answers, ...REAL_PAPER_4_PACKAGE.answers];
  const answersRows = allAnswers.map((a) => ({
    id: a.id,
    source_id: a.sourceId,
    question_id: a.questionId,
    question_number: a.questionNumber,
    answer_content: a.answerContent,
    answer_hash: a.answerHash,
    mark_scheme_notes: a.markSchemeNotes,
    status: a.status,
  }));

  const { error: aErr } = await supabase.from('answers').upsert(answersRows, { onConflict: 'id' });
  if (aErr) console.error('Error upserting answers:', aErr);
  else console.log(`✓ Upserted ${answersRows.length} canonical answers.`);

  // Worksheets
  console.log('\n--- 3. Seeding Canonical Worksheets into PostgreSQL ---');
  const canonicalWorksheets = [
    {
      id: 'ws_math_01',
      worksheet_number: 'WS-MATH-01',
      title: 'WS-MATH-01: Functions and Graphs Revision (JPJC & EJC)',
      subject: 'mathematics',
      chapter: 'Functions and Graphs',
      syllabus_version_id: 'SEAB-9758-Official',
      version: 1,
      question_count: 10,
      total_marks: 78,
      status: 'PUBLISHED',
      source_coverage: ['JPJC', 'EJC'],
    },
    {
      id: 'ws_math_02',
      worksheet_number: 'WS-MATH-02',
      title: 'WS-MATH-02: Calculus Revision: Differentiation & Integration (JPJC & EJC)',
      subject: 'mathematics',
      chapter: 'Calculus',
      syllabus_version_id: 'SEAB-9758-Official',
      version: 1,
      question_count: 10,
      total_marks: 82,
      status: 'PUBLISHED',
      source_coverage: ['JPJC', 'EJC'],
    },
    {
      id: 'ws_math_03',
      worksheet_number: 'WS-MATH-03',
      title: 'WS-MATH-03: Sequences and Series: AP/GP (JPJC & EJC)',
      subject: 'mathematics',
      chapter: 'Sequences and Series',
      syllabus_version_id: 'SEAB-9758-Official',
      version: 1,
      question_count: 2,
      total_marks: 17,
      status: 'PUBLISHED',
      source_coverage: ['JPJC', 'EJC'],
    },
    {
      id: 'ws_math_04',
      worksheet_number: 'WS-MATH-04',
      title: 'WS-MATH-04: Vectors: Lines & Planes in 3D (JPJC & EJC)',
      subject: 'mathematics',
      chapter: 'Vectors',
      syllabus_version_id: 'SEAB-9758-Official',
      version: 1,
      question_count: 4,
      total_marks: 38,
      status: 'PUBLISHED',
      source_coverage: ['JPJC', 'EJC'],
    },
    {
      id: 'ws_math_05',
      worksheet_number: 'WS-MATH-05',
      title: 'WS-MATH-05: Promotional Examination Practice Paper (All Topics)',
      subject: 'mathematics',
      chapter: 'Promotional Exam Revision (All Topics)',
      syllabus_version_id: 'SEAB-9758-Official',
      version: 1,
      question_count: 10,
      total_marks: 80,
      status: 'PUBLISHED',
      source_coverage: ['JPJC', 'EJC'],
    },
  ];

  const { error: wsErr } = await supabase.from('worksheets').upsert(canonicalWorksheets, { onConflict: 'id' });
  if (wsErr) console.error('Error upserting worksheets:', wsErr);
  else console.log(`✓ Upserted ${canonicalWorksheets.length} canonical worksheets.`);

  // Verify Counts
  console.log('\n--- 4. Verification in Supabase PostgreSQL ---');
  const { count: srcCount } = await supabase.from('sources').select('*', { count: 'exact', head: true });
  const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  const { count: aCount } = await supabase.from('answers').select('*', { count: 'exact', head: true });
  const { count: wsCount } = await supabase.from('worksheets').select('*', { count: 'exact', head: true });
  const { count: revCount } = await supabase.from('review_items').select('*', { count: 'exact', head: true });

  console.log({
    sourcesInPostgres: srcCount,
    questionsInPostgres: qCount,
    answersInPostgres: aCount,
    worksheetsInPostgres: wsCount,
    reviewItemsInPostgres: revCount,
  });
}

main().catch(console.error);
