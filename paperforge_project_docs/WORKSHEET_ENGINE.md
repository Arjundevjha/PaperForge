# PaperForge — Worksheet Engine

## 1. Purpose

Automatically maintain chapter-based worksheets from the question bank.

Teachers do not manually create worksheets.

## 2. Internal Configuration

Example:

```json
{
  "questionsPerWorksheet": 40,
  "regenerationPolicy": "affected-chapters"
}
```

This is system configuration, not a normal teacher-facing control.

## 3. Selection

Candidate questions must satisfy:
- subject;
- syllabus version;
- chapter/subtopic;
- published status;
- not an exact duplicate;
- valid source region;
- valid answer match where required.

## 4. Distribution

The engine should avoid:
- repeatedly selecting the same source paper;
- excessive repetition;
- duplicate variants unless intentionally retained;
- incomplete questions.

Distribution rules should be deterministic where possible.

## 5. Manifest

Before PDF generation, create a frozen manifest:

```json
{
  "worksheetId": 421,
  "version": 12,
  "questions": [
    "q_1829",
    "q_731",
    "q_1920"
  ]
}
```

The manifest is the source of truth for both PDFs.

## 6. PDF Generation

```text
Manifest
 ↓
Load question regions
 ↓
Assemble question PDF
 ↓
Load corresponding answers
 ↓
Assemble answer PDF
 ↓
Validate counts/order
 ↓
Publish version
```

## 7. Regeneration

If new questions affect Organic Chemistry:

```text
New questions
 ↓
Identify affected chapter
 ↓
Mark relevant worksheet versions stale
 ↓
Generate new versions
```

Unrelated worksheets should not be regenerated.

## 8. Versioning

Never overwrite a published worksheet.

Example:

```text
Organic Chemistry — Worksheet 04
v1
v2
v3
```

The current version is a pointer to the latest published version.

## 9. Validation

Before publishing:

```text
question count == manifest count
answer count == question count
question order == answer order
every question has provenance
every answer has provenance
all regions exist
```

Failure prevents publication.
