# PaperForge — PDF Pipeline

## 1. Objective

Extract question-level content from source PDFs while preserving the original PDF's visual fidelity.

Priority:

```text
Vector/text/embedded source content
        >
OCR reconstruction
```

Do not rasterise a question unless necessary.

## 2. Pipeline

```text
PDF
 ↓
Validate
 ↓
Read page structure
 ↓
Extract text + coordinates
 ↓
Extract images/drawings
 ↓
Detect question markers
 ↓
Build question hierarchy
 ↓
Calculate regions
 ↓
Persist regions
 ↓
Render test extraction
```

## 3. PDF Validation

Check:
- MIME type;
- file signature;
- page count;
- file size;
- encryption/password status;
- malformed pages;
- supported PDF version.

Never trust a filename extension.

## 4. Text Extraction

Use `pdfjs-dist` to inspect text items and their coordinates.

Each text item should retain:
- text;
- page;
- x/y coordinates;
- width/height;
- font information where available.

## 5. Question Detection

Support common structures:

```text
1.
2.
7(a)
7(b)
7(b)(i)
7(b)(ii)
```

Build a hierarchy rather than treating every marker as an independent flat question.

Example:

```text
7
├── 7(a)
├── 7(b)
│   ├── 7(b)(i)
│   └── 7(b)(ii)
└── 7(c)
```

## 6. Regions

A question may contain:
- text;
- diagrams;
- tables;
- graphs;
- equations;
- multiple pages.

Therefore a question stores an ordered array of regions.

```json
{
  "regions": [
    {"page": 7, "bbox": [60, 140, 530, 690]},
    {"page": 8, "bbox": [60, 70, 530, 310]}
  ]
}
```

## 7. Boundary Detection

Question boundaries should be inferred from:
- question markers;
- vertical position;
- text blocks;
- indentation;
- continuation across pages;
- answer lines;
- neighbouring question markers.

Use conservative boundaries.

When uncertain, create a review item rather than silently cropping content.

## 8. PDF Assembly

The generated worksheet should retain source quality.

The first implementation should prove that:
- chemical structures remain correct;
- mathematical notation remains readable;
- graphs/tables remain intact;
- multi-page questions remain ordered;
- page breaks are sensible.

## 9. Prototype Requirement

Before implementing the entire system, build:

```text
one source PDF
→ detect 5 questions
→ extract their regions
→ create a new PDF
→ visually compare against source
```

This is the first technical milestone.

## 10. OCR

OCR is a fallback for scanned/image-only pages.

OCR output should never automatically replace source PDF content when the original vector/text content is usable.
