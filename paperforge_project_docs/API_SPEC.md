# PaperForge — API Specification

## 1. Sources

### POST /api/sources

Create/register a source for ingestion.

### GET /api/sources

List sources.

### GET /api/sources/:id

Get source details and processing status.

### POST /api/sources/:id/reprocess

Queue reprocessing.

## 2. Questions

### GET /api/questions

Filters:
- subject;
- chapter;
- subtopic;
- source;
- status.

No difficulty filter.

### GET /api/questions/:id

Return question metadata, provenance, regions, classification, and answer status.

### PATCH /api/questions/:id

Admin/reviewer correction.

## 3. Worksheets

### GET /api/worksheets

List automatically maintained worksheets.

### GET /api/worksheets/:id

Return worksheet metadata and current version.

### GET /api/worksheets/:id/preview

Return preview information.

### GET /api/worksheets/:id/questions

Return/download generated question PDF.

### GET /api/worksheets/:id/answers

Return/download answer-key PDF.

## 4. Review

### GET /api/review

List review queue.

### GET /api/review/:id

Get review item.

### PATCH /api/review/:id

Submit review decision.

## 5. Syllabus

### GET /api/syllabus

List syllabus versions.

### GET /api/syllabus/:id

Return chapters and subtopics.

## 6. System

### GET /api/system/status

Return:
- worker status;
- source sync status;
- queue health;
- last successful processing run.

## 7. API Principles

- Validate all input.
- Authenticate protected routes.
- Authorise by role.
- Rate-limit administrative operations.
- Never expose storage credentials.
- Use stable error codes.
- Return job IDs for asynchronous work.
