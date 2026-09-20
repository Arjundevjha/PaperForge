# PaperForge — Data Model

## 1. Sources

```text
sources
- id
- filename
- school
- year
- subject
- paper_type
- paper_number
- source_hash
- storage_key
- status
- created_at
- updated_at
```

`source_hash` is a SHA-256 hash of the original file.

## 2. Questions

```text
questions
- id
- source_id
- question_number
- parent_question_id
- subject
- chapter
- subtopic
- syllabus_version_id
- text_content
- marks
- text_hash
- visual_hash
- status
- created_at
- updated_at
```

## 3. Question Regions

Use a separate table rather than forcing a question into one page/bounding box.

```text
question_regions
- id
- question_id
- page_number
- x0
- y0
- x1
- y1
- region_order
```

This supports questions spanning multiple pages.

## 4. Answers

```text
answers
- id
- source_id
- question_number
- answer_content
- answer_hash
- status
```

## 5. Answer Regions

```text
answer_regions
- id
- answer_id
- page_number
- x0
- y0
- x1
- y1
- region_order
```

## 6. Worksheets

```text
worksheets
- id
- subject
- chapter
- syllabus_version_id
- worksheet_number
- version
- question_count
- status
- generated_at
- updated_at
```

## 7. Worksheet Questions

```text
worksheet_questions
- worksheet_id
- question_id
- position
```

This table is the authoritative worksheet manifest.

## 8. Syllabus

```text
syllabus_versions
- id
- subject
- code
- version
- effective_from
- effective_to
```

```text
syllabus_topics
- id
- syllabus_version_id
- parent_id
- name
- slug
```

Topics should form a tree.

## 9. Review Queue

```text
review_items
- id
- entity_type
- entity_id
- issue_type
- confidence
- details
- status
- reviewed_by
- reviewed_at
```

## 10. Audit Log

```text
audit_logs
- id
- actor_id
- action
- entity_type
- entity_id
- old_value
- new_value
- created_at
```

## 11. Versioning

Published worksheet versions must remain reproducible.

Never overwrite an already published worksheet manifest.

