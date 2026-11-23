import { getSupabaseAdmin } from './admin';
import type { PaperForgeDataStore } from '@paperforge/db';
import {
  formatProvenance,
  SingaporeSchoolCode,
  Question,
  Answer,
  QuestionType,
  SubjectId,
  SUBJECT_METADATA,
} from '@paperforge/shared';

let questionsSynced = false;
let worksheetsSynced = false;

export async function syncAllQuestionsFromDb(store: PaperForgeDataStore, force = false): Promise<number> {
  if (questionsSynced && !force) return store.listQuestions().length;
  const supabase = getSupabaseAdmin();
  if (!supabase) return store.listQuestions().length;

  try {
    // Load sources first so provenance uses real paperNumber, paperType, school, year, subject
    const sourceMap = new Map<string, any>();
    let srcPage = 0;
    const pageSize = 1000;
    while (true) {
      const { data: srcData, error: srcErr } = await supabase
        .from('sources')
        .select('id, filename, school, year, subject, paper_type, paper_number')
        .range(srcPage * pageSize, (srcPage + 1) * pageSize - 1);
      if (srcErr || !srcData || srcData.length === 0) break;
      for (const s of srcData) {
        sourceMap.set(s.id, s);
      }
      if (srcData.length < pageSize) break;
      srcPage++;
    }

    let allQuestions: any[] = [];
    let page = 0;
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
        const parts = q.id.split('-');
        const src = sourceMap.get(q.source_id);
        const schoolCode = (src?.school || parts[0]?.toUpperCase() || 'JPJC') as SingaporeSchoolCode;
        const year = src?.year ?? (parseInt(parts[1], 10) || 2022);
        const paperNum = src?.paper_number ?? (parseInt(parts[2]?.replace(/\D/g, ''), 10) || 1);
        const paperType = src?.paper_type || 'PRELIM';
        const subjectId = (src?.subject || q.subject || 'mathematics') as SubjectId;
        const subjectName = SUBJECT_METADATA[subjectId]?.name || 'H2 Mathematics';

        const prov = formatProvenance(
          schoolCode,
          year,
          subjectName,
          paperType,
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
          topicId: q.topic_id ?? null,
          subtopic: q.subtopic,
          subtopicId: q.subtopic_id ?? null,
          questionType: q.question_type || undefined,
          difficulty: q.difficulty || undefined,
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
          diagramUrl: q.diagram_url || `/questions/${q.id}.png`,
        });
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
        const parts = a.question_id.split('-');
        const src = sourceMap.get(a.solution_source_id || a.source_id) || sourceMap.get(a.source_id);
        const schoolCode = (src?.school || parts[0]?.toUpperCase() || 'JPJC') as SingaporeSchoolCode;
        const year = src?.year ?? (parseInt(parts[1], 10) || 2022);
        const paperNum = src?.paper_number ?? (parseInt(parts[2]?.replace(/\D/g, ''), 10) || 1);
        const paperType = src?.paper_type || 'PRELIM';
        const subjectId = (src?.subject || 'mathematics') as SubjectId;
        const subjectName = SUBJECT_METADATA[subjectId]?.name || 'H2 Mathematics';

        const prov = formatProvenance(
          schoolCode,
          year,
          subjectName,
          paperType,
          paperNum,
          `Q${a.question_number}`,
          a.solution_source_id || a.source_id
        );

        newAnswers.push({
          id: a.id,
          sourceId: a.source_id,
          questionId: a.question_id,
          questionNumber: a.question_number,
          questionType: a.question_type || undefined,
          topicId: a.topic_id ?? null,
          subtopicId: a.subtopic_id ?? null,
          diagramUrl: a.diagram_url || `/answers/${a.question_id}.png`,
          solutionSourceId: a.solution_source_id ?? null,
          solutionSourceFilename: a.solution_source_filename ?? src?.filename ?? null,
          answerContent: a.answer_content,
          answerHash: a.answer_hash,
          markSchemeNotes: a.mark_scheme_notes,
          verificationStatus: a.verification_status || undefined,
          provenance: prov,
          status: a.status,
        });
      }
      if (newAnswers.length > 0) {
        store.addAnswers(newAnswers);
      }
    }

    questionsSynced = true;
    return store.listQuestions().length;
  } catch (err) {
    console.warn('Questions sync warning:', err);
    return store.listQuestions().length;
  }
}

