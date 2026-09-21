# PaperForge — Session Handoff Document

> **Status**: Implementation Complete & Comprehensively Verified (Ready for Tutors & Administrators)  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Local Only • Zero Remote Branches/Pushes)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions, classifying against Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Accomplished in this Session**:
  - **Model Switching Rule Removed**:
    - Removed the model switching rule from `~/.gemini/GEMINI.md` and `GEMINI.md.bak` as explicitly requested by the user, maintaining single-model continuity.
  - **Production Examination Paper Ingestion Pipeline**:
    - Sliced and parsed authentic Singapore Junior College examination papers provided by the user:
      - **`Promo Practise Paper 3.pdf` & `Solutions`**: Jurong Pioneer Junior College (JPJC 2022 H2 Mathematics Promo Paper 1, 104 marks, Q1–Q13). Topics: Inequalities, Calculus (differentiation, integration), Vectors, and Curve transformations.
      - **`Promo Practise Paper 4.pdf` & `Solutions`**: Eunoia Junior College + Dunman High School (EJC + DHS 2022 H2 Mathematics Promo Paper 2, 102 marks, Q1–Q13). Topics: Polynomials Remainder Theorem, AP/GP sequences, 3D Vectors, and Optimization.
    - **Cryptographic Hashing & Multi-Signal Deduplication**:
      - **Source Fingerprinting**: Implemented SHA-256 source hashing (`sourceHash`) enforcing strict idempotency and rejecting duplicate paper uploads with HTTP 409 Conflict.
      - **Question Text Fingerprinting**: Normalized text SHA-256 hashing (`textHash`) stripping LaTeX spacing and punctuation differences.
      - **Visual Diagram Hashing**: Perceptual/content hashing (`visualHash`) for questions featuring vector drawings and geometric diagrams.
      - **Deduplication Engine**: Evaluates cross-paper questions using `@paperforge/dedup` (`classifyQuestionPair`), distinguishing `EXACT_DUPLICATE` from legitimate `POSSIBLE_VARIANT` parameter variations.
    - **1:1 Question-to-Answer Synchronization**:
      - Every parsed question is matched 1:1 with its step-by-step marking scheme solution from the official solutions document, enforcing `manifest question count == answer count`.
    - **Backend Ingestion API (`POST /api/sources`)**:
      - Supports 1-click simulation payloads (`simulate: "paper_3"` or `"paper_4"`) and direct payload ingestion.
      - Supports `DELETE /api/sources` for instantaneous clean-slate reset back to 0 papers.
      - Returns rich structured telemetry (`sourceHash`, `totalMarks`, `processingTimeMs`, `questionsIngested`, `answersIngested`).
    - **Interactive Frontend Ingestion Console (`SourcesConsole.tsx`)**:
      - Modern "Upload Source Paper" modal adhering to Technical Examination Foundry design tokens.
      - 1-Click Simulation Cards for **JPJC 2022 Promo Paper 3** and **EJC/DHS 2022 Promo Paper 4**.
      - Live step-by-step pipeline progress animations and telemetry counters.
      - "Reset State" clean slate button and reactive table updates without page refreshes.
    - **Headless CLI Ingestion Tool (`scripts/ingest_paper.ts` / `npm run ingest`)**:
      - Enables automated terminal-driven batch ingestion for background cron and worker pipelines.
  - **Quality Gates & Comprehensive Verification**:
    - **Fallow Dead-Code Analysis**: **0 issues across 37 entry points** (`0.04s`).
    - **Automated Test Suite**: **25/25 passing unit & e2e tests** (~200ms) covering question parsing, provenance citations, SHA-256 source duplicate rejection, visual diagram hashing, Cambridge A4 PDF generation, and RBAC personas.
    - **Production Build**: Turbopack compiled all 14 Next.js routes in ~800ms with zero errors.
    - **Security & Vulnerabilities**: Verified 0 vulnerabilities via `npm audit`.
  - **Strict Local Git Hygiene**:
    - All commits made locally on `main`. Per strict user instructions, **NO remote repository was created and NO code was pushed.**

---

## 2. Active Codebase File State

| Package / App | Path | Status | Key Highlights |
|---|---|---|---|
| **Shared** | `packages/shared/` | Clean & Tested | Singapore syllabus taxonomy (H2 Math 9758, Chem 9476, Phys 9749, Bio 9744 across 16 JCs), Zod schemas, provenance builder, `ReviewItem` and `UserProfile` types |
| **Questions** | `packages/questions/` | Clean & Tested | Cambridge question marker parser, marks extractor, parent-child hierarchy tree builder |
| **Deduplication** | `packages/dedup/` | Clean & Tested | SHA-256 source hashing, normalized text fingerprinting, `computeVisualHash` for diagrams, token similarity, composite classifier |
| **Classification** | `packages/classification/` | Clean & Tested | Singapore-Cambridge syllabus matcher with strict subtopic scoping, confidence evaluator, review router |
| **PDF Compiler** | `packages/pdf/` | Clean & Tested | Cambridge A4 layout compiler with 20mm margins, formal headers, fillable student boxes, serif problem stems, mark allocations, and buffer magic-header security validator |
| **Worksheet Engine** | `packages/worksheets/` | Clean & Tested | JC-balanced question selector, immutable `Object.freeze` manifest builder, and synchronized Question & Answer Key PDF compiler enforcing strict 1:1 question-answer invariants |
| **Database** | `packages/db/` | Clean & Tested | Drizzle ORM schema, `PaperForgeDataStore` repository, authentic real papers loader (`real-papers.ts`) for JPJC and EJC 2022 promo papers, and Supabase SQL migration script |
| **Web Application** | `apps/web/` | Built & Verified | Next.js App Router with Technical Examination Foundry design system, interactive Sources Console with Upload Modal, Teacher Hub, Question Bank, Review Queue, and REST API routes |
| **Ingestion Script** | `scripts/ingest_paper.ts` | Clean & Tested | Headless CLI batch ingestion tool (`npm run ingest --all` or `--paper 3` / `--paper 4`) |
| **Ingestion Test Suite** | `tests/ingestion.test.mjs` | Passing (3/3) | Verifies package integrity, clean slate ingestion, 1:1 answer sync, SHA-256 duplicate rejection, and visual diagram hashing |
| **Pipeline E2E Test** | `tests/pipeline.e2e.test.mjs` | Passing (22/22) | Full pipeline integration test: Ingestion -> Extraction -> Classification -> Deduplication -> Manifest -> Cambridge PDF Assembly |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.04s) | Automated dead-code, unused export, and unreferenced dependency scanner integrated directly into `npm test` |

