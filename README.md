# PaperForge 📝⚡
### Singapore-Cambridge GCE A-Level Question Bank & Worksheet Foundry

PaperForge is an automated question-bank indexing and worksheet-compilation platform built for Singapore Junior College tuition centers, teachers, and students. It ingests official examination papers across 16 Singapore Junior Colleges, segments individual question stems, pairs each question with its official step-by-step marking scheme, classifies items against official **SEAB (Singapore Examinations and Assessment Board)** syllabi, and generates verified practice worksheets in authentic Cambridge A4 print typography.

---

## ✨ Features

- **Nationwide Junior College Indexing**: Ingests and tags papers across 16 Singapore Junior Colleges (RI, HCI, NYJC, VJC, ACJC, EJC, NJC, TJC, DHS, RVHS, ASRJC, JPJC, TMJC, CJC, SAJC, YIJC).
- **Official SEAB Syllabus Alignment**: Full curriculum coverage mirroring official SEAB publications:
  - **H2 Mathematics (Syllabus 9758)**: Functions & Graphs, Sequences & Series (AP/GP), Vectors, Complex Numbers, Calculus (Differentiation & Integration), Probability & Statistics.
  - **H2 Chemistry (Syllabus 9476 / 9729)**, **H2 Physics (Syllabus 9749)**, **H2 Biology (Syllabus 9744)**.
- **Strict Chapter Scoping & Purity**: Practice worksheets are strictly scoped to requested chapters (e.g. Calculus worksheets contain only Differentiation and Integration techniques, never misplaced topics).
- **1:1 Question-to-Answer Synchronization**: Every question maintains an exact 1:1 pairing with its step-by-step marking scheme and academic citation (`[JPJC 2022 H2 Mathematics PROMO P1 Q1]`).
- **Deterministic Deduplication**: Multi-signal fingerprinting using cryptographic SHA-256 source hashing, normalized text similarity, and diagram visual hashing to detect duplicates while preserving legitimate numerical variants.
- **Cambridge A4 Canvas Simulation**: Live interactive A4 preview with 20mm margins, STIX Two Text serif math typography, student index boxes, and toggleable official marking schemes.
- **Human-in-the-Loop Review Queue**: Low-confidence extractions or duplicate candidates are automatically flagged for tutor verification.

---

## 🏛️ Monorepo Architecture

PaperForge is organized as an npm workspace monorepo:

```
PaperForge/
├── apps/
│   └── web/                    # Next.js App Router UI (Chassis, Canvas, REST APIs)
├── packages/
│   ├── shared/                 # Authoritative SEAB taxonomies, Zod schemas, provenance
│   ├── questions/              # Cambridge marker parser, marks extractor, hierarchy tree
│   ├── dedup/                  # SHA-256 hashing, normalized text token similarity, visual hash
│   ├── classification/         # SEAB syllabus keyword & heuristic classification engine
│   ├── pdf/                    # Cambridge A4 PDF compiler with pdf-lib & security validation
│   ├── worksheets/             # JC-balanced selection, immutable manifests, answer key sync
│   └── db/                     # DataStore repository with disk persistence & Drizzle ORM
├── scripts/
│   ├── extract_pdf_worker.py   # PyMuPDF line-level bounding box worker with boundary guards
│   └── ingest_paper.ts         # CLI tool for ingesting examination packages
└── tests/
    ├── ingestion.test.mjs      # Production exam ingestion & 1:1 invariant test suite
    └── pipeline.e2e.test.mjs   # Full end-to-end examination pipeline integration test
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (Node.js 20+ recommended)
- **Python**: 3.9+ with `PyMuPDF` (`pip install pymupdf`) for PDF extraction worker

### Installation

```bash
# Clone repository
git clone https://github.com/Arjundevjha/PaperForge.git
cd PaperForge

# Install monorepo dependencies
npm install
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example apps/web/.env.local
```

### Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the Teacher Resource Hub.

---

## 🧪 Quality Gates & Testing

PaperForge enforces strict quality gates across dead code, types, and automated testing:

```bash
# Run full test suite (Fallow Dead-Code Gate + 31 Unit/E2E Tests)
npm test

# Run Fallow dead-code analysis
npm run test:fallow

# Run Next.js production build
npm run build --workspace=@paperforge/web
```

---

## 🚢 Deployment

### 1. Vercel (Recommended for Next.js App)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Framework Preset: **Next.js**.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_APP_URL`: Your production domain
   - `ADMIN_DEFAULT_EMAIL`: `arjundevjha111@gmail.com`
   - `NEXT_PUBLIC_SUPABASE_URL` (optional, for Supabase DB)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional, for Supabase Auth)
5. Deploy.

### 2. Supabase PostgreSQL (Optional Persistence Layer)

To deploy the production relational schema to Supabase:

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migration script in Supabase SQL Editor:
   ```
   packages/db/supabase/migrations/20260920000000_supabase_auth_and_schema.sql
   ```
3. Set `DATABASE_URL` in your deployment environment.

---

## 🔒 Security & Access Control

- **Default Administrator**: Strictly restricted to `Arjun Dev Jha` (`arjundevjha111@gmail.com`).
- **Zero Secrets Committed**: All API keys and connection strings are managed through environment variables (`.env.local` is gitignored).
- **Audit Verification**: Clean `npm audit` with 0 known vulnerabilities.

---

## 📄 License

UNLICENSED — Proprietary & Confidential. Built for Singapore GCE A-Level educational delivery.