export async function syncWorksheetsFromDb(store: PaperForgeDataStore, force = false): Promise<number> {
  if (worksheetsSynced && !force) return store.listWorksheets().length;
  const supabase = getSupabaseAdmin();
  if (!supabase) return store.listWorksheets().length;

  try {
    const [wsRes, wqRes] = await Promise.all([
      supabase.from('worksheets').select('*').order('worksheet_number', { ascending: true }),
      supabase.from('worksheet_questions').select('*').order('position', { ascending: true }).range(0, 5000),
    ]);

    const data = wsRes.data;
    const wqData = wqRes.data || [];

    const qMap: Record<string, string[]> = {};
    for (const row of wqData) {
      if (!qMap[row.worksheet_id]) {
        qMap[row.worksheet_id] = [];
      }
      qMap[row.worksheet_id].push(row.question_id);
    }

    if (!wsRes.error && Array.isArray(data) && data.length > 0) {
      store.clearWorksheets();
      for (const w of data) {
        const questionIds = qMap[w.id] || [];
        store.addWorksheet({
          id: w.id,
          worksheetNumber: w.worksheet_number,
          title: w.title,
          subject: w.subject,
          chapter: w.chapter,
          subtopic: w.subtopic || undefined,
          subtopicId: w.subtopic_id || undefined,
          categoryId: w.category_id || undefined,
          syllabusVersionId: w.syllabus_version_id,
          version: w.version,
          questionCount: w.question_count,
          totalMarks: w.total_marks,
          status: w.status,
          sourceCoverage: w.source_coverage || [],
          manifest: {
            worksheetId: w.id,
            version: w.version,
            subject: w.subject,
            chapter: w.chapter,
            subtopic: w.subtopic || undefined,
            subtopicId: w.subtopic_id || undefined,
            questions: questionIds,
            totalMarks: w.total_marks,
            frozenAt: w.generated_at,
          },
          generatedAt: w.generated_at,
          updatedAt: w.updated_at,
        });
      }
    }
    worksheetsSynced = true;
    return store.listWorksheets().length;
  } catch (err) {
    console.warn('Worksheets sync warning:', err);
    return store.listWorksheets().length;
  }
}

