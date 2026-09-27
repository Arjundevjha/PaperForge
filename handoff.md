# PaperForge — Session Handoff Document

> **Status**: Standalone Bulk Ingestion Engine (`@paperforge/ingestion`) Active, Pluggable Storage Abstraction Layer (`@paperforge/storage`), Live Supabase Storage Bucket `paperforge` Connected & Verified, All 20 High-Res Diagrams Synced to Cloud CDN, Ingestion Upload Pipeline Linked to Cloud Storage, 36/36 Passing Tests, 0 Fallow Issues, 0 Vulnerabilities  
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
  1. **Standalone Bulk Ingestion Engine (`packages/ingestion/`)**:
     - Built a standalone package completely decoupled from `apps/web`.
     - **Auto-Pairing Engine (`pairing.ts`)**: Automatically matches Question Papers with Answer Keys (`QP` $\longleftrightarrow$ `MS`) using signature heuristics, delimiter-agnostic JC detection, and normalized title distance.
     - **Fast File & Header Scanner (`scanner.ts`)**: Crawls folders or buckets, detecting all 16 Singapore JC codes/names, syllabus codes (`9758`, `9749`, `9729`, `9744`), years (`2015-2026`), and calculating SHA-256 hashes for idempotency.
     - **Concurrent Worker Pool (`worker-pool.ts`)**: Runs parallel extraction workers (default: 4 concurrent) with progress reporting.
     - **Standalone CLI (`packages/ingestion/src/cli.ts`)**: Runs via `npm run ingest:bulk -- --dir <path> [--dry-run] [--concurrency <N>]`.
     - **Live Verification**: Successfully bulk-ingested 2 complete sets (26 questions + 26 step-by-step marking schemes) in **1.13s** with zero errors.
  2. **Pluggable Storage Abstraction Layer (`@paperforge/storage`)**:
     - Built vendor-agnostic `StorageProvider` interface (`upload`, `download`, `exists`, `delete`, `list`, `getPublicUrl`, `getSignedUrl`).
     - Implemented `SupabaseStorageProvider` communicating directly with Supabase Storage via `@supabase/supabase-js` using administrative `SUPABASE_SERVICE_ROLE_KEY`.
     - Implemented `LocalStorageProvider` for zero-latency, offline unit testing without cloud dependencies.
     - Built `getStorageProvider()` factory supporting dynamic switching via `STORAGE_DRIVER` (`supabase` vs `local` vs `s3`/`r2`).
  3. **Live Supabase Storage Bucket Integration (`paperforge`)**:
     - Configured and verified live bucket `paperforge` under project `mavqeszmyxfdppckqprw.supabase.co`.
     - Tested bidirectional upload and download authentication with Service Role permissions.
     - Synced all 20 high-resolution diagram PNG assets to `paperforge/diagrams/` with live public CDN delivery URLs.
     - Bulk-ingested raw papers uploaded to `paperforge/incoming/`.
  4. **Quality Gates & Tests**:
     - **Automated Test Suite**: **36/36 passing tests** (`0.33s`), covering pairing, scanning, worker pool, and storage lifecycles.
     - **Fallow Dead-Code Scan**: **0 issues found** across 45 entry points (`0.04s`).
     - **Next.js Turbopack Build**: All 15 routes compiled with 0 errors and 0 warnings (`0.21s`).
     - **npm audit**: **0 vulnerabilities**.

---

## 2. Active Codebase File State

| Package / App | Path | Status | Key Highlights |
|---|---|---|---|
| **Bulk Ingestion** | `packages/ingestion/` | Active & Tested | Standalone bulk scanner, auto-pairing engine, and concurrent worker pipeline |
| **Ingestion CLI** | `packages/ingestion/src/cli.ts` | Active & Tested | CLI entrypoint: `npm run ingest:bulk -- --dir <path> [--dry-run]` |
| **Pairing Engine** | `packages/ingestion/src/pairing.ts` | Active & Tested | Auto-pairs QPs and MSs, audits duplicates, detects orphaned answer keys |
| **Scanner Engine** | `packages/ingestion/src/scanner.ts` | Active & Tested | Delimiter-agnostic JC & Cambridge syllabus detection from filenames & headers |
| **Storage Package** | `packages/storage/` | Active & Tested | Pluggable `StorageProvider` abstraction with Supabase and Local implementations |
| **Storage CLI** | `scripts/storage_cli.ts` | Active & Tested | CLI tool for `storage:status`, `storage:sync-diagrams`, and directory listing |
| **Sources API** | `apps/web/src/app/api/sources/route.ts` | Active & Tested | Saves incoming PDFs to Supabase Storage before PyMuPDF extraction |
| **Next.js Web App** | `apps/web/` | Decoupled | Web application for teachers, reviews, worksheets, and syllabus explorer |
| **LaTeX Renderer** | `apps/web/src/components/ui/MathRenderer.tsx` | Active & Tested | KaTeX math renderer for inline & display math with error boundaries |
| **PDF Compiler** | `packages/pdf/src/compiler.ts` | Active & Tested | Cambridge A4 PDF compiler with automatic PNG diagram embedding & LaTeX sanitization |
| **Database** | `packages/db/src/real-papers.ts` | Active & Tested | 26 authentic questions & verbatim marking schemes with LaTeX and diagram URLs |
| **Fallow Gate** | `.fallowrc.json` | 0 Issues (0.04s) | Zero dead code, unused exports, or unreferenced dependencies |

---

## 3. Storage Hierarchy in Live Supabase Bucket (`paperforge`)

```text
paperforge/
├── incoming/                               <-- Raw uploaded exam PDFs and solution booklets
│   └── 2022/
│       └── JPJC/
│           ├── JPJC_2022_P3_MS_b14e05eb.pdf
│           ├── JPJC_2022_P3_QP_1c52b62c.pdf
│           ├── JPJC_2022_P4_MS_beafa8f3.pdf
│           └── JPJC_2022_P4_QP_04e81aca.pdf
│
└── diagrams/                               <-- Extracted high-res vector diagram PNGs (CDN delivery)
    ├── questions/ (4 PNGs)
    └── answers/   (16 PNGs)
```

---

## 4. How to Run the Tooling

```bash
# 1. Dry run / Audit a directory of PDFs (scans & shows pairs without extracting)
npm run ingest:bulk -- --dir ./papers --dry-run

# 2. Bulk ingest with 4 concurrent workers
npm run ingest:bulk -- --dir ./papers --concurrency 4

# 3. Check Supabase Storage bucket status & objects
npm run storage:status

# 4. Sync diagram assets to Supabase Storage
npm run storage:sync-diagrams
```
