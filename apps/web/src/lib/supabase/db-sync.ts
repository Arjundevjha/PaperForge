import { getSupabaseAdmin } from './admin';
import type { PaperForgeDataStore } from '@paperforge/db';
import { formatProvenance, SingaporeSchoolCode, Question, Answer } from '@paperforge/shared';

export async function syncAllQuestionsFromDb(store: PaperForgeDataStore): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return store.listQuestions().length;

  try {
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

    if (allQuestions.length > 0) {
      const newQuestions: Question[] = [];
      for (const q of allQuestions) {
        if (!store.getQuestionById(q.id)) {
          const parts = q.id.split('-');
          const schoolCode = (parts[0]?.toUpperCase() || 'JPJC') as SingaporeSchoolCode;
          const year = parseInt(parts[1], 10) || 2022;
          const paperNum = parseInt(parts[2]?.replace(/\D/g, ''), 10) || 1;

          const prov = formatProvenance(
            schoolCode,
            year,
            'H2 Mathematics',
            'PRELIM',
            paperNum,
            `Q${q.question_number}`,
            q.source_id
          );

          newQuestions.push({
            id: q.id,
            sourceId: q.source_id,
            questionNumber: q.question_number,
            parentQuestionId: q.parent_question_id,
            subject: q.subject,
            chapter: q.chapter,
            subtopic: q.subtopic,
            syllabusVersionId: q.syllabus_version_id,
            textContent: q.text_content,
            marks: q.marks,
            textHash: q.text_hash,
            visualHash: q.visual_hash,
            regions: [
              {
                id: `reg-${q.id}-01`,
                questionId: q.id,
                pageNumber: 1,
                bbox: [56.7, 100, 538.5, 300],
                regionOrder: 1,
              },
            ],
            provenance: prov,
            status: q.status,
            createdAt: q.created_at,
            updatedAt: q.updated_at,
          });
        }
      }
      if (newQuestions.length > 0) {
        store.addQuestions(newQuestions);
      }
    }

    let allAnswers: any[] = [];
    page = 0;
    while (true) {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error || !data || data.length === 0) break;
      allAnswers = allAnswers.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    if (allAnswers.length > 0) {
      const newAnswers: Answer[] = [];
      for (const a of allAnswers) {
        if (!store.getAnswerByQuestionId(a.question_id)) {
          const parts = a.question_id.split('-');
          const schoolCode = (parts[0]?.toUpperCase() || 'JPJC') as SingaporeSchoolCode;
          const year = parseInt(parts[1], 10) || 2022;
          const paperNum = parseInt(parts[2]?.replace(/\D/g, ''), 10) || 1;

          const prov = formatProvenance(
            schoolCode,
            year,
            'H2 Mathematics',
            'PRELIM',
            paperNum,
            `Q${a.question_number}`,
            a.source_id
          );

          newAnswers.push({
            id: a.id,
            sourceId: a.source_id,
            questionId: a.question_id,
            questionNumber: a.question_number,
            answerContent: a.answer_content,
            answerHash: a.answer_hash,
            markSchemeNotes: a.mark_scheme_notes,
            provenance: prov,
            status: a.status,
          });
        }
      }
      if (newAnswers.length > 0) {
        store.addAnswers(newAnswers);
      }
    }

    return store.listQuestions().length;
  } catch (err) {
    console.warn('Questions sync warning:', err);
    return store.listQuestions().length;
  }
}

export async function syncWorksheetsFromDb(store: PaperForgeDataStore): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return store.listWorksheets().length;

  try {
    const { data, error } = await supabase
      .from('worksheets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      for (const w of data) {
        if (!store.getWorksheetById(w.id)) {
          store.addWorksheet({
            id: w.id,
            worksheetNumber: w.worksheet_number,
            title: w.title,
            subject: w.subject,
            chapter: w.chapter,
            syllabusVersionId: w.syllabus_version_id,
            version: w.version,
            questionCount: w.question_count,
            totalMarks: w.total_marks,
            status: w.status,
            sourceCoverage: w.source_coverage || [],
            manifest: w.manifest,
            generatedAt: w.created_at,
            updatedAt: w.updated_at,
          });
        }
      }
    }
    return store.listWorksheets().length;
  } catch (err) {
    console.warn('Worksheets sync warning:', err);
    return store.listWorksheets().length;
  }
}

