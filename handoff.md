# PaperForge — Session Handoff Document

> **Status**: Authentic Singapore JC Ground-Truth Provenance Healed (260 Promo + 605 P2 Questions Re-Anchored), Authentic Solution Screenshot Pipeline Operational (Strict Promo-to-Promo & Prelim-to-Prelim Matching), Generous Screenshot Headroom (+16pt) & Padding (24px) Active across 1,359 Question Crops & 2,500+ Solution Slices, Full-Width Cambridge A4 PDF Compiler Live, Desktop WS-MATH-01 & WS-MATH-03 Questions and Answer Keys Recompiled to `/Users/abc/Desktop`, 39/39 Passing Tests, 0 Fallow Dead-Code Issues, Clean Turbopack Build.  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main`  
> **Live Production Alias**: `https://paperforge-omega.vercel.app`  
> **Target Desktop Deliverables**:
> - `/Users/abc/Desktop/WS-MATH-03_Vectors_AnswerKey.pdf` (20.63 MB, 232 pages, 220 images)
> - `/Users/abc/Desktop/WS-MATH-03_Vectors_Questions.pdf` (9.04 MB, 55 pages, 115 images)
> - `/Users/abc/Desktop/WS-MATH-01_Functions_and_Graphs_AnswerKey.pdf` (29.48 MB, 252 pages, 316 images)
> - `/Users/abc/Desktop/WS-MATH-01_Functions_and_Graphs_Questions.pdf` (12.67 MB, 68 pages, 137 images)

---

## 1. Executive Summary & Root Cause Fixes

### Problem 1: Misattribution of Exam Papers (e.g. EJC 2023 Prelim P1 vs Promo)
- **User Directive**:
  > *"so the current method of mapping is shit, it deadass does not work. if you look at the vectors worksheet, you will see a question that is cited from EJC 2023 Prelim P1 which it clearly isnt... u keep using that ejc 2023 p1, what paper is that actually supposed to be becuase when i look at the qns being cited from that paper and then i look up the paper to see i get different questions... also looking at the answerkey it shows either the wrong screenshot, or just no screenshot of the anskey, but instead text... make sure it works on all of it. also could you make the screenshots for the worksheets bigger like sometime when i wa doing vectors questions the top just gets cutoff"*

- **Empirical Ground-Truth Proof & Root Causes Identified**:
  1. **Singapore JC Examination Structure**:
     - **Promo Examinations (Promotional)**: Taken by JC1 (Year 1) students in October. Single 3-hour, 100-mark paper.
     - **Prelim Examinations (Preliminary)**: Taken by JC2 (Year 2) students in August/September right before Cambridge A-Levels. Consists of Paper 1 (Pure Math, 100 marks) and Paper 2 (Pure Math & Statistics, 100 marks).
  2. **Initial Ingestion Mapping Flaw**:
     - The early scraper code defaulted any unidentified paper to `paperType: 'PRELIM'` and `paperNumber: 1` (`ejc-2023-p1-q...`).
     - Question `ejc-2023-p1-q04` was actually extracted from `papers/h2_mathematics/EJC_H2_Promo_2023_(Qn)_15028.pdf` (Question 4, vectors collinear ratio theorem $\vec{r} = \frac{\vec{p}+3\vec{q}}{4}$, 7 marks).
     - However, the citation generated was `EJC 2023 Prelim P1 Q4`, which in reality is a completely different question on Arithmetic Progressions from `EJC_9758_2023_Prelim_P1_10088.pdf`.
  3. **Cross-Exam Pairing Poisoning**:
     - The answer screenshot extractor attempted to match by question ID prefix `ejc-2023-p1`, causing it to match `EJC_9758_2023_Prelim_P1_Solution_10087.pdf` instead of the Promo solution `EJC_H2_Promo_2023_(Solutions)_15027.pdf`.
     - This caused the answer key to render the unrelated AP solution instead of the authentic vector proof.
  4. **Screenshot Top Clipping**:
     - Cropping bounding boxes started at `m['y0'] - 4.0pt`. For math questions with vector arrows ($\vec{AB}$, $\mathbf{p}$), radical symbols, or large question numerals, the top 10–15pt was being clipped.

