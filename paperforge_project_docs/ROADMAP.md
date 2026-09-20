# PaperForge — Development Roadmap

## Phase 0 — PDF Proof of Concept

Goal:

```text
One real paper
→ identify questions
→ extract regions
→ generate new PDF
```

Success means diagrams, equations, tables, and formatting are acceptably preserved.

## Phase 1 — Question Pipeline

Implement:
- source metadata;
- PDF parsing;
- question detection;
- hierarchy;
- multi-page regions;
- provenance.

## Phase 2 — Database

Implement:
- PostgreSQL;
- Drizzle schema;
- source storage;
- question storage;
- region storage;
- answer storage.

## Phase 3 — Deduplication

Implement:
- source SHA-256;
- normalized text hashes;
- visual hashes;
- similarity classification;
- review queue.

## Phase 4 — Syllabus Classification

Implement:
- syllabus version files;
- deterministic mapping;
- AI-assisted classification;
- confidence;
- review workflow.

## Phase 5 — Answer Matching

Implement:
- answer-source ingestion;
- deterministic question-number matching;
- answer regions;
- unmatched-answer review.

## Phase 6 — Worksheet Engine

Implement:
- system-level worksheet configuration;
- candidate selection;
- distribution rules;
- frozen manifests;
- PDF assembly;
- answer-key assembly;
- versioning.

## Phase 7 — Existing UI Integration

Connect the completed backend to the existing UI.

Priority screens:
1. Dashboard
2. Question Bank
3. Worksheets
4. Question Inspector
5. Review Queue
6. Sources
7. Syllabus
8. System

## Phase 8 — Authentication and Permissions

Implement:
- teacher/admin roles;
- protected APIs;
- audit logs.

## Phase 9 — Automatic Updates

Implement:
- scheduled source checks;
- idempotent ingestion;
- affected-worksheet detection;
- automatic regeneration.

## Phase 10 — Production Hardening

Implement:
- observability;
- retries;
- failure recovery;
- backups;
- security hardening;
- load testing;
- PDF regression testing.

## First Demonstration Target

The first meaningful demo should be:

```text
1 source paper
+
1 answer key
↓
questions extracted
↓
questions classified
↓
duplicates detected
↓
worksheet generated
↓
matching answer key generated
↓
teacher previews/downloads both
```

Do not build the entire platform before this pipeline works end-to-end.
