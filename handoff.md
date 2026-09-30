# PaperForge — Session Handoff Document

> **Status**: Authentic Singapore JC Answer Key & Marking Scheme Screenshot Pipeline Operational, High-Resolution 200-DPI Solution Crops Active (2,461 Assets), Cambridge A4 PDF Compiler Multi-Slice Pagination Live, Desktop WS-MATH-01 Answer Key Overwritten (Reduced from 466 Broken Pages to 252 Pristine Solution Pages), Global Development Rules Updated (Zero Ephemeral Inline Scripts & Persistent Diagnostic Tooling Enforced), `scripts/diagnose.py` & `npm run diagnose` Live, 39/39 Passing Tests, 0 Fallow Dead-Code Issues, 0 Vulnerabilities  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main`  
> **Live Production Alias**: `https://paperforge-omega.vercel.app`  
> **Target Desktop Deliverable**: `/Users/abc/Desktop/WS-MATH-01_Functions_and_Graphs_AnswerKey (1).pdf` & `/Users/abc/Desktop/WS-MATH-01_Functions_and_Graphs_AnswerKey.pdf`  

---

## 1. Executive Summary & Root Cause Fixes

### Problem 1: 466-Page Broken Answer Key PDF on Desktop
- **User Directive**:
  > *"look for this in the desktop WS-MATH-01_Functions_and_Graphs_AnswerKey (1).pdf. obvisously i also ment to screenshot the ans key the the used questions and complie them properly"*

- **Root Causes Identified**:
  1. **OCR / Raw Text Stream Pollution**:
     In Singapore JC mathematics solution PDFs, mathematical layouts (fractions, radical signs, matrices, coordinate sketches) are stored as absolute positioned glyphs. Extracting text directly via PyMuPDF converted these equations into thousands of single-character lines (`d\ny\nd\nx\n2\n/\n=`), which `generateAnswerKeyPdf` rendered line-by-line across 466 unreadable pages.
  2. **Solution Matcher & Marker Detection Flaws**:
     An earlier script attempt failed to crop solutions because numeric ID proximity matched across different schools and sequential marker tracking was derailed by page number footers.
  3. **Compiler Text-Dumping Default**:
     `generateAnswerKeyPdf` always rendered `a.answerContent` raw text even when a diagram existed, limiting diagram height to an unreadable 150 points.

- **Solution Executed**:
  1. **Strict Metadata Solution Resolution (`scripts/generate_all_answer_screenshots.py`)**:
     - Strict school matching across all 24 Singapore JCs.
     - Strict paper matching (`P1` vs `P2`) and examination year matching.
  2. **Monotonic Left-Margin Marker Parsing**:
     - Constrained candidate search to `35 < y0 < 720` and `x0 < 145`, eliminating running headers and page number footers.
  3. **Multi-Slice Pagination Engine**:
     - Cleanly slices multi-page JC solutions into `{qid}_1.png`, `{qid}_2.png`, etc., and stitches a composite `{qid}.png`.
     - 2,461 image assets generated into `apps/web/public/answers/` (832 questions cropped with authentic handwritten workings and mark allocations).
  4. **Cambridge A4 Answer Key Compiler (`packages/pdf/src/compiler.ts`)**:
     - Resolves answer slices (`{qid}_1.png` .. `{qid}_8.png`) and embeds them at full printable width (`CONTENT_WIDTH - 20`).
     - Suppresses raw OCR text dumping when screenshot slices are present.
  5. **Desktop PDF Recompilation**:
     - Reduced from 466 pages down to 252 pristine, publication-grade solution pages containing 316 embedded screenshots and zero broken character lines.

---

### Problem 2: Ephemeral Ad-Hoc Scripts Preventing Command Persistence
- **User Directive**:
  > *"is there a way code can be tested better, or issues figured out better. like sometimes when i ask something you run so many different oython codes and since all of them are different persistence of the command is not possible... it isnt just for this project its just a general thing... now make this part of GLOBAL rules"*

- **Root Causes Identified**:
  Agents executing throwaway inline snippets (`python3 -c "..."`, `node -e "..."`) left no persistent history, prevented reproducible testing, could not be audited or re-run by the user, and failed to prevent regressions.

