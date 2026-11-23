# Syllabus Analytics

PaperForge Phase 2 — Syllabus Coverage Analytics.

## What coverage means

`computeSyllabusCoverage(subject, questions, answers?)` (in `packages/shared/src/analytics.ts`)
measures how well the question bank covers the authoritative SEAB syllabus taxonomy
(`SINGAPORE_A_LEVEL_SYLLABI` in `packages/shared/src/syllabus.ts`).

For every syllabus chapter/subtopic the engine:

1. Finds questions mapped to the subtopic (primary key: `question.subtopicId === subtopic.id`).
2. Falls back to syllabus keyword overlap (`subtopic.keywords` vs `question.textContent`)
   when the question has no explicit `subtopicId`.
3. Marks the subtopic `covered` when ≥ 1 question matched, otherwise `gap`.

Each subtopic aggregates:

- `covered` / `gap` — boolean coverage state.
- `questions` — matched questions in the bank.
- `questionsWithAnswer` — matched questions that have a stored answer.
- `questionsWithDiagram` — matched questions whose answer has a diagram (`answer.diagramUrl`).

## How to read the page

The `/analytics` page wraps the `SyllabusCoverage` component in `AppShell` (subject switcher
pattern) and fetches `GET /api/analytics/syllabus?subject=<subject>`.

- **Overall Coverage** card: percentage of covered subtopics, plus counts of mapped questions
  and answered questions.
- **Chapter cards**: chapter name, `x/y subtopics covered, z questions`, progress, and gap chips
  listing uncovered subtopics.
- **Subtopic rows**: covered dot (green) vs gap dot (red), question count, and diagram count.

## CSV export

`GET /api/analytics/syllabus/export?subject=<subject>` returns `text/csv` with per-subtopic rows:

```
chapter,chapter_id,subtopic,subtopic_id,covered,questions,questions_with_answer,questions_with_diagram,gap
```

## How to recompute

Coverage is computed on demand from the in-memory question store (synced from Supabase when
`NEXT_PUBLIC_SUPABASE_URL` is set) via `syncAllQuestionsFromDb` + `computeSyllabusCoverage`.
Re-run after classification/sync changes.
