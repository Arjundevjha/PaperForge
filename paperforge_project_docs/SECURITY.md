# PaperForge — Security

## 1. Authentication

All teacher/admin functionality must require authentication.

## 2. Authorisation

Roles:

```text
TEACHER
ADMIN
```

Teacher:
- read question bank;
- read worksheets;
- download published content;
- review assigned items if enabled.

Admin:
- all teacher capabilities;
- source ingestion;
- reprocessing;
- syllabus management;
- system configuration;
- user management;
- audit access.

## 3. PDF Security

Source PDFs are untrusted input.

Processing must:
- enforce file-size limits;
- validate file signatures;
- reject unsupported files;
- run processing in isolated workers;
- impose CPU/time/memory limits where practical.

## 4. Secrets

Never expose:
- storage credentials;
- database credentials;
- AI API keys;
- source credentials

to the frontend.

## 5. Storage

Original PDFs should be immutable.

Generated PDFs should use separate storage keys.

## 6. Audit Logging

Record:
- source ingestion;
- reprocessing;
- question edits;
- classification overrides;
- duplicate decisions;
- worksheet publication;
- configuration changes.

## 7. AI Security

Treat model output as untrusted data.

Validate:
- schema;
- allowed syllabus IDs;
- confidence range;
- referenced question IDs.

Never execute model output as code.

## 8. Access Control

Every object-level request must verify that the authenticated user is allowed to access the requested resource.

Do not rely on obscurity of IDs.