export async function reclassifyQuestionInDb(
  store: PaperForgeDataStore,
  questionId: string,
  chapter: string,
  subtopic?: string | null,
  status?: Question['status'],
  questionType?: QuestionType,
  topicId?: string | null,
  subtopicId?: string | null
): Promise<{
  question: Question | undefined;
  movedFromWorksheet?: string;
  movedToWorksheet?: string;
}> {
  const existing = store.getQuestionById(questionId);
  const oldChapter = existing?.chapter;

  const updatedQuestion = store.updateQuestion(questionId, {
    chapter,
    subtopic: subtopic || undefined,
    ...(status ? { status } : {}),
    ...(questionType ? { questionType } : {}),
    ...(topicId !== undefined ? { topicId } : {}),
    ...(subtopicId !== undefined ? { subtopicId } : {}),
  });

  let movedFromWorksheet: string | undefined;
  let movedToWorksheet: string | undefined;

  const oldSubtopic = existing?.subtopic;
  const isChanged =
    (oldChapter && oldChapter.toLowerCase() !== chapter.toLowerCase()) ||
    (subtopic && oldSubtopic && oldSubtopic.toLowerCase() !== subtopic.toLowerCase());

  // If chapter or subtopic changed, move question between worksheets
  if (isChanged) {
    const allWorksheets = store.listWorksheets();
    const findWs = (ch?: string, sub?: string | null) => {
      if (!ch) return undefined;
      if (sub) {
        const exact = allWorksheets.find(
          (w) =>
            w.chapter.toLowerCase() === ch.toLowerCase() &&
            (w.subtopic?.toLowerCase() === sub.toLowerCase() ||
              w.title.toLowerCase().includes(sub.toLowerCase()))
        );
        if (exact) return exact;
      }
      return allWorksheets.find((w) => w.chapter.toLowerCase() === ch.toLowerCase());
    };

    const oldWs = findWs(oldChapter, oldSubtopic);
    const newWs = findWs(chapter, subtopic);

    if (oldWs && newWs && oldWs.id !== newWs.id) {
      store.moveQuestionBetweenWorksheets(questionId, oldWs.id, newWs.id);
      movedFromWorksheet = oldWs.worksheetNumber;
      movedToWorksheet = newWs.worksheetNumber;
    }
  }

  // Synchronize directly to Supabase PostgreSQL if configured
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const nowIso = new Date().toISOString();
      const updates: Record<string, any> = {
        chapter,
        updated_at: nowIso,
      };
      if (subtopic !== undefined) updates.subtopic = subtopic;
      if (status) updates.status = status;
      if (questionType) updates.question_type = questionType;
      if (topicId !== undefined) updates.topic_id = topicId;
      if (subtopicId !== undefined) updates.subtopic_id = subtopicId;

      await supabase.from('questions').update(updates).eq('id', questionId);

      if (isChanged) {
        const { data: wsRows } = await supabase
          .from('worksheets')
          .select('id, chapter, title, worksheet_number, question_count, total_marks');

        if (wsRows && wsRows.length > 0) {
          const findWsRow = (ch?: string, sub?: string | null) => {
            if (!ch) return undefined;
            if (sub) {
              const exact = wsRows.find(
                (w) =>
                  w.chapter.toLowerCase() === ch.toLowerCase() &&
                  w.title.toLowerCase().includes(sub.toLowerCase())
              );
              if (exact) return exact;
            }
            return wsRows.find((w) => w.chapter.toLowerCase() === ch.toLowerCase());
          };

          const oldWsRow = findWsRow(oldChapter, oldSubtopic);
          const newWsRow = findWsRow(chapter, subtopic);

          if (oldWsRow) {
            await supabase
              .from('worksheet_questions')
              .delete()
              .eq('worksheet_id', oldWsRow.id)
              .eq('question_id', questionId);

            const { count: remainingCount } = await supabase
              .from('worksheet_questions')
              .select('*', { count: 'exact', head: true })
              .eq('worksheet_id', oldWsRow.id);

            await supabase
              .from('worksheets')
              .update({
                question_count: remainingCount ?? Math.max(0, (oldWsRow.question_count || 1) - 1),
                total_marks: Math.max(0, (oldWsRow.total_marks || 0) - (existing?.marks || 0)),
                updated_at: nowIso,
              })
              .eq('id', oldWsRow.id);
          }

          if (newWsRow) {
            const { data: posData } = await supabase
              .from('worksheet_questions')
              .select('position')
              .eq('worksheet_id', newWsRow.id)
              .order('position', { ascending: false })
              .limit(1);

            const nextPos = (posData?.[0]?.position || 0) + 1;

            await supabase
              .from('worksheet_questions')
              .upsert({
                worksheet_id: newWsRow.id,
                question_id: questionId,
                position: nextPos,
              });

            const { count: newCount } = await supabase
              .from('worksheet_questions')
              .select('*', { count: 'exact', head: true })
              .eq('worksheet_id', newWsRow.id);

            await supabase
              .from('worksheets')
              .update({
                question_count: newCount ?? ((newWsRow.question_count || 0) + 1),
                total_marks: (newWsRow.total_marks || 0) + (existing?.marks || 0),
                updated_at: nowIso,
              })
              .eq('id', newWsRow.id);
          }
        }
      }
    } catch (dbErr) {
      console.error('Supabase reclassifyQuestionInDb error:', dbErr);
    }
  }

  return {
    question: updatedQuestion,
    movedFromWorksheet,
    movedToWorksheet,
  };
}

