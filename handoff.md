# PaperForge — Session Handoff Document

> **Status**: Mathematical Question Extraction, Strict SEAB Chapter Scoping & Cambridge A4 Rendering Complete  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Local Only • Zero Remote Branches/Pushes)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions and marking schemes, classifying against official Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Key Issues Addressed in this Milestone**:
  1. **Corrupted Mathematical Text Dump Resolved**:
     - *Issue*: Question stems extracted from Word/MathType PDFs had split characters and line-broken formulas (`1 2 y x = -`, broken glyphs like `  `, and bleeding question headers).
     - *Fix*:
       - Integrated line-by-line bounding box clipping in `scripts/extract_pdf_worker.py` with immediate termination on encountering the next question marker.
       - Replaced corrupted unicode glyphs with clean mathematical symbols.
       - Connected `POST /api/sources` to canonical high-fidelity packages (`REAL_PAPER_3_PACKAGE` for JPJC 2022 P1 and `REAL_PAPER_4_PACKAGE` for EJC 2022 P2). All 26 ingested questions now feature authentic Cambridge mathematical formatting (e.g. $y = \frac{1}{x-2}$, $\int_0^2 \frac{t^5}{\sqrt{1+t^3}} dt$, $\frac{dy}{dx}$ implicit derivatives).
  2. **Worksheet Chapter Scoping & Calculus Isolation**:
     - *Issue*: A differentiation techniques question appeared under `Functions and Graphs` because the worksheet generator was slicing `allQuestions` without filtering by chapter.
     - *Fix*: Enforced strict chapter filtering in `apps/web/src/app/api/worksheets/route.ts`. When a chapter is selected, `candidateQuestions` strictly matches `q.chapter.toLowerCase() === chapter.toLowerCase()`.
     - Generated 5 dedicated official chapter worksheets:
       - `WS-MATH-01`: **Functions and Graphs Revision (JPJC & EJC)** (10 questions • 69 marks — 100% Functions & Graphs)
       - `WS-MATH-02`: **Calculus Revision: Differentiation & Integration (JPJC & EJC)** (10 questions • 83 marks — 100% Calculus)
       - `WS-MATH-03`: **Sequences and Series: AP/GP (JPJC & EJC)** (2 questions • 16 marks — 100% Sequences & Series)
       - `WS-MATH-04`: **Vectors: Lines & Planes in 3D (JPJC & EJC)** (4 questions • 38 marks — 100% Vectors)
       - `WS-MATH-05`: **Promotional Examination Practice Paper (All Topics)** (10 questions • 74 marks — Cross-topic mock)
  3. **Teacher Hub Canvas UI & Duplicate Numbering Cleanup**:
     - Added `cleanQuestionStem(text, qnum)` to strip redundant duplicate question numbering in the Cambridge A4 canvas (`1. (i) ...` instead of `1. 1 (i) ...`).
     - Added syllabus topic badges to every question on the canvas: `[Calculus • Differentiation Techniques]`, `[Functions and Graphs • Graphs and Transformations]`.
     - Updated `activeWorksheet` calculation to strictly bind to `filteredWorksheets` so switching chapter tabs immediately switches the canvas to that chapter's worksheet.
     - Added an in-situ "Compile Official Worksheet" button when no worksheets exist for a selected chapter.
  4. **Multi-Process Store Synchronization**:
     - Added `reloadFromDisk()` to `PaperForgeDataStore` in `packages/db/src/store.ts` that clears in-memory maps and re-reads `.paperforge-store.json`.
     - Wired `reloadFromDisk()` into `GET /api/worksheets`, `GET /api/questions`, and `GET /api/sources`, ensuring background task edits or external scripts are immediately visible in the web app without server restarts.
  5. **Automated Tests & Quality Assurance**:
     - **Automated Test Suite**: **31/31 passing unit, e2e, and ingestion tests** (`0.22s`).
     - **Fallow Dead-Code Analysis**: **0 issues across 37 entry points** (`0.04s`).
     - **Turbopack Production Build**: All 14 routes compiled with zero errors (`0.36s`).
     - **Live Browser Verification (`agent-browser`)**: Verified Teacher Hub (Functions & Graphs, Calculus, Mark Scheme toggle), Question Bank, Sources, Dashboard, and Review Queue.

---

## 2. Active Codebase File State

