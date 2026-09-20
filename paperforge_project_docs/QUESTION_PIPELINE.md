# PaperForge — Question Processing Pipeline

## 1. Pipeline

```text
Source PDF
 ↓
Metadata
 ↓
Text extraction
 ↓
Question marker detection
 ↓
Hierarchy construction
 ↓
Region detection
 ↓
Question object creation
 ↓
Answer matching
 ↓
Syllabus classification
 ↓
Deduplication
 ↓
Review
 ↓
Publish
```

## 2. Question Identity

A question's database ID is independent of its human-readable provenance.

Example:

```text
ID: q_01J...
Provenance:
[RI 2024 PRELIM P2 Q7(b)(ii)]
```

## 3. Parent/Child Questions

Store parent relationships.

Example:

```text
7
7(a)
7(b)
7(b)(i)
7(b)(ii)
```

This allows the system to preserve the original hierarchy.

## 4. Question Completeness

A question should not be published unless all required regions have been associated.

Potential missing content:
- diagram;
- table;
- graph;
- continuation page;
- instruction text.

## 5. Marks

Marks should be extracted when reliably available.

Marks are metadata only.

They must not be used to create a difficulty rating.

## 6. Classification

Classification should map only to a configured syllabus.

```text
Subject
 └── Chapter
      └── Subtopic
```

Never allow the classifier to invent new taxonomy nodes.

## 7. Confidence

Store confidence for uncertain automated decisions.

Example:

```json
{
  "classificationConfidence": 0.91
}
```

Low-confidence items enter review.

## 8. Review

Review issues may include:
- ambiguous question boundary;
- missing diagram;
- unmatched answer;
- uncertain syllabus classification;
- possible duplicate.
