# PaperForge — Session Handoff Document

> **Status**: Deployed to Vercel Production (`https://paperforge-omega.vercel.app`), Published to GitHub (`Arjundevjha/PaperForge`), Zero Vulnerabilities & 31/31 Tests Passing  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Remote: `https://github.com/Arjundevjha/PaperForge.git`)  
> **Live Production Alias**: `https://paperforge-omega.vercel.app`  
> **Vercel Project**: `paperforge` (`arjundevjhas-projects`)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions and marking schemes, classifying against official Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Key Milestones Achieved in this Milestone**:
  1. **Vercel Production Deployment Operational**:
     - Monorepo configured with root `vercel.json` and Next.js `outputFileTracingRoot` in `apps/web/next.config.js`.
     - Successfully deployed to Vercel production: `https://paperforge-omega.vercel.app`.
     - Linked to GitHub repository: `https://github.com/Arjundevjha/PaperForge`.
  2. **Zero-Config Serverless Bootstrap Engine**:
     - Implemented `bootstrapCanonicalPapers(store)` in `@paperforge/db` (`real-papers.ts` & `store.ts`).
     - Ensures cold-start serverless containers automatically bootstrap Singapore JC examination papers (JPJC 2022 P1, EJC 2022 P2, 26 classified questions, 5 Cambridge worksheets) with 0 external database requirements.
     - Dual-mode architecture remains fully preserved: adding `NEXT_PUBLIC_SUPABASE_URL` and `DATABASE_URL` instantly connects to live PostgreSQL anytime.
  3. **Verified Live Endpoints & Cambridge Canvas**:
     - `GET /api/system/status`: HTTP 200 `OPERATIONAL`.
     - `GET /api/worksheets`: 5 verified worksheets (`WS-MATH-01` to `WS-MATH-05`).
     - `GET /api/questions`: 26 questions, 26 answers (1:1 sync).
     - `GET /api/sources`: 2 sources (`JPJC` and `EJC`).
     - `GET /api/worksheets/ws_math_01/questions`: HTTP 200 streaming Cambridge A4 PDF (`WS-MATH-01_Functions_and_Graphs_Questions.pdf`).
     - `GET /api/worksheets/ws_math_01/answers`: HTTP 200 streaming Cambridge A4 PDF (`WS-MATH-01_Functions_and_Graphs_AnswerKey.pdf`).
  4. **Live Browser Verification via `agent-browser`**:
     - Verified all 5 core routes on `https://paperforge-omega.vercel.app`:
       - **Teacher Hub (`/`)**: Authentic Cambridge A4 canvas with candidate headers, syllabus badges, and 10 questions for Functions & Graphs (69 marks).
       - **Question Bank (`/questions`)**: 26/26 questions, SEAB H2 Math 9758 chapter filters, Cambridge stem & mark scheme inspector.
       - **Telemetry Dashboard (`/dashboard`)**: 2 source papers, 26 questions, 5 worksheets published, 0 pending review.
       - **Review Queue (`/review`)**: Pristine zero-pending state (`Review Queue Clear`).
       - **Sources & Ingestion (`/sources`)**: JPJC and EJC papers listed as `READY`.
       - **Syllabus Explorer (`/syllabus`)**: Authoritative Singapore SEAB H2 Math 9758 taxonomy.
  5. **Automated Tests & Quality Gates**:
     - **Fallow Dead-Code Scan**: **0 issues found** across 37 entry points (`0.03s`).
     - **Automated Test Suite**: **31/31 passing unit, e2e, and ingestion tests** (`0.26s`).
     - **Next.js Turbopack Build**: All 14 routes compiled with zero errors (`0.56s`).
     - **npm audit**: **0 vulnerabilities**.

---

## 2. Active Codebase File State

| Package / App | Path | Status | Key Highlights |
|---|---|---|---|
| **Root Config** | `vercel.json` | Active | Root Next.js monorepo workspace build command and output directory |
| **Shared** | `packages/shared/` | Clean & Tested | Authoritative SEAB syllabus taxonomy (H2 Math 9758, Chem 9476, Phys 9749, Bio 9744 across 16 JCs), Zod schemas, provenance builder |
| **Questions** | `packages/questions/` | Clean & Tested | Cambridge question marker parser, marks extractor, parent-child hierarchy tree builder |
| **Deduplication** | `packages/dedup/` | Clean & Tested | SHA-256 source hashing, normalized text fingerprinting, `computeVisualHash` for diagrams, token similarity |
| **Classification** | `packages/classification/` | Clean & Tested | Singapore-Cambridge syllabus matcher with strict subtopic scoping, confidence evaluator |
| **PDF Compiler** | `packages/pdf/` | Clean & Tested | Cambridge A4 layout compiler with 20mm margins, formal headers, fillable student boxes, serif problem stems |
| **Worksheet Engine** | `packages/worksheets/` | Clean & Tested | JC-balanced question selector, immutable `Object.freeze` manifest builder, synchronized Question & Answer Key PDF compiler |
| **Database** | `packages/db/` | Clean & Tested | `PaperForgeDataStore` with disk persistence, `bootstrapCanonicalPapers()`, authentic real-paper packages (`real-papers.ts`) |
| **Web Application** | `apps/web/` | Built & Deployed | Next.js App Router with Technical Examination Foundry design system, dynamic review badge, live REST API fetching, Cambridge A4 preview canvas |
| **Extraction Worker** | `scripts/extract_pdf_worker.py` | Clean & Tested | PyMuPDF worker with line-by-line bounding box clipping, symbol cleanup, question boundary guard |
| **Pipeline E2E Test** | `tests/pipeline.e2e.test.mjs` | Passing (1/1) | Full pipeline integration test with isolated `PaperForgeDataStore` |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.03s) | Automated dead-code, unused export, and unreferenced dependency scanner |

---

## 3. Official Worksheets in Live Production

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
8. **Client-Server State Separation**: Client components consume backend REST endpoints; backend endpoints reload state dynamically.
9. **Zero-Config Serverless Readiness**: Runs with full canonical data out-of-the-box on serverless cloud platforms (Vercel) without external database blockers.
