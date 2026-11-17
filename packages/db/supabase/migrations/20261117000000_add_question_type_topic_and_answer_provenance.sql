-- ==============================================================================
-- PaperForge — Add Question Type, Topic/Subtopic IDs, Diagram URLs,
-- Answer Solution Provenance, Verification Status, Indexes, and Answers RLS
-- ==============================================================================

-- 1. Questions table enhancements
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic_id TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subtopic_id TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS diagram_url TEXT;

-- 2. Answers table enhancements
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS topic_id TEXT;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS subtopic_id TEXT;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS diagram_url TEXT;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS solution_source_id TEXT;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS solution_source_filename TEXT;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS verification_status TEXT;

-- 3. Performance & filtering indexes
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON public.questions (question_type);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions (topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subtopic_id ON public.questions (subtopic_id);
CREATE INDEX IF NOT EXISTS idx_questions_source_id ON public.questions (source_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers (question_id);
CREATE INDEX IF NOT EXISTS idx_answers_verification_status ON public.answers (verification_status);
CREATE INDEX IF NOT EXISTS idx_answers_solution_source_id ON public.answers (solution_source_id);

-- 4. Fix missing SELECT RLS policy on public.answers
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read answers" ON public.answers;
CREATE POLICY "Authenticated users can read answers"
  ON public.answers FOR SELECT
  TO authenticated
  USING (true);
