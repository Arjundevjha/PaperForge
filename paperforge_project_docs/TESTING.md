# PaperForge — Testing Strategy

## 1. Testing Layers

```text
Unit
 ↓
Integration
 ↓
Pipeline
 ↓
PDF visual regression
 ↓
End-to-end
```

## 2. Unit Tests

Test:
- question-number parsing;
- hierarchy construction;
- text normalization;
- hashing;
- similarity;
- syllabus mapping;
- worksheet selection;
- provenance generation.

## 3. PDF Tests

Create fixtures containing:
- single-page questions;
- multi-page questions;
- diagrams;
- tables;
- equations;
- columns;
- nested question numbering;
- scanned pages.

## 4. Golden PDF Tests

Maintain expected output PDFs for representative source pages.

Compare:
- page count;
- extracted text;
- dimensions;
- image presence;
- visual rendering where required.

## 5. Integration Tests

Test:

```text
source
→ parsing
→ questions
→ answers
→ classification
→ dedup
→ worksheet
```

## 6. Invariants

The following must always hold:

```text
published worksheet question count == manifest count

published answer count == question count

every worksheet question has provenance

every answer references a worksheet question

source hashes are unique

published worksheet versions are immutable
```

## 7. End-to-End Demo Fixture

The first full pipeline fixture should contain:

- one source question paper;
- one answer key;
- at least one multi-page question;
- at least one diagram;
- at least one sub-question;
- at least one duplicate/near-duplicate test case.
