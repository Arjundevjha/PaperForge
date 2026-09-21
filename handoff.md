# PaperForge — Session Handoff Document

> **Status**: Official SEAB GCE A-Level Syllabus Alignment & Full Stack Client State Synchronization Complete  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Local Only • Zero Remote Branches/Pushes)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions and marking schemes, classifying against official Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Accomplished in this Milestone**:
  - **Client-Side vs Server-Side State Isolation Resolution**:
    - Identified that Next.js App Router client components (`'use client'`) in `dashboard`, `questions`, `sources`, `review`, and home (`page.tsx`) were previously calling `getGlobalStore()` synchronously in the browser. In browser memory, this instantiated a blank store (showing 0 sources, 0 questions, 0 worksheets).
    - Refactored all client pages to fetch data via standard asynchronous REST APIs (`/api/sources`, `/api/questions`, `/api/worksheets`, `/api/review`).
    - Added disk persistence in `packages/db/src/store.ts` (`packages/db/.paperforge-store.json`) with automatic read/write synchronization and `globalThis` singleton caching.
  - **Review Queue & Sidebar Badge Accuracy**:
    - Eliminated hardcoded `badge: '2'` from sidebar navigation in `AppShell.tsx`.
    - Integrated dynamic review count fetching (`GET /api/review?status=PENDING`); badge now displays only when pending reviews exist and disappears cleanly when count is 0.
    - Added a verified zero-state card in `ReviewQueue.tsx` highlighting high-confidence automatic classification.
  - **Question Bank Subject Filter Visibility**:
    - Replaced the hardcoded `'chemistry'` default filter with intelligent subject pills (`All Syllabi (26)`, `H2 Math (26)`, `H2 Chem (0)`, etc.).
    - Ingested promotional examination papers (`JPJC 2022` and `EJC + DHS 2022`) are now immediately visible without requiring manual subject filter navigation.
    - Updated `GET /api/questions` to return matching `answers` along with `questions` so the Question Inspector displays full marking schemes and notes.
  - **Sources Console & Duplicate Overwrite**:
    - Added `useEffect` mount fetch and a manual "Refresh" button in `SourcesConsole.tsx`.
    - Replaced generic 409 error banners with a dedicated **"Overwrite & Re-Ingest"** button allowing tutors to overwrite previously ingested papers directly from the UI.
  - **Official SEAB Syllabus Alignment (`packages/shared/src/syllabus.ts`)**:
    - All classification taxonomies directly mirror the **official syllabus publications of SEAB (Singapore Examinations and Assessment Board)**:
      - **H2 Mathematics (Syllabus 9758)**: Sections 1–6 (Functions and Graphs, Sequences and Series, Vectors, Complex Numbers, Calculus, Probability and Statistics).
      - **H2 Chemistry (Syllabus 9476 / 9729)**, **H2 Physics (Syllabus 9749)**, **H2 Biology (Syllabus 9744 / 9477)**.
  - **Automated Tests & Quality Assurance**:
    - **Fallow Dead-Code Analysis**: **0 issues across 37 entry points** (`0.05s`).
    - **Automated Test Suite**: **31/31 passing unit, e2e, and ingestion tests** (`0.26s`).
    - **Production Build**: Turbopack compiled all 14 Next.js routes in ~892ms with zero errors.
    - **Live Browser Automation**: End-to-end verified via `agent-browser` with screenshots recorded in artifact directory.
  - **Strict Local Git Hygiene**:
    - All commits made locally on `main`. Per strict user instructions, **NO remote repository was created and NO code was pushed.**

---

## 2. Active Codebase File State

