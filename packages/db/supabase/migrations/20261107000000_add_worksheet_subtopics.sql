-- Migration: Add subtopic and subtopic_id to worksheets table
ALTER TABLE public.worksheets ADD COLUMN IF NOT EXISTS subtopic TEXT;
ALTER TABLE public.worksheets ADD COLUMN IF NOT EXISTS subtopic_id TEXT;
ALTER TABLE public.worksheets ADD COLUMN IF NOT EXISTS category_id TEXT;