- **Solution Executed**:
  1. **Dataset Provenance Healing (`scripts/heal_dataset_provenance.ts`)**:
     - Healed 260 Promo questions across all subjects to `paperType: 'PROMO'`, eliminating the phantom `P1` designation and updating citations to e.g. `EJC 2023 Promo Q4`.
     - Healed 605 Paper 2 questions to `paperNumber: 2`, updating citations to e.g. `NYJC 2024 Prelim P2 Q10`.
     - Backfilled `worksheetNumber` across all 6 curated worksheets.
     - Updated `packages/shared/src/provenance.ts` to natively support `paperType: 'PROMO'` and formatted display citations via `formatDisplayProvenance`.
  2. **Strict Solution Pairing Invariant (`scripts/generate_all_answer_screenshots.py`)**:
     - Enforced strict pairing: Promo question papers (`*_Promo_*.pdf`) are strictly paired with Promo solution files (`(r'_\(Qn\)_', '_(Solutions)_')`).
     - Prelim papers are strictly paired with Prelim solution files. Cross-exam pairing is strictly rejected.
  3. **Headroom Expansion & Whitespace Trimming**:
     - In both `scripts/generate_all_question_screenshots.py` and `scripts/generate_all_answer_screenshots.py`:
       - `start_y = max(20.0, m['y0'] - 16.0)` (expanded from -4.0pt).
       - `end_y = min(775.0, next_m['y0'] - 14.0)`.
       - Whitespace trimming padding increased to `24px` (`trim_whitespace(img, padding=24)`).
     - Re-cropped `ejc-2023-p1-q04_1.png`, `_2.png`, `_3.png` from Page 3 of `EJC_H2_Promo_2023_(Solutions)_15027.pdf` with the authentic vector ratio theorem proof and diagram.
     - Regenerated all 1,359 question screenshots with zero top-clipping.
  4. **Cambridge A4 Compiler Scaling (`packages/pdf/src/compiler.ts`)**:
     - Enlarged question diagrams and multi-slice solution crops to full printable width `CONTENT_WIDTH` (was `CONTENT_WIDTH - 20`).
     - Increased `maxImgHeight` to 580pt for single-image full-page solutions.
     - Dynamically rendered `displayProvenance` in solution slice headers (`Solution for Q4 • EJC 2023 Promo Q4`).
  5. **Desktop Deliverables Recompiled**:
     - Recompiled `WS-MATH-03_Vectors_AnswerKey.pdf` and `WS-MATH-03_Vectors_Questions.pdf` to `/Users/abc/Desktop`.
     - Recompiled `WS-MATH-01_Functions_and_Graphs_AnswerKey.pdf` and `WS-MATH-01_Functions_and_Graphs_Questions.pdf`.

---

## 2. Active Codebase File State

| Component | Path | Status | Key Highlights |
|---|---|---|---|
| **Provenance Shared Model** | `packages/shared/src/provenance.ts` | Active & Tested | Added `PROMO` paper type and `formatDisplayProvenance` |
| **PDF Compiler** | `packages/pdf/src/compiler.ts` | Active & Tested | Full-width `CONTENT_WIDTH` scaling, 580pt max height, provenance in slice headers |
| **Worksheets Engine** | `packages/worksheets/src/engine.ts` | Active & Tested | Injects `displayProvenance` into answer key generator |
| **Dataset Healing Script** | `scripts/heal_dataset_provenance.ts` | Active & Run | Healed 260 Promo and 605 Paper 2 questions in database store |
| **Question Cropper** | `scripts/generate_all_question_screenshots.py` | Active & Run | +16pt headroom, 24px padding, zero top clipping |
| **Answer Cropper** | `scripts/generate_all_answer_screenshots.py` | Active & Run | Strict Promo-to-Promo matching, +16pt headroom, multi-slice cropping |
| **Desktop Compiler** | `scripts/compile_desktop_answer_key.ts` | Active & Run | Recompiles WS-MATH-01 & WS-MATH-03 Questions & Solutions to Desktop |
| **Diagnostic Tool** | `scripts/diagnose.py` | Active & Tested | Supports `--health`, `--crops`, `--question`, `--pairing`, `--pdf`, `--json` |
| **Diagnostic Tests** | `tests/diagnose.test.mjs` | Active & Tested | Validates EJC 2023 Promo Q4 pairing and diagnostic invariants |
| **Git Configuration** | `.gitignore` | Active & Synchronized | Ignored `graphify-out/` tooling cache |
| **Answer Image Assets** | `apps/web/public/answers/` | Active & Generated | 2,500+ 200-DPI PNG solution slices including authentic Promo vector crops |
| **Question Image Assets**| `apps/web/public/questions/`| Active & Generated | 1,359 regenerated question PNGs with generous headroom |

---

## 3. Verification & Live Test Results

- **Persistent Diagnostic Tool Verification**:
  ```bash
  npm run diagnose
  npm run diagnose -- --question ejc-2023-p1-q04
  ```
  Verified:
  - Provenance: `EJC 2023 Promo Q4`
  - Source File: `EJC_H2_Promo_2023_(Qn)_15028.pdf`
  - Answer Crops: 3 slices present (`ejc-2023-p1-q04_1.png`, `_2.png`, `_3.png`)
  - Text: Vectors collinear ratio theorem proof ($\mathbf{r} = \frac{\mathbf{p}+3\mathbf{q}}{4}$).
- **Unit & Pipeline Tests**: **39/39 passing tests** (`0.53s`) including `tests/diagnose.test.mjs`.
- **Fallow Dead-Code Audit**: **0 issues found** across 58 entry points (`0.05s`).
- **Next.js Production Build**: Turbopack compiled successfully with 0 errors in `1.0s` across all 15 routes.
- **Desktop PDF Verification**:
  - `WS-MATH-03_Vectors_AnswerKey.pdf`: 232 pages, 220 images, 20.63 MB, full-width solutions.
  - `WS-MATH-03_Vectors_Questions.pdf`: 55 pages, 115 images, 9.04 MB.
  - `WS-MATH-01_Functions_and_Graphs_AnswerKey.pdf`: 252 pages, 316 images, 29.48 MB.
  - `WS-MATH-01_Functions_and_Graphs_Questions.pdf`: 68 pages, 137 images, 12.67 MB.

---

## 4. Immediate Next Steps

1. Commit and push the healed dataset provenance, updated compiler, croppers, and test suites to git `main`.
2. Ready for next user requests or further worksheet curation.
