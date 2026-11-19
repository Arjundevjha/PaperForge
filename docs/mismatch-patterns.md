# PaperForge — Learned Mismatch Patterns

> **Purpose**: Living knowledge base maintained by the `paperforge-mismatch-support` agent. Read this **before** triaging any `answer-mismatch` issue to fast-path known root causes.

---

## Pattern 1: Unmatched School Alias → Cross-School Hijack
- **Symptom**: Answer belongs to a completely different JC (e.g. `MIPU3` instead of `NJC`).
- **Why**: `extract_meta` in `scripts/generate_all_answer_screenshots.py` didn't recognize a filename token (e.g. `mipu3`, `jjc`, `yjc`), leaving `sch = None` and allowing tight-batch fallback to pair across schools.
- **Fix**: Add the alias to `SCHOOL_ALIASES` in `scripts/generate_all_answer_screenshots.py` and re-crop.

## Pattern 2: P1 vs P2 Citation Reversion
- **Symptom**: Question ID has `-p1-` in its slug (e.g. `njc-2012-p1-q07`) even though the actual paper is Paper 2 (`paperNumber: 2`), causing P1 solutions to be paired or displayed.
- **Why**: Parsing `paperNumber` from `q.id` instead of `sources` metadata.
- **Fix**: Always trust `sources` provenance (`paperNumber`, `paperType`) and pair against the matching P1/P2 solution PDF.

## Pattern 3: Non-Standard Twin Filenames (`KNOWN_TWIN_SOLUTIONS`)
- **Symptom**: Solution PDF filename has a different year/school/prefix than the question PDF (e.g. `RI_Post+Prelim+Revision+P1_Qns_19707.pdf` → `RI_Post+Prelim+Revision+P1_28LT1_29_Solutions_19710.pdf`).
- **Fix**: Add the exact `(qp_fn, sol_fn)` mapping to `KNOWN_TWIN_SOLUTIONS` in `scripts/generate_all_answer_screenshots.py` and re-crop.

## Pattern 4: Off-by-One or Multi-Page Crop Cutoff
- **Symptom**: Reason is `"Cut off"` or `"Wrong question"` within the same paper.
- **Why**: Solution PDF splits a question across a page break or uses `(a)`/`(b)` headers that confuse the next-question regex.
- **Fix**: Inspect the solution PDF pages around that question number with `PyMuPDF`, stitch multi-page regions vertically if needed, and upload the updated `answers/<question_id>.png`.
