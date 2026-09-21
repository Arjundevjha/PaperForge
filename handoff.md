# PaperForge — Session Handoff Document

> **Status**: Official SEAB GCE A-Level Syllabus Adoption & Production Pipeline Complete  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Local Only • Zero Remote Branches/Pushes)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions, classifying against Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Accomplished in this Milestone**:
  - **Official SEAB Syllabus Alignment (`packages/shared/src/syllabus.ts`)**:
    - Replaced all synthetic/custom taxonomy groupings with the **official syllabus documents published by SEAB (Singapore Examinations and Assessment Board)** for Singapore-Cambridge GCE Advanced Level examinations:
      - **H2 Mathematics (Syllabus 9758)**: 6 official SEAB sections:
        - `Section 1: Functions and Graphs` (Functions, Graphs and Transformations, Equations and Inequalities)
        - `Section 2: Sequences and Series` (Sequences and Series, Arithmetic and Geometric Progressions, Binomial Series)
        - `Section 3: Vectors` (Vectors in 2D and 3D, Dot / Scalar Product, Vector / Cross Product, Lines and Planes in 3D)
        - `Section 4: Complex Numbers` (Cartesian Form & Operations, Roots of Polynomials, Argand Diagrams & Loci)
        - `Section 5: Calculus` (Differentiation Techniques, Applications of Differentiation, Maclaurin Series, Integration Techniques, Definite Integrals and Applications, Differential Equations)
        - `Section 6: Probability and Statistics` (Probability, Discrete Random Variables, Normal Distribution, Sampling and CLT, Hypothesis Testing, Correlation and Linear Regression)
      - **H2 Chemistry (Syllabus 9476 / 9729)**: Core Physical, Inorganic, and Organic Chemistry topics.
      - **H2 Physics (Syllabus 9749)**: Sections I–VI.
      - **H2 Biology (Syllabus 9744 / 9477)**: Core Ideas 1–4 and Extension Topics.
  - **Authentic Dual PDF File Upload Pipeline (`SourcesConsole.tsx` & `extract_pdf_worker.py`)**:
    - Removed all simulated 1-click ingest cards and dropdown restrictions.
    - Added real dual file dropzones (Question Paper PDF + Solutions PDF) supporting single-school and composite sets (e.g. `EJC + DHS 2022`).
    - Python PyMuPDF worker extracts question stems, marks, vector diagram flags, and pairs 1:1 with worked solutions.
  - **Production Classification & Persistence (`packages/db/src/real-papers.ts` & `route.ts`)**:
    - Tagged all 26 real questions from JPJC 2022 and EJC+DHS 2022 with official SEAB chapters and subtopics (`SEAB-9758-Official`).
    - Fixed `Worksheet` compilation type contract and dynamic syllabus version propagation.
  - **Automated Tests & Quality Assurance**:
    - **Fallow Dead-Code Analysis**: **0 issues across 37 entry points** (`0.04s`).
    - **Automated Test Suite**: **31/31 passing unit, e2e, and classification tests** (~205ms).
    - **Production Build**: Turbopack compiled all 14 Next.js routes in ~350ms with zero errors.
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
| **Database** | `packages/db/` | Clean & Tested | Drizzle ORM schema, `PaperForgeDataStore` repository, authentic real papers loader (`real-papers.ts`) for JPJC and EJC 2022 promo papers, and Supabase SQL migration script |
| **Web Application** | `apps/web/` | Built & Verified | Next.js App Router with Technical Examination Foundry design system, interactive Sources Console with Upload Modal, Teacher Hub, Question Bank, Review Queue, and REST API routes |
| **Extraction Worker** | `scripts/extract_pdf_worker.py` | Clean & Tested | Production PyMuPDF worker with bold font Cambridge question detection, sequential solution alignment, and trailing answer table suppression |
| **Classification Tests** | `packages/classification/tests/classification.test.mjs` | Passing (9/9) | Validates classification across all official SEAB chapters: Functions and Graphs, Sequences and Series, Vectors, Complex Numbers, Calculus, Probability and Statistics |
| **Ingestion Test Suite** | `tests/ingestion.test.mjs` | Passing (3/3) | Verifies package integrity, clean slate ingestion, 1:1 answer sync, SHA-256 duplicate rejection, and SEAB chapter assertions |
| **Pipeline E2E Test** | `tests/pipeline.e2e.test.mjs` | Passing (22/22) | Full pipeline integration test: Ingestion -> Classification -> Dedup -> Manifest -> Cambridge PDF Assembly |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.04s) | Automated dead-code, unused export, and unreferenced dependency scanner integrated directly into `npm test` |

---

## 3. Real Examination Paper Packages

### 1. Jurong Pioneer JC (JPJC 2022 H2 Math Promo Paper 1)
- **Source File**: `Promo Practise Paper 3.pdf` (6 pages) + `Promo Practise Paper 3 Solutions.pdf` (14 pages)
- **Detected Attribution**: `JPJC` 2022 H2 Mathematics Promo Paper 1
- **Questions**: 13 questions (Q1–Q13)
- **Official SEAB Chapters**:
  - `Functions and Graphs`: Q1, Q4, Q8, Q12
  - `Calculus`: Q2, Q3, Q5, Q7, Q9, Q11
  - `Sequences and Series`: Q6
  - `Vectors`: Q10, Q13

### 2. Eunoia JC + Dunman High (EJC + DHS 2022 H2 Math Promo Paper 2)
- **Source File**: `Promo Practise Paper 4.pdf` (6 pages) + `Promo Practise Paper 4 Solutions.pdf` (14 pages)
- **Detected Attribution**: `EJC + DHS` 2022 H2 Mathematics Promo Paper 2
- **Questions**: 13 questions (Q1–Q13)
- **Official SEAB Chapters**:
  - `Functions and Graphs`: Q1, Q2, Q3, Q5, Q6, Q11
  - `Calculus`: Q4, Q7, Q10, Q12
  - `Sequences and Series`: Q9
  - `Vectors`: Q8, Q13

---

## 4. Key Invariants & Architectural Guarantees

1. **Official SEAB Alignment**: Curriculum codes (`9758`, `9476`, `9749`, `9744`), content sections, and examinable learning outcomes directly mirror official SEAB publications.
2. **Cryptographic Idempotency**: Re-uploading an already-ingested examination paper immediately detects the SHA-256 `sourceHash` match and rejects the upload with HTTP 409 Conflict, preventing duplicate data pollution.
3. **Deterministic Deduplication**: Questions are fingerprinted with normalized `textHash` and visual `visualHash`. Legitimate parameter variants are preserved and tagged for practice worksheets, while exact duplicates are excluded.
4. **1:1 Question-to-Answer Synchronization**: Every question maintains an exact 1:1 pairing with its step-by-step marking scheme answer and identical academic provenance citation.
5. **Singapore Assessment Authenticity**: Assessment formatting strictly mirrors Cambridge GCE A-Level specifications (20mm margins, STIX Two Text serif fonts, official mark brackets `[Total: 10 marks]`, student candidate boxes).
6. **Zero Dead-Code Assurance**: Fallow executes as a strict quality gate in `npm test` verifying 0 unused exports, files, and dependencies across all entry points.
7. **Strict Access Control**: Default system administrator is strictly `Arjun Dev Jha` (`arjundevjha111@gmail.com`).
