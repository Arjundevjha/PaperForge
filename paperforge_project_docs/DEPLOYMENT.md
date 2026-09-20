# PaperForge — Deployment

## 1. Services

Production can be split into:

```text
web
api
worker
postgres
redis
object storage
```

The web and API may initially be deployed together if the framework architecture allows it.

## 2. Docker

Provide separate Docker targets for:
- web;
- worker.

Do not process heavy PDFs inside the web container request lifecycle.

## 3. Database

PostgreSQL should be backed up regularly.

Migrations must be version-controlled.

Never manually modify production schema without a corresponding migration.

## 4. Object Storage

Store:
- immutable source PDFs;
- generated worksheet PDFs;
- generated answer-key PDFs;
- optional extracted assets.

Use non-guessable storage keys.

## 5. Worker Scaling

Workers should be independently scalable.

PDF-heavy workloads should not affect frontend responsiveness.

## 6. Scheduled Ingestion

Run a scheduled job approximately every 90 days initially.

Make the interval configurable.

The job should be idempotent.

## 7. Monitoring

Monitor:
- worker failures;
- queue depth;
- processing duration;
- storage usage;
- database health;
- failed source ingestion;
- review queue growth.

## 8. Backups

Back up:
- PostgreSQL;
- source PDFs;
- generated published PDFs.

Generated PDFs can be regenerated from immutable source files and manifests, but retaining published artifacts is still recommended.