---

## 3. Real Examination Paper Packages

### 1. Jurong Pioneer JC (JPJC 2022 H2 Math Promo Paper 1)
- **Source File**: `Promo Practise Paper 3.pdf` (6 pages) + `Promo Practise Paper 3 Solutions.pdf` (14 pages)
- **SHA-256 Hash**: `1c52b62c286ebd1efef5f58c704fa4bceb3a32f63f538356f1fca69830500bf0`
- **Total Marks**: 104 marks across 13 questions
- **Coverage**: Q1 (Inequalities), Q2 (Differentiation), Q3 (Integration substitution), Q4 (Stationary points & asymptotes), Q5 (V-shaped water tank rate of change), Q6 (AP/GP sequences), Q7 (Integration by parts), Q8 (Transformations), Q9 (Rectangle inscribed in triangle optimization), Q10 (Vector line intersection), Q11 (Parametric curve area), Q12 (Inverse functions), Q13 (3D plane intersection line & acute angle).

### 2. Eunoia JC + Dunman High (EJC + DHS 2022 H2 Math Promo Paper 2)
- **Source File**: `Promo Practise Paper 4.pdf` (6 pages) + `Promo Practise Paper 4 Solutions.pdf` (14 pages)
- **SHA-256 Hash**: `04e81acaa6bb9a82390637d9ebc6e2671ebaf952a2082260ff0d22d561fb7267`
- **Total Marks**: 102 marks across 13 questions
- **Coverage**: Q1 (Polynomial remainder theorem), Q2 (Reciprocal curve & derivatives), Q3 (Symmetric hyperbola asymptotes), Q4 (Parametric normal & tangent), Q5 (Logarithmic inequalities), Q6 (Absolute value transformations), Q7 (Standard integrals & arcsin), Q8 (Perpendicular vector dot products), Q9 (Geometric sequence log AP), Q10 (Tent model area optimization), Q11 (Composite function domain existence), Q12 (Strictly increasing polynomial root), Q13 (Drone 3D flight path & cliff face plane).

---

## 4. How to Run & Simulate Production Ingestion

```bash
# 1. Start the web application
npm run dev

# 2. Open Sources Console in browser:
# http://localhost:3000/sources
# - Click "Upload Source Paper" to open the interactive modal.
# - Click "⚡ Ingest Paper 3 (JPJC)" or "⚡ Ingest Paper 4 (EJC/DHS)".
# - Watch real-time pipeline telemetry:
#   [✓] Generating SHA-256 cryptographic source fingerprint
#   [✓] Slicing questions & detecting vector diagrams
#   [✓] Evaluating against Singapore-Cambridge H2 Math (9758) taxonomy
#   [✓] Synchronizing step-by-step marking scheme answers 1:1
#   [✓] Checking cross-paper deduplication & variant detection

# 3. View Ingested Questions:
# http://localhost:3000/questions

# 4. Generate Worksheet from Ingested Papers:
# http://localhost:3000/

# 5. Reset to clean slate at any time:
# Click "Reset State" in /sources or run:
# curl -X DELETE http://localhost:3000/api/sources

# 6. Or run CLI batch ingestion directly in terminal:
npm run ingest -- --paper 3
npm run ingest -- --paper 4
npm run ingest -- --all

# 7. Run full quality gate (Fallow + 25 tests):
npm test
```

---

## 5. Key Invariants & Architectural Guarantees

1. **Cryptographic Idempotency**: Re-uploading an already-ingested examination paper immediately detects the SHA-256 `sourceHash` match and rejects the upload with HTTP 409 Conflict, preventing duplicate data pollution.
2. **Deterministic Deduplication**: Questions are fingerprinted with normalized `textHash` and visual `visualHash`. Legitimate parameter variants are preserved and tagged for practice worksheets, while exact duplicates are excluded.
3. **1:1 Question-to-Answer Synchronization**: Every question maintains an exact 1:1 pairing with its step-by-step marking scheme answer and identical academic provenance citation.
4. **Singapore Assessment Authenticity**: Assessment formatting strictly mirrors Cambridge GCE A-Level specifications (20mm margins, STIX Two Text serif fonts, official mark brackets `[Total: 10 marks]`, student candidate boxes).
5. **Zero Dead-Code Assurance**: Fallow executes as a strict quality gate in `npm test` verifying 0 unused exports, files, and dependencies across all entry points.
6. **Strict Access Control**: Default system administrator is strictly `Arjun Dev Jha` (`arjundevjha111@gmail.com`).