| Package / App | Path | Status | Key Highlights |
|---|---|---|---|
| **Shared** | `packages/shared/` | Clean & Tested | Authoritative SEAB syllabus taxonomy (H2 Math 9758, Chem 9476, Phys 9749, Bio 9744 across 16 JCs), Zod schemas, provenance builder, `ReviewItem` and `UserProfile` types |
| **Questions** | `packages/questions/` | Clean & Tested | Cambridge question marker parser, marks extractor, parent-child hierarchy tree builder |
| **Deduplication** | `packages/dedup/` | Clean & Tested | SHA-256 source hashing, normalized text fingerprinting, `computeVisualHash` for diagrams, token similarity, composite classifier |
| **Classification** | `packages/classification/` | Clean & Tested | Singapore-Cambridge syllabus matcher with strict subtopic scoping, confidence evaluator, review router |
| **PDF Compiler** | `packages/pdf/` | Clean & Tested | Cambridge A4 layout compiler with 20mm margins, formal headers, fillable student boxes, serif problem stems, mark allocations, and buffer magic-header security validator |
| **Worksheet Engine** | `packages/worksheets/` | Clean & Tested | JC-balanced question selector, immutable `Object.freeze` manifest builder, and synchronized Question & Answer Key PDF compiler enforcing strict 1:1 question-answer invariants |
| **Database** | `packages/db/` | Clean & Tested | Drizzle ORM schema, `PaperForgeDataStore` repository with disk persistence (`.paperforge-store.json`), authentic real papers loader (`real-papers.ts`), and Supabase SQL migration script |
| **Web Application** | `apps/web/` | Built & Verified | Next.js App Router with Technical Examination Foundry design system, dynamic review badge, live REST API fetching across all 6 pages, Cambridge A4 preview canvas |
| **Extraction Worker** | `scripts/extract_pdf_worker.py` | Clean & Tested | Production PyMuPDF worker with bold font Cambridge question detection, sequential solution alignment, and trailing answer table suppression |
| **Classification Tests** | `packages/classification/tests/classification.test.mjs` | Passing (9/9) | Validates classification across all official SEAB chapters: Functions and Graphs, Sequences and Series, Vectors, Complex Numbers, Calculus, Probability and Statistics |
| **Ingestion Test Suite** | `tests/ingestion.test.mjs` | Passing (3/3) | Verifies package integrity, clean slate ingestion, 1:1 answer sync, SHA-256 duplicate rejection, and SEAB chapter assertions |
| **Pipeline E2E Test** | `tests/pipeline.e2e.test.mjs` | Passing (22/22) | Full pipeline integration test: Ingestion -> Classification -> Dedup -> Manifest -> Cambridge PDF Assembly |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.05s) | Automated dead-code, unused export, and unreferenced dependency scanner integrated directly into `npm test` |

---

## 3. Real Examination Paper Packages

### 1. Jurong Pioneer JC (JPJC 2022 H2 Math Promo Paper 1)
- **Source File**: `Promo Practise Paper 3.pdf` (6 pages) + `Promo Practise Paper 3 Solutions.pdf` (14 pages)
- **Detected Attribution**: `JPJC` 2022 H2 Mathematics Promo Paper 1
- **Questions**: 13 questions (Q1–Q13) • 113 total marks
- **Official SEAB Chapters**:
  - `Functions and Graphs`: Q1, Q4, Q8, Q12
  - `Calculus`: Q2, Q3, Q5, Q7, Q9, Q11
  - `Sequences and Series`: Q6
  - `Vectors`: Q10, Q13

### 2. Eunoia JC + Dunman High (EJC + DHS 2022 H2 Math Promo Paper 2)
- **Source File**: `Promo Practise Paper 4.pdf` (6 pages) + `Promo Practise Paper 4 Solutions.pdf` (14 pages)
- **Detected Attribution**: `EJC + DHS` 2022 H2 Mathematics Promo Paper 2
- **Questions**: 13 questions (Q1–Q13) • 103 total marks
- **Official SEAB Chapters**:
  - `Functions and Graphs`: Q1, Q2, Q3, Q5, Q6, Q11, Q12
  - `Calculus`: Q4, Q7, Q10
  - `Sequences and Series`: Q9
  - `Vectors`: Q8, Q13

---

## 4. Key Invariants & Architectural Guarantees

1. **Official SEAB Alignment**: Curriculum codes (`9758`, `9476`, `9749`, `9744`), content sections, and examinable learning outcomes directly mirror official SEAB publications.
2. **Cryptographic Idempotency**: Re-uploading an already-ingested examination paper immediately detects the SHA-256 `sourceHash` match and allows one-click overwrite or rejection.
3. **Deterministic Deduplication**: Questions are fingerprinted with normalized `textHash` and visual `visualHash`. Legitimate parameter variants are preserved and tagged for practice worksheets, while exact duplicates are excluded.
4. **1:1 Question-to-Answer Synchronization**: Every question maintains an exact 1:1 pairing with its step-by-step marking scheme answer and identical academic provenance citation.
5. **Singapore Assessment Authenticity**: Assessment formatting strictly mirrors Cambridge GCE A-Level specifications (20mm margins, STIX Two Text serif fonts, official mark brackets `[Total: 10 marks]`, student candidate boxes).
6. **Zero Dead-Code Assurance**: Fallow executes as a strict quality gate in `npm test` verifying 0 unused exports, files, and dependencies across all entry points.
7. **Strict Access Control**: Default system administrator is strictly `Arjun Dev Jha` (`arjundevjha111@gmail.com`).
8. **Client-Server State Separation**: Client pages must always consume backend REST endpoints and never import backend stores directly.
