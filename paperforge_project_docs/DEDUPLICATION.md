# PaperForge — Deduplication

## 1. Objective

Identify duplicate questions without incorrectly deleting legitimate variants.

## 2. Fingerprints

Use multiple signals.

### Source hash

SHA-256 of the complete source PDF.

Prevents duplicate ingestion of the same document.

### Text hash

Normalize:
- Unicode;
- whitespace;
- line breaks;
- casing where appropriate.

Then SHA-256 the result.

### Visual hash

Generate perceptual hashes for relevant diagrams/images.

Possible algorithms:
- pHash;
- dHash;
- wHash.

## 3. Why Visual Hash Is Not Enough

The same diagram may appear in different questions with different:
- values;
- labels;
- wording;
- requested calculations.

Therefore visual similarity alone must never define a duplicate.

## 4. Composite Comparison

Consider:

```text
text similarity
+
visual similarity
+
question structure
+
marks
+
table/diagram structure
```

## 5. Outcomes

```text
EXACT_DUPLICATE
LIKELY_DUPLICATE
POSSIBLE_VARIANT
UNIQUE
```

## 6. Exact Duplicate

Example:

```text
Text:       100%
Visual:     identical
Structure:  identical
```

Can be automatically excluded from new worksheet selection.

## 7. Possible Variant

Example:

```text
Same diagram
Same general wording
Different numerical values
```

Keep the question.

Do not automatically delete it.

## 8. Review Queue

Borderline cases should enter a review queue.

Store:
- comparison question IDs;
- similarity values;
- relevant hashes;
- decision;
- reviewer;
- timestamp.

## 9. Future Extension

Semantic embeddings can be added later for difficult near-duplicate cases.

Do not make embeddings a prerequisite for the first version.