- **Solution Executed**:
  1. **Global Development Rules Updated**:
     Synchronized both `~/.gemini/GEMINI.md` and `~/.config/opencode/rules/global-development-rules.md` under Section 3 with:
     - **Zero Ephemeral Inline Scripts (`python -c`, `node -e`)**: Strict prohibition of ad-hoc multi-line terminal flags.
     - **Reproduction-Test-First & Regression Invariant**: Bug investigations must first be codified as physical test cases before applying fixes.
     - **Persistent Diagnostic Tooling ("Doctor / Diagnose" Pattern)**: Dedicated, version-controlled CLI diagnostics with reusable, deterministic flags.
  2. **PaperForge Persistent Diagnostic CLI (`scripts/diagnose.py`)**:
     - Implemented `scripts/diagnose.py` supporting `--health`, `--crops`, `--question <qid>`, `--pairing`, `--pdf <path>`, and `--json`.
     - Registered `npm run diagnose` in `package.json`.
     - Added comprehensive unit test in `tests/diagnose.test.mjs` verifying health check, asset audits, and question lookups.

---

## 2. Active Codebase File State

| Component | Path | Status | Key Highlights |
|---|---|---|---|
| **Global Rules (Gemini)** | `~/.gemini/GEMINI.md` | Active & Persisted | Section 3: Zero ephemeral scripts, Doctor pattern, reproduction-test-first |
| **Global Rules (Opencode)**| `~/.config/opencode/rules/global-development-rules.md` | Active & Persisted | Synchronized Section 3 rules across environments |
| **Diagnostic Tool** | `scripts/diagnose.py` | Active & Verified | CLI supporting `--health`, `--crops`, `--question`, `--pairing`, `--pdf`, `--json` |
| **Diagnostic Tests** | `tests/diagnose.test.mjs` | Active & Verified | Node test suite validating diagnostic CLI outputs |
| **Monorepo Config** | `package.json` | Active & Verified | Added `"diagnose": "python3 scripts/diagnose.py"` |
| **Answer Key Generator** | `scripts/generate_all_answer_screenshots.py` | Active & Verified | Strict metadata matching, monotonic marker parsing, multi-slice cropping |
| **PDF Compiler** | `packages/pdf/src/compiler.ts` | Active & Verified | Multi-slice answer embedding, full-width scaling, text dumping suppression |
| **Worksheets Engine** | `packages/worksheets/src/engine.ts` | Active & Verified | Passes `questionId` and `/answers/${q.id}.png` fallback |
| **Desktop Compiler Script** | `scripts/compile_desktop_answer_key.ts` | Active & Verified | Compiles WS-MATH-01 directly to `/Users/abc/Desktop` |
| **Answer Image Assets** | `apps/web/public/answers/` | Active & Verified | 2,461 200-DPI PNG solution slices and composite images |
| **Workspace Project Rule** | `.agents/rules/exam-compilation-standards.md` | Active & Persisted | Strict text-for-classification, screenshots-for-compilation invariants |
| **Workspace Project Skill** | `.agents/skills/exam-document-screenshot-compiler/SKILL.md` | Active & Persisted | End-to-end pairing, monotonic parsing, and multi-slice pagination engine |

---

## 3. Verification & Live Test Results

- **Persistent Diagnostic Tool Verification**:
  ```bash
  npm run diagnose
  npm run diagnose -- --crops
  npm run diagnose -- --question rvhs-2019-p1-q03
  npm run diagnose -- --pdf "WS-MATH-01_Functions_and_Graphs_AnswerKey (1).pdf"
  ```
  All commands execute deterministically and cleanly with structured visual reports.
- **Unit & Pipeline Tests**: **39/39 passing tests** (`0.43s`) including `tests/diagnose.test.mjs`.
- **Fallow Dead-Code Audit**: **0 issues found** across 57 entry points (`0.03s`).
- **Next.js Production Build**: Turbopack compiled successfully with 0 errors in `1.25s` across all 15 routes.
- **Desktop PDF Verification**:
  - `WS-MATH-01_Functions_and_Graphs_AnswerKey (1).pdf`: 252 pages (down from 466), 316 embedded screenshots, 25.61 MB, Publication Grade.

---

## 4. Immediate Next Steps

1. Commit and push the diagnostic tool and test updates to git `main`.
2. Ready for next user requests or feature workflows.
