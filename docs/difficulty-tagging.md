# Difficulty Tagging (Phase 3)

Every question can carry an optional difficulty tag so teachers can build
graded practice sets from the question bank.

```
Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
```

Stored as `questions.difficulty TEXT` (nullable). Answers do **not** store a
copy — they inherit the difficulty of their question.

## Level definitions

| Level | Intended meaning | Typical shape |
| --- | --- | --- |
| `EASY` | Single-step recall, substitution or direct use of one formula. | Short stem, ≤ 4 marks, no chained reasoning. |
| `MEDIUM` | Multi-step but scaffolded; the standard H2 exam question. | 4–6 marks, one chapter, explicit sub-parts. |
| `HARD` | Synthesis, formal proof or heavy technique application. | "Prove/show that/hence/deduce", integration, limits, 3D vectors, ≥ 5 marks. |

Difficulty is an exam-preparation hint, not a grade boundary: it describes
cognitive demand, not a student's chance of scoring.

## How it is computed

1. **Groq primary** — `classifyWithGroq()` in
   `packages/classification/src/groq.ts` asks the model for a `difficulty`
   field alongside chapter/subtopic. Values outside `EASY | MEDIUM | HARD`
   are rejected.
2. **Heuristic fallback** — `classifyDifficulty(subject, textContent, marks?)`
   in `packages/classification/src/matcher.ts` is a pure, deterministic rule
   set. It counts proof/chained-reasoning language (`prove`, `hence`,
   `deduce`, `show that`), advanced-topic signals (integration, limits, 3D
   vectors/planes, probability distributions, complex numbers), stem length
   and mark allocation. It is used when:
   - no `GROQ_API_KEY` is configured or Groq fails/rate-limits,
   - the model omits `difficulty`,
   - the sentence is too short to classify meaningfully.

Both paths agree on the same output type, so callers never branch on which
classifier produced the tag.

## Migration

Apply `packages/db/supabase/migrations/20261124000000_add_question_difficulty.sql`:

```sql
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);
```

The column is nullable, so existing rows stay valid with `NULL`
("unclassified") until the backfill runs. Apply with the Supabase CLI or the
dashboard SQL editor.

## Backfilling / re-running classifications

The offline pipeline reads and writes `packages/db/.paperforge-store.json`:

```bash
# only questions referenced by worksheets
npx tsx scripts/classify_and_verify_groq.ts

# every question in the store
npx tsx scripts/classify_and_verify_groq.ts --all
```

Responses are cached in `scripts/.groq_classify_cache.json`; delete that file
(or an individual entry) to force a re-classification after rubric changes.
Questions whose Groq response lacks a valid difficulty are stamped by the
heuristic, so a full run always leaves every question tagged.

After the store is updated, sync it to Supabase with the regular db sync, then
reload `/questions` — `syncAllQuestionsFromDb()` maps the new column into the
`Question` domain object.

## UI

`QuestionBankMatrix` (`/questions`) exposes a `Difficulty` select
(All / EASY / MEDIUM / HARD) next to the chapter and school filters.
Unclassified questions (`NULL`) only appear under "All".

## Tests

```bash
LOAD_SAMPLE_DATA=true npx tsx --test tests/difficulty.test.mjs
```

Covers schema acceptance/rejection, the EASY/MEDIUM/HARD heuristic bands, the
pipeline's `VALID_DIFFICULTY` guard, db-sync mapping, the migration's
column + index, and the question-bank filter wiring.
