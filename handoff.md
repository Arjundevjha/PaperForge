# PaperForge — Session Handoff Document

> **Status**: Planning & Architecture Phase (Pre-Execution Alignment)  
> **Date**: 2026-09-20  
> **Active Model**: Gemini 3 (Planning) -> Claude Opus 4.5 (Coding upon approval)  
> **Workspace**: `/Users/abc/Desktop/PaperForge`

---

## 1. Executive Summary

- **Project Vision**: PaperForge is an automated Singapore GCE A-Level question-bank and worksheet-generation platform for tuition teachers and educational institutions.
- **Completed Analysis**:
  - Conducted deep review of all 14 project documentation files in `paperforge_project_docs/` (`PRD.md`, `ARCHITECTURE.md`, `TECH_SPEC.md`, `DATA_MODEL.md`, `API_SPEC.md`, `PDF_PIPELINE.md`, `QUESTION_PIPELINE.md`, `DEDUPLICATION.md`, `WORKSHEET_ENGINE.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `ROADMAP.md`, `design.md`).
  - Interfaced with **Stitch MCP** to query project `projects/13550915914670889472` ("PaperForge: Automated A-Level Platform") and retrieved the "Technical Examination Foundry" design system, color palette, typography specifications, and screen structures:
    1. `PaperForge Dashboard`
    2. `Teacher Resource & Download Hub`
    3. `PaperForge Mark` (SVG logo vector extracted)
  - Environment diagnostics:
    - Node: `v26.8.2`
    - npm: `11.19.1`
    - Host system does not have standalone `docker`, `psql`, or `redis-cli` installed. To ensure 100% runnable, self-contained execution without breaking external dependencies, the system architecture will use TypeScript with `@electric-sql/pglite` / embedded PostgreSQL compatibility via Drizzle ORM, and an in-memory/BullMQ compatible queue abstraction.
- **Git State**:
  - The repository has not yet been initialized with git. Per user instructions, a local git repository will be initialized for intermediate commits; **NO remote repository will be created and NO code will ever be pushed to GitHub**.

---

## 2. Active Codebase File State

| Path | Status | Description |
|---|---|---|
| `paperforge_project_docs/` (14 files) | Existing / Clean | Full product, architectural, data model, and design specifications |
| `./handoff.md` | Created | Physical session handoff and continuity tracker |
| `implementation_plan.md` | Created (Artifact) | Comprehensive implementation plan for user review |
| `prompt_draft.md` | Created (Artifact) | Teamwork preview multi-agent prompt draft |

---

## 3. Key Technical & Architectural Decisions

1. **Design System ("Technical Examination Foundry")**:
   - Chassis: Dark mode (`#090e18`, `#0e131d`, `#171c26`, `#222938`) with hairline borders (`#263042`).
   - Accent: Brand Electric Cyan (`#00e5ff`) with glowing indicators (`rgba(0, 229, 255, 0.15)`).
   - Typography: `Inter` for digital UI narration, `JetBrains Mono` for metadata coordinates (`[RI 2025 H2 Chemistry Prelim P2 Q7(b)(ii)]`, `[4m]`, `9476/01`), and `STIX Two Text`/`Times New Roman` for authentic Cambridge exam serif text.
   - Cambridge A4 Canvas: Pure white paper viewport (`#ffffff`) with true carbon ink (`#111827`), official exam header boxes (`NAME:`, `CLASS:`), vector chemical/math formulas, and red dashed print boundary breaks (`PAGE BREAK (PRINT BOUNDARY)`).

2. **Full Monorepo Architecture**:
   - `apps/web`: Next.js App Router with Tailwind CSS, Lucide icons, KaTeX math typesetting, interactive split-pane Teacher Hub, PaperForge Dashboard, Question Bank Inspector, Review Queue, and System Status.
   - `packages/shared`: Shared domain models, Zod validation schemas, Singapore syllabus taxonomy definitions (H2 Chemistry 9476, H2 Physics 9749, H2 Biology 9744, H2 Math 9758 across all 16 Singapore Junior Colleges).
   - `packages/db`: Drizzle ORM schema with support for PostgreSQL (including PGlite embedded database for zero-config local testing and dev).
   - `packages/pdf`: PDF parsing (`pdfjs-dist`), PDF generation (`pdf-lib`), region extraction, and A4 print compiler.
   - `packages/questions`: Question detection, hierarchy parser, and provenance formatter.
   - `packages/dedup`: SHA-256 source hashing, normalized text fingerprinting, and composite duplicate classifier.
   - `packages/classification`: Syllabus mapping engine and confidence scoring.
   - `packages/worksheets`: Worksheet generator with frozen manifests, chapter-based distribution, and synchronized answer-key generation.

3. **Subagent Orchestration**:
   - Specialized subagents (`teamwork-supervisor`, `backend-reviewer`, `frontend-reviewer`, `security-scanner`, `test-runner`) will be engaged during verification and code review stages.

---

## 4. Immediate Next Steps

1. Present `implementation_plan.md` and `prompt_draft.md` to the user for formal approval.
2. Initialize local git repository (`git init`) and make the initial baseline commit.
3. Upon user approval, switch to physical coding phase (Claude Opus 4.5 Thinking).
4. Implement packages and web application in granular, verifiable stages with intermediate local commits.
5. Run Snyk Code Scan (`snyk_code_scan`) on newly created TypeScript code to guarantee security compliance.
6. Verify automated tests and component rendering.