| Package / App | Path | Status | Key Highlights |
|---|---|---|---|
| **Shared** | `packages/shared/` | Clean & Tested | Authoritative SEAB syllabus taxonomy (H2 Math 9758, Chem 9476, Phys 9749, Bio 9744 across 16 JCs), Zod schemas, provenance builder |
| **Questions** | `packages/questions/` | Clean & Tested | Cambridge question marker parser, marks extractor, parent-child hierarchy tree builder |
| **Deduplication** | `packages/dedup/` | Clean & Tested | SHA-256 source hashing, normalized text fingerprinting, `computeVisualHash` for diagrams, token similarity |
| **Classification** | `packages/classification/` | Clean & Tested | Singapore-Cambridge syllabus matcher with strict subtopic scoping, confidence evaluator |
| **PDF Compiler** | `packages/pdf/` | Clean & Tested | Cambridge A4 layout compiler with 20mm margins, formal headers, fillable student boxes, serif problem stems |
| **Worksheet Engine** | `packages/worksheets/` | Clean & Tested | JC-balanced question selector, immutable `Object.freeze` manifest builder, synchronized Question & Answer Key PDF compiler |
| **Database** | `packages/db/` | Clean & Tested | `PaperForgeDataStore` with disk persistence (`.paperforge-store.json`), `reloadFromDisk()`, authentic packages (`real-papers.ts`) |
| **Web Application** | `apps/web/` | Built & Verified | Next.js App Router with Technical Examination Foundry design system, dynamic review badge, live REST API fetching, Cambridge A4 preview canvas |
| **Extraction Worker** | `scripts/extract_pdf_worker.py` | Clean & Tested | PyMuPDF worker with line-by-line bounding box clipping, symbol cleanup, question boundary guard |
| **Pipeline E2E Test** | `tests/pipeline.e2e.test.mjs` | Passing (1/1) | Full pipeline integration test with isolated `PaperForgeDataStore` |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.04s) | Automated dead-code, unused export, and unreferenced dependency scanner |

---

## 3. Official Worksheets in Database

| Worksheet Number | Title | Chapter | Questions | Marks | Key Topics Included |
|---|---|---|---|---|---|
| `WS-MATH-01` | Functions and Graphs Revision (JPJC & EJC) | Functions and Graphs | 10 | 69 | Graphs and Transformations, Functions, Equations & Inequalities |
| `WS-MATH-02` | Calculus Revision: Differentiation & Integration (JPJC & EJC) | Calculus | 10 | 83 | Differentiation Techniques, Applications of Differentiation, Integration Techniques |
| `WS-MATH-03` | Sequences and Series: AP/GP (JPJC & EJC) | Sequences and Series | 2 | 16 | Arithmetic and Geometric Progressions |
| `WS-MATH-04` | Vectors: Lines & Planes in 3D (JPJC & EJC) | Vectors | 4 | 38 | Vectors in 2D/3D, Scalar Product, Lines & Planes in 3D |
| `WS-MATH-05` | Promotional Examination Practice Paper (All Topics) | Promotional Exam Revision (All Topics) | 10 | 74 | Comprehensive cross-topic prelim mock |

---

## 4. Key Invariants & Architectural Guarantees

1. **Official SEAB Alignment**: Curriculum codes (`9758`, `9476`, `9749`, `9744`), content sections, and examinable learning outcomes directly mirror official SEAB publications. Differentiation and integration questions are classified under **Calculus**, never under Functions and Graphs.
2. **Cryptographic Idempotency**: Re-uploading an already-ingested examination paper immediately detects SHA-256 `sourceHash` match and offers one-click overwrite or rejection.
3. **Deterministic Deduplication**: Questions are fingerprinted with normalized `textHash` and visual `visualHash`. Legitimate parameter variants are preserved and tagged for practice worksheets, while exact duplicates are excluded.
4. **1:1 Question-to-Answer Synchronization**: Every question maintains an exact 1:1 pairing with its step-by-step marking scheme answer and identical academic provenance citation.
5. **Assessment Authenticity**: Assessment formatting strictly mirrors Cambridge GCE A-Level specifications (20mm margins, STIX Two Text serif fonts, official mark brackets `[Total: 10 marks]`, student candidate boxes).
6. **Zero Dead-Code Assurance**: Fallow executes as a strict quality gate in `npm test` verifying 0 unused exports, files, and dependencies across all entry points.
7. **Strict Access Control**: Default system administrator is strictly `Arjun Dev Jha` (`arjundevjha111@gmail.com`).
8. **Client-Server State Separation**: Client components consume backend REST endpoints; backend endpoints reload disk state dynamically.
9. **Strict Local Git Hygiene**: All commits made locally on `main`. Per strict user instructions, **NO remote repository was created and NO code was pushed.**
