# PaperForge — Architecture

## 1. Architecture Overview

PaperForge is a TypeScript-first application consisting of a web application, API layer, background workers, database, object storage, and processing packages.

```text
                    ┌─────────────────┐
                    │   Next.js Web   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Node API / TS  │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          ┌─────────────┐         ┌─────────────┐
          │ PostgreSQL  │         │    Redis    │
          └─────────────┘         └──────┬──────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │ Node Worker │
                                  └──────┬──────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
             PDF Parser             Classifier              Dedup
                  │                      │                      │
                  └──────────────────────┼──────────────────────┘
                                         ▼
                                  Worksheet Engine
                                         │
                                         ▼
                                  Object Storage
```

## 2. Technology

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| API | Node.js + TypeScript |
| Workers | Node.js + TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle |
| Queue | BullMQ |
| Queue backend | Redis |
| PDF analysis | pdfjs-dist |
| PDF creation/manipulation | pdf-lib |
| Image processing | sharp |
| Validation | Zod |
| Hashing | Node crypto |
| Storage | S3-compatible object storage |
| Containerisation | Docker |

## 3. Architectural Principles

### Separate web requests from heavy processing

PDF ingestion and worksheet generation must happen in background jobs.

The web application should enqueue work rather than synchronously processing large documents.

### Preserve source documents

Original source PDFs are immutable.

All derived data references the original source.

### Deterministic-first processing

Use deterministic methods for:
- file hashing;
- metadata;
- question numbering;
- question hierarchy;
- source matching;
- answer matching;
- duplicate detection.

Use AI only where deterministic processing is insufficient.

## 4. Monorepo

```text
paperforge/
├── apps/
│   ├── web/
│   └── worker/
├── packages/
│   ├── api/
│   ├── db/
│   ├── pdf/
│   ├── questions/
│   ├── dedup/
│   ├── classification/
│   ├── worksheets/
│   └── shared/
├── syllabus/
├── docs/
└── tests/
```

## 5. Processing Lifecycle

Every source should progress through explicit states:

```text
DISCOVERED
DOWNLOADING
DOWNLOADED
VALIDATING
PARSING
SEGMENTING
MATCHING
CLASSIFYING
DEDUPLICATING
REVIEW_REQUIRED
READY
FAILED
```

Do not represent complex processing state using one uncontrolled boolean.

## 6. Failure Handling

Jobs must be retryable.

Failures should record:
- stage;
- error message;
- timestamp;
- retry count;
- source/document ID.

A failed source must not partially publish worksheets.

## 7. Idempotency

Repeated processing of the same source should not create duplicate database records.

Source SHA-256 is the primary ingestion idempotency key.

Question-level fingerprints provide secondary deduplication.
