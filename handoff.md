# PaperForge — Session Handoff Document

> **Status**: Holy Grail A-Level H2 Mathematics Scraper Active, 808 Exam Papers & Answer Keys Downloaded into `./papers/h2_mathematics/` (867 MB, 279 Auto-Paired Sets), Standalone Bulk Ingestion Engine (`@paperforge/ingestion`) Active, Pluggable Storage Abstraction Layer (`@paperforge/storage`), Live Supabase Storage Bucket `paperforge` Connected & Verified, 37/37 Passing Tests, 0 Fallow Issues, 0 Vulnerabilities  
> **Active Model**: Gemini 3  
> **Workspace**: `/Users/abc/Desktop/PaperForge`  
> **Git Branch**: `main` (Remote: `https://github.com/Arjundevjha/PaperForge.git`)  
> **Live Production Alias**: `https://paperforge-omega.vercel.app`  
> **Vercel Project**: `paperforge` (`arjundevjhas-projects`)  
> **Supabase Project**: `mavqeszmyxfdppckqprw.supabase.co` (Bucket: `paperforge`)

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions, ingesting official examination papers across 16 Singapore Junior Colleges, extracting questions and marking schemes, classifying against official Singapore-Cambridge syllabi, and generating verified student worksheets and matching answer keys in authentic Cambridge A4 formatting.
- **Key Milestones Achieved in this Milestone**:
  1. **Automated Holy Grail (grail.moe) H2 Mathematics Scraper (`scripts/scrape_holygrail_h2math.ts`)**:
     - Built a high-performance, resilient scraper and concurrent downloader in TypeScript (`npm run scrape:holygrail`).
     - Crawled Holy Grail's catalog across A-Level &rarr; H2 Mathematics (`https://grail.moe/notes/a-level/h2-mathematics`), discovering all 1,135 materials across all pages.
     - Filtered specifically for **Examination Papers and Answer Keys** (`Exam Papers`, `MYEs/CAs/Other Tests`, `TYS Answers`, `User Mock Papers`), cleanly filtering out topical lecture notes.
     - Implemented direct API streaming via `https://api.grail.moe/note/download/:id` with automatic 302 redirection handling to Amazon S3, exponential backoff retries, and `%PDF-` magic-byte validation.
     - Added resume/idempotency support to skip existing files.
     - Generated an audit `manifest.json` with metadata (`id`, `title`, `type`, `slug`, `filename`, `sizeBytes`, `downloadedAt`).
  2. **Live Execution & Full Collection Pull**:
     - Completed a 10-file test batch verification in **0.7s** (22.35 MB).
     - Executed full pull with 6 concurrent workers: downloaded **808 total exam papers & solution keys** in **42.8s** (total **867 MB**) into `./papers/h2_mathematics/`.
     - 0 failures, 100% download integrity.
  3. **PaperForge Bulk Ingestion Auto-Pairing Integration**:
     - Audited `./papers/h2_mathematics/` with PaperForge's bulk ingestion engine (`npm run ingest:bulk -- --dir ./papers/h2_mathematics --dry-run`).
     - Discovered **279 fully paired Question Paper &harr; Solution Key sets** across all Singapore Junior Colleges (MJC, NJC, NYJC, PJC, RI, RVHS, SAJC, SRJC, TJC, TPJC, VJC, YJC, EJC, ASRJC, JPJC, CJC).
  4. **Quality Gates & Tests**:
     - **Automated Test Suite**: **37/37 passing tests** (`0.28s`), including scraper classification and filtering unit tests (`tests/holygrail_scraper.test.mjs`).
     - **Fallow Dead-Code Scan**: **0 issues found** across 47 entry points (`0.04s`).
     - **npm audit**: **0 vulnerabilities**.

---

## 2. Active Codebase File State

| Package / Script | Path | Status | Key Highlights |
|---|---|---|---|
| **Holy Grail Scraper** | `scripts/scrape_holygrail_h2math.ts` | Active & Verified | Crawls Holy Grail catalog, filters papers/keys, concurrent streaming via download API |
| **Downloaded Papers** | `papers/h2_mathematics/` | 808 PDFs (867 MB) | Complete collection of H2 Math prelims, promo papers, and solutions + `manifest.json` |
| **Scraper Unit Test** | `tests/holygrail_scraper.test.mjs` | Active & Passing | Validates catalog parsing and paper/solution filtering logic |
| **Bulk Ingestion** | `packages/ingestion/` | Active & Tested | Standalone bulk scanner, auto-pairing engine, and concurrent worker pipeline |
| **Ingestion CLI** | `packages/ingestion/src/cli.ts` | Active & Tested | CLI entrypoint: `npm run ingest:bulk -- --dir <path> [--dry-run]` |
| **Pairing Engine** | `packages/ingestion/src/pairing.ts` | Active & Tested | Auto-pairs QPs and MSs, audits duplicates, detects orphaned answer keys |
| **Scanner Engine** | `packages/ingestion/src/scanner.ts` | Active & Tested | Delimiter-agnostic JC & Cambridge syllabus detection from filenames & headers |
| **Storage Package** | `packages/storage/` | Active & Tested | Pluggable `StorageProvider` abstraction with Supabase and Local implementations |
| **Next.js Web App** | `apps/web/` | Decoupled | Web application for teachers, reviews, worksheets, and syllabus explorer |
| **LaTeX Renderer** | `apps/web/src/components/ui/MathRenderer.tsx` | Active & Tested | KaTeX math renderer for inline & display math with error boundaries |
| **PDF Compiler** | `packages/pdf/src/compiler.ts` | Active & Tested | Cambridge A4 PDF compiler with automatic PNG diagram embedding & LaTeX sanitization |

---

## 3. How to Run the Tooling

```bash
# 1. Run the Holy Grail scraper (dry run to audit catalog without downloading)
npm run scrape:holygrail -- --dry-run

# 2. Run the Holy Grail scraper with custom output or limit
npm run scrape:holygrail -- --output ./papers/h2_mathematics --concurrency 6

# 3. Dry-run / Audit downloaded papers with PaperForge bulk pairing engine
npm run ingest:bulk -- --dir ./papers/h2_mathematics --dry-run

# 4. Run tests & fallow gate
npm test
```
