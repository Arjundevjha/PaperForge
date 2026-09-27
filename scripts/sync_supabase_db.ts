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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function cleanText(str: string | null | undefined): string | null {
  if (typeof str !== 'string') return str || null;
  return str.replace(/\0/g, '').replace(/\\u0000/g, '');
}

async function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — COMPLETE SUPABASE DATABASE SYNCHRONIZATION');
  console.log('================================================================\n');

  const storeFilePath = path.resolve(process.cwd(), 'packages', 'db', '.paperforge-store.json');
  if (!fs.existsSync(storeFilePath)) {
    console.error('Local store file not found:', storeFilePath);
    process.exit(1);
  }

  const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
  const sources = storeData.sources || [];
  const questions = storeData.questions || [];
  const answers = storeData.answers || [];
  const worksheets = storeData.worksheets || [];

  console.log(`[i] Loaded from store: ${sources.length} sources, ${questions.length} questions, ${answers.length} answers, ${worksheets.length} worksheets.\n`);

  // 1. Upsert Sources in Batches of 100
  console.log('[+] Phase 1: Upserting sources into Supabase PostgreSQL...');
  const sourceRows = sources.map((s: any) => ({
    id: s.id,
    filename: cleanText(s.filename) || 'paper.pdf',
    school: s.school,
    year: s.year,
    subject: s.subject || 'mathematics',
    paper_type: s.paperType || 'PRELIM',
    paper_number: s.paperNumber || 1,
    source_hash: s.sourceHash || `hash_${s.id}`,
    storage_key: s.storageKey || `incoming/${s.filename}`,
    page_count: s.pageCount || 8,
    status: s.status || 'READY',
    created_at: s.createdAt || new Date().toISOString(),
    updated_at: s.updatedAt || new Date().toISOString(),
  }));

  for (let i = 0; i < sourceRows.length; i += 100) {
    const batch = sourceRows.slice(i, i + 100);
    const { error } = await supabase.from('sources').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error in sources batch ${i}-${i + 100}:`, error.message);
    }
  }
  console.log(`[✓] Upserted ${sourceRows.length} sources.\n`);

  // 2. Upsert Questions in Batches of 100
  console.log('[+] Phase 2: Upserting questions into Supabase PostgreSQL (with null byte sanitization)...');
  const questionRows = questions.map((q: any) => ({
    id: q.id,
    source_id: q.sourceId,
    question_number: q.questionNumber,
    parent_question_id: q.parentQuestionId || null,
    subject: q.subject || 'mathematics',
    chapter: cleanText(q.chapter) || 'Promotional Exam Revision',
    subtopic: cleanText(q.subtopic) || null,
    syllabus_version_id: q.syllabusVersionId || 'SEAB-9758',
    text_content: cleanText(q.textContent) || '',
    marks: q.marks || 4,
    text_hash: q.textHash || 'hash',
    visual_hash: q.visualHash || null,
    status: q.status || 'READY',
    created_at: q.createdAt || new Date().toISOString(),
    updated_at: q.updatedAt || new Date().toISOString(),
  }));

  for (let i = 0; i < questionRows.length; i += 100) {
    const batch = questionRows.slice(i, i + 100);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error in questions batch ${i}-${i + 100}:`, error.message);
    }
  }
  console.log(`[✓] Upserted ${questionRows.length} questions.\n`);

  // 3. Upsert Answers in Batches of 100
  console.log('[+] Phase 3: Upserting answers into Supabase PostgreSQL...');
  const answerRows = answers.map((a: any) => ({
    id: a.id,
    source_id: a.sourceId,
    question_id: a.questionId,
    question_number: a.questionNumber,
    answer_content: cleanText(a.answerContent) || '',
    answer_hash: a.answerHash || 'anshash',
    mark_scheme_notes: cleanText(a.markSchemeNotes) || null,
    status: a.status || 'AUTO_MATCHED',
  }));

  for (let i = 0; i < answerRows.length; i += 100) {
    const batch = answerRows.slice(i, i + 100);
    const { error } = await supabase.from('answers').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error in answers batch ${i}-${i + 100}:`, error.message);
    }
  }
  console.log(`[✓] Upserted ${answerRows.length} answers.\n`);

  // 4. Upsert Worksheets
  console.log('[+] Phase 4: Upserting worksheets into Supabase PostgreSQL...');
  const worksheetRows = worksheets.map((w: any) => ({
    id: w.id,
    worksheet_number: w.worksheetNumber || w.id.toUpperCase(),
    title: w.title,
    subject: w.subject || 'mathematics',
    chapter: w.chapter || 'All Chapters',
    syllabus_version_id: w.syllabusVersionId || 'SEAB-9758-Official',
    version: w.version || 1,
    question_count: w.questionCount || w.manifest?.questions?.length || 10,
    total_marks: w.totalMarks || 80,
    status: w.status || 'PUBLISHED',
    source_coverage: w.sourceCoverage || ['JPJC', 'EJC'],
    generated_at: w.generatedAt || new Date().toISOString(),
    updated_at: w.updatedAt || new Date().toISOString(),
  }));

  const { error: wsErr } = await supabase.from('worksheets').upsert(worksheetRows, { onConflict: 'id' });
  if (wsErr) {
    console.error('Error upserting worksheets:', wsErr.message);
  } else {
    console.log(`[✓] Upserted ${worksheetRows.length} worksheets.\n`);
  }

  // 5. Verification
  console.log('================================================================');
  console.log('  VERIFIED POSTGRESQL ROW COUNTS');
  console.log('================================================================');
  const { count: srcCount } = await supabase.from('sources').select('*', { count: 'exact', head: true });
  const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  const { count: aCount } = await supabase.from('answers').select('*', { count: 'exact', head: true });
  const { count: wsCount } = await supabase.from('worksheets').select('*', { count: 'exact', head: true });
  const { count: revCount } = await supabase.from('review_items').select('*', { count: 'exact', head: true });

  console.log(`  Sources in PostgreSQL:      ${srcCount}`);
  console.log(`  Questions in PostgreSQL:    ${qCount}`);
  console.log(`  Answers in PostgreSQL:      ${aCount}`);
  console.log(`  Worksheets in PostgreSQL:   ${wsCount}`);
  console.log(`  Review Items in PostgreSQL: ${revCount}`);
  console.log('================================================================\n');
}

main().catch(console.error);
