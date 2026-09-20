# PaperForge — Product Requirements Document

## 1. Product Overview

PaperForge is an automated question-bank and worksheet-generation platform for tuition teachers working with authorised A-Level examination and practice-paper sources.

The system ingests source papers and corresponding answer keys, extracts individual questions, classifies them against a configured syllabus, detects duplicates/variants, and automatically maintains chapter-based worksheets.

Teachers primarily browse, review, preview, and download content. They do not manually construct worksheets.

## 2. Problem

A large collection of examination papers contains valuable question-level practice material, but manually:
- locating questions by syllabus topic,
- copying questions into worksheets,
- maintaining answer keys,
- removing duplicates,
- tracking provenance, and
- updating worksheets when new papers appear

is slow and error-prone.

PaperForge automates this workflow while preserving the original PDF content and exact source provenance.

## 3. Goals

### Primary goals

1. Ingest authorised source PDFs.
2. Extract individual questions and answer-key entries.
3. Preserve original text, diagrams, equations, tables, and formatting where possible.
4. Classify questions by subject, chapter, and subtopic.
5. Detect exact duplicates and likely variants.
6. Maintain automatically generated chapter worksheets.
7. Generate a matching answer-key PDF from the exact worksheet question set.
8. Preserve exact provenance for every question.
9. Support scheduled source updates.
10. Provide a teacher-friendly review workflow for uncertain extractions/classifications.

### Non-goals

- Difficulty ratings.
- Teacher-configurable worksheet question counts.
- Manual worksheet construction as the primary workflow.
- Recreating every question from OCR/rasterised text when the source PDF can be preserved.
- Automatically inventing answers where an official answer key exists.
- Allowing an AI model to invent syllabus categories.

## 4. Users

### Teacher

Can:
- browse the question bank;
- inspect individual questions;
- review automatically classified questions;
- browse automatically maintained worksheets;
- preview worksheets;
- download question PDFs;
- download answer-key PDFs;
- inspect source provenance.

### Administrator

Can additionally:
- ingest/reprocess sources;
- manage syllabus versions;
- trigger synchronisation;
- configure system-level worksheet rules;
- manage review queues;
- inspect audit logs;
- manage users and permissions.

## 5. Core User Flow

```text
Source discovery
    ↓
Download
    ↓
Validate
    ↓
Extract PDF structure
    ↓
Segment questions
    ↓
Match answer keys
    ↓
Classify
    ↓
Deduplicate
    ↓
Review uncertain items
    ↓
Update question bank
    ↓
Regenerate affected worksheets
    ↓
Publish
```

## 6. Provenance

Every question must retain an exact source citation.

Example:

`[RI 2024 PRELIM P2 Q7(b)(ii)]`

The provenance should identify:
- school/source;
- year;
- paper type;
- paper number;
- question number;
- source document ID.

## 7. Worksheets

Worksheets are automatically maintained by the system.

A worksheet is defined by a frozen manifest of question IDs:

```json
{
  "worksheet_id": 421,
  "version": 12,
  "questions": [1829, 731, 1920, 827, 991]
}
```

The system-level configuration determines the target number of questions per worksheet. Teachers do not configure this through the normal UI.

Each worksheet has:
- subject;
- chapter;
- worksheet number;
- question count;
- version;
- last updated timestamp;
- source coverage;
- publication status.

## 8. Answer Keys

The answer key must be generated from the exact worksheet manifest.

If a worksheet contains:

`[RI 2024 PRELIM P2 Q7(b)(ii)]`

then the corresponding answer entry must reference the same source question.

Official mark schemes should be preferred over AI-generated answers.

## 9. Automatic Updates

The system should support a configurable scheduled ingestion process.

Initial target:

`~90 days`

The interval should be configurable because source publication frequency may change.

When new material arrives:
1. identify new files;
2. hash them;
3. skip previously ingested files;
4. process new files;
5. classify/deduplicate;
6. identify affected chapters;
7. regenerate only affected worksheet versions.

## 10. Success Criteria

The first production milestone is successful processing of one real source paper and answer key:

- correctly identify questions;
- preserve diagrams/equations/tables;
- correctly associate question hierarchy;
- correctly associate answers;
- produce provenance;
- detect duplicate questions;
- classify questions;
- generate a usable worksheet PDF;
- generate a matching answer-key PDF.

## 11. Product Principles

1. Source fidelity over visual reconstruction.
2. Deterministic processing before AI.
3. Never silently discard uncertain content.
4. Every generated item must be traceable.
5. Worksheet manifests are immutable once published.
6. Human review handles ambiguity.
7. AI assists classification/matching; it does not become the source of truth.
