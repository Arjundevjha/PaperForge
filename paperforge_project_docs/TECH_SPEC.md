# PaperForge — Technical Specification

## 1. Runtime

Use TypeScript in strict mode.

Recommended:
- Node.js LTS
- TypeScript strict mode
- ESLint
- Prettier
- pnpm workspaces

## 2. Core Dependencies

Expected core packages:

```text
next
typescript
drizzle-orm
postgres
bullmq
ioredis
pdfjs-dist
pdf-lib
sharp
zod
```

Additional packages may be introduced after the PDF proof-of-concept.

## 3. Environment Variables

Example:

```env
DATABASE_URL=
REDIS_URL=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
AI_PROVIDER_API_KEY=
UPDATE_INTERVAL_DAYS=90
```

Secrets must never be committed.

## 4. Type Boundaries

Shared domain types should live in a common package.

Example:

```ts
type QuestionRegion = {
  page: number;
  bbox: [number, number, number, number];
};

type Question = {
  id: string;
  sourceId: string;
  questionNumber: string;
  regions: QuestionRegion[];
  text: string | null;
  subject: string;
  chapter: string | null;
  subtopic: string | null;
};
```

## 5. Validation

All external input should be validated using Zod or equivalent runtime schemas.

Validate:
- API request bodies;
- uploaded metadata;
- job payloads;
- syllabus files;
- model outputs;
- source metadata.

## 6. AI Boundaries

AI may assist with:
- syllabus classification;
- ambiguous question segmentation;
- ambiguous answer matching;
- semantic duplicate detection.

AI must return structured output.

Example:

```json
{
  "chapter": "Carbonyl Compounds",
  "subtopic": "Aldehydes and Ketones",
  "confidence": 0.94,
  "reason": "..."
}
```

AI output must be validated and stored with model/version metadata.

## 7. No Silent AI Decisions

Low-confidence AI results should enter the review queue.

The system must not silently publish uncertain classifications.

## 8. Observability

Record:
- job execution;
- processing duration;
- failure stage;
- number of extracted questions;
- number of duplicates;
- number of review items;
- worksheet regeneration count.

