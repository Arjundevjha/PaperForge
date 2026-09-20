-- ==============================================================================
-- PaperForge — Supabase Schema & Auth Synchronization Migration
-- Handles PostgreSQL schema, Supabase Auth hook trigger, and RLS policies
-- ==============================================================================

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Sources Table
CREATE TABLE IF NOT EXISTS public.sources (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  school TEXT NOT NULL,
  year INTEGER NOT NULL,
  subject TEXT NOT NULL,
  paper_type TEXT NOT NULL,
  paper_number INTEGER NOT NULL,
  source_hash TEXT NOT NULL UNIQUE,
  storage_key TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  question_number TEXT NOT NULL,
  parent_question_id TEXT,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  subtopic TEXT,
  syllabus_version_id TEXT NOT NULL,
  text_content TEXT NOT NULL,
  marks INTEGER,
  text_hash TEXT NOT NULL,
  visual_hash TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Question Regions Table (Preserving authentic vector crops)
CREATE TABLE IF NOT EXISTS public.question_regions (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  x0 DOUBLE PRECISION NOT NULL,
  y0 DOUBLE PRECISION NOT NULL,
  x1 DOUBLE PRECISION NOT NULL,
  y1 DOUBLE PRECISION NOT NULL,
  region_order INTEGER NOT NULL
);

-- 5. Answers Table
CREATE TABLE IF NOT EXISTS public.answers (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_number TEXT NOT NULL,
  answer_content TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  mark_scheme_notes TEXT,
  status TEXT NOT NULL
);

-- 6. Answer Regions Table
CREATE TABLE IF NOT EXISTS public.answer_regions (
  id TEXT PRIMARY KEY,
  answer_id TEXT NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  x0 DOUBLE PRECISION NOT NULL,
  y0 DOUBLE PRECISION NOT NULL,
  x1 DOUBLE PRECISION NOT NULL,
  y1 DOUBLE PRECISION NOT NULL,
  region_order INTEGER NOT NULL
);

-- 7. Worksheets Table
CREATE TABLE IF NOT EXISTS public.worksheets (
  id TEXT PRIMARY KEY,
  worksheet_number TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  syllabus_version_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  status TEXT NOT NULL,
  source_coverage JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Worksheet Questions Junction
CREATE TABLE IF NOT EXISTS public.worksheet_questions (
  worksheet_id TEXT NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (worksheet_id, question_id)
);

-- 9. Review Items Table (Human-in-the-Loop Queue)
CREATE TABLE IF NOT EXISTS public.review_items (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  details JSONB NOT NULL,
  status TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Users Table (Synchronized with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEACHER', -- 'ADMIN' or 'TEACHER'
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Supabase Auth Hook: Automatic User Profile Creation
-- When a user signs up via Supabase Auth (or is created in Supabase Dashboard),
-- automatically create their corresponding record in public.users.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Extract role from metadata or default based on email or setting
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'TEACHER');
  
  -- If designated admin email
  IF new.email = 'adrian.low@paperforge.sg' THEN
    assigned_role := 'ADMIN';
  END IF;

  user_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.users (id, email, name, role, avatar_url, created_at, updated_at)
  VALUES (
    new.id::TEXT,
    new.email,
    user_full_name,
    assigned_role,
    new.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user is ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::TEXT AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Questions: All authenticated teachers and admins can read questions
CREATE POLICY "Authenticated users can read questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- Worksheets: All authenticated users can view and generate worksheets
CREATE POLICY "Authenticated users can read worksheets"
  ON public.worksheets FOR SELECT
  TO authenticated
  USING (true);

-- Sources: Authenticated users can read sources
CREATE POLICY "Authenticated users can read sources"
  ON public.sources FOR SELECT
  TO authenticated
  USING (true);

-- Review Items: Only ADMINs can view and resolve review items
CREATE POLICY "Only admins can manage review items"
  ON public.review_items FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Ingestion & Source Upload: Only ADMINs can insert/update sources
CREATE POLICY "Only admins can modify sources"
  ON public.sources FOR ALL
  TO authenticated
  USING (public.is_admin());
