# PaperForge — Session Handoff Document

> **Status**: Production Ingestion Complete & Comprehensively Verified (Ready for Tutors & Administrators)  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Local Only • Zero Remote Branches/Pushes)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions, classifying against Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Accomplished in this Session**:
  - **Single-Model Continuity**:
    - Removed the model switching rule from `~/.gemini/GEMINI.md` and `GEMINI.md.bak` as explicitly requested by the user.
  - **Authentic Dual PDF File Upload Pipeline (`SourcesConsole.tsx`)**:
    - Completely removed all simulation shortcut cards, tabs, and fake buttons ("1-Click Practice Papers", "Instant 1-Click Ingestion").
    - Removed rigid dropdown selectors (`Junior College`, `Exam Year`, `Subject`, `Paper Number`) to support practice papers and compilation sets drawing from several schools (e.g., `EJC + DHS 2022`).
    - Implemented **Dual File Dropzones**:
      - **Dropzone 1**: Question Paper PDF (`selectedQpFile`, required).
      - **Dropzone 2**: Answer Key / Solutions PDF (`selectedSolFile`, optional/recommended).
      - **Custom Title**: Optional override field, auto-detected from the document header if left empty.
  - **Production Dynamic Extraction Pipeline (`scripts/extract_pdf_worker.py` & `route.ts`)**:
    - Removed hardcoded static package shortcuts so that **every uploaded PDF is dynamically parsed and verified** by the production worker.
    - **Bold Font Cambridge Marker Extraction**: Uses PyMuPDF dictionary spans to detect authentic Cambridge question numbering (`re.match(r'^\d+$', text)`, margin `x0 < 70`, bold font, and sequential ordering 1..13), completely eliminating false matches from superscripts (e.g. `x^2`) or equation constants.
    - **Answer Key Exclusion**: Automatically detects the trailing `Answers` summary table (e.g. `\nAnswers\n`) and stops question ingestion at that boundary to prevent duplicate question creation.
    - **Composite School Detection**: Scans title headers and covers against all 16 Singapore Junior Colleges, detecting single-school and composite sets (e.g. `Promo Practise Paper 4` auto-detected as `EJC + DHS 2022`).
    - **1:1 Marking Scheme Synchronization**: Sequentially parses the Solutions PDF and pairs every question 1:1 with its step-by-step marking scheme solution.
  - **Cryptographic Hashing & Multi-Signal Deduplication**:
    - SHA-256 source hashing (`sourceHash`) enforces strict upload idempotency and rejects duplicate re-uploads with HTTP 409 Conflict.
    - Normalized text hashing (`textHash`) and diagram perceptual hashing (`visualHash`).
  - **Quality Gates & Comprehensive Verification**:
    - **Fallow Dead-Code Analysis**: **0 issues across 37 entry points** (`0.04s`).
    - **Automated Test Suite**: **25/25 passing unit & e2e tests** (~220ms).
    - **Production Build**: Turbopack compiled all 14 Next.js routes in ~470ms with zero errors.
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
| **Extraction Worker** | `scripts/extract_pdf_worker.py` | Clean & Tested | Production PyMuPDF worker with bold font Cambridge question detection, sequential solution alignment, and trailing answer table suppression |
| **Ingestion Script** | `scripts/ingest_paper.ts` | Clean & Tested | Headless CLI batch ingestion tool (`npm run ingest --all` or `--paper 3` / `--paper 4`) |
| **Ingestion Test Suite** | `tests/ingestion.test.mjs` | Passing (3/3) | Verifies package integrity, clean slate ingestion, 1:1 answer sync, SHA-256 duplicate rejection, and visual diagram hashing |
| **Pipeline E2E Test** | `tests/pipeline.e2e.test.mjs` | Passing (22/22) | Full pipeline integration test: Ingestion -> Extraction -> Classification -> Deduplication -> Manifest -> Cambridge PDF Assembly |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.04s) | Automated dead-code, unused export, and unreferenced dependency scanner integrated directly into `npm test` |

---

## 3. Real Examination Paper Packages

### 1. Jurong Pioneer JC (JPJC 2022 H2 Math Promo Paper 1)
- **Source File**: `Promo Practise Paper 3.pdf` (6 pages) + `Promo Practise Paper 3 Solutions.pdf` (14 pages)
- **Detected Attribution**: `JPJC` 2022 H2 Mathematics Promo Paper 1
- **Questions**: 13 questions (Q1–Q13)
- **Topics**: Inequalities, Differentiation & tangents, Integration by substitution, Curve sketching & stationary points, V-shaped water tank rate of change, AP/GP series convergence, Standard integrals & arcsin, Curve transformations, Rectangle inscribed in triangle optimization, 3D vectors & plane line intersection, Parametric curve area, Inverse functions & domain, 3D planes acute angle & projection.

### 2. Eunoia JC + Dunman High (EJC + DHS 2022 H2 Math Promo Paper 2)
- **Source File**: `Promo Practise Paper 4.pdf` (6 pages) + `Promo Practise Paper 4 Solutions.pdf` (14 pages)
- **Detected Attribution**: `EJC + DHS` 2022 H2 Mathematics Promo Paper 2
- **Questions**: 13 questions (Q1–Q13)
- **Topics**: Polynomial remainder theorem, Reciprocal curve & derivatives, Symmetric hyperbola asymptotes, Parametric normal & tangent, Logarithmic inequalities, Absolute value transformations, Standard integrals, Perpendicular vector dot products, Geometric sequence log AP, Tent model area optimization, Composite function domain existence, Strictly increasing polynomial root, Drone 3D flight path & cliff face plane.

---

## 4. How to Test Production Upload

```bash
# 1. Start the web application
npm run dev

# 2. Open Sources Console in browser:
# http://localhost:3000/sources
# - Click "Upload Examination Papers".
# - In Dropzone 1, select: "Promo Practise Paper 3.pdf" (or drag and drop)
# - In Dropzone 2, select: "Promo Practise Paper 3 Solutions.pdf" (or drag and drop)
# - Click "Upload & Ingest Paper & Solutions".
# - Observe real-time extraction logs:
#   [✓] Uploading Question Paper & Solutions PDF...
#   [✓] Auto-detecting Junior Colleges, syllabus, and examination metadata...
#   [✓] Computing cryptographic SHA-256 source hash for idempotency...
#   [✓] Extracting question stems, marks, and vector diagram boundaries...
#   [✓] Extracting and synchronizing 1:1 step-by-step marking scheme answers...
#   [✓] Committing to persistent Question Bank and Review Queue...
# - Table updates immediately with JPJC (13 questions, 113 marks).
# - Try uploading the same file again to verify SHA-256 duplicate rejection (HTTP 409).

# 3. Upload Multi-School Practice Paper 4:
# - Select "Promo Practise Paper 4.pdf" and "Promo Practise Paper 4 Solutions.pdf"
# - Ingest and verify composite attribution "EJC + DHS".

# 4. View Ingested Questions in Question Bank:
# http://localhost:3000/questions

# 5. Generate Cambridge A4 Student Worksheet & Answer Key:
# http://localhost:3000/

# 6. Run Quality Gates:
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
