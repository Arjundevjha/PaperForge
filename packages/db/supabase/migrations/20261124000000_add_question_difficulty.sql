-- ==============================================================================
-- PaperForge — Add Question Difficulty Tag
-- Difficulty is derived by the Groq classifier (with the deterministic
-- classifyDifficulty heuristic as fallback) and stored per question.
-- ==============================================================================

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);
