---
alwaysApply: true
always_on: true
description: Strict invariants for academic exam paper & answer key compilation in PaperForge
---

# PaperForge Examination & Solution Compilation Invariants

## 1. Text for Classification, Screenshots for Compilation
- **Textual scanning, OCR, and syllabus keyword extraction** MUST be used for classification, tagging, deduplication, and database search ONLY.
- **Compiled student worksheets, teacher answer keys, and print preview canvases** MUST render authentic high-resolution screenshots cropped directly from source PDFs.
- **NEVER re-render fragmented OCR/text streams** for mathematical equations, curves, or marking schemes into compiled PDFs. In Singapore JC / Cambridge A-Level math PDFs, mathematical glyphs are absolute-positioned; text extraction shatters them into fragmented single-character lines (`d\ny\nd\nx\n2\n/\n=`), producing unreadable documents with hundreds of inflated pages.
- **NEVER crop diagrams separately from question stems or solutions**. Always capture the unified question/solution working block to preserve authentic formatting and layout.

## 2. Answer Key & Solution Pairing
- **Strict Metadata Matching**: Pair Question Papers to Solution PDFs using strict multi-field metadata matching:
  - School abbreviation (RI, HCI, NYJC, VJC, ACJC, EJC, NJC, TJC, DHS, RVHS, ASRJC, JPJC, TMJC, CJC, SAJC, YIJC, MI, MJC, AJC, etc.)
  - Examination Year (2012–2026)
  - Paper number (`P1` vs `P2` / `Paper 1` vs `Paper 2`)
  - Exam type (Prelim, Promo, CT, Timed Practice)
  - **NEVER** rely on numeric ID proximity alone (e.g. `delta = -3`), which causes cross-school mispairings.
- **Bundled / Internal Solution Papers**: When a PDF contains both Question Paper and Solutions (or both Paper 1 and Paper 2), identify section boundary pages (`p1_start` vs `p2_start`) to prevent cross-paper leakage.

## 3. Monotonic Left-Margin Marker Parsing
- Restrict marker search coordinates to the active question margin: `35 < y0 < 720` and `x0 < 145`.
- Explicitly exclude running headers and page number footers (which often match `^\d+$` at `y > 720`).
- Enforce strict monotonicity: `page(Q_n) >= page(Q_{n-1})` and `y(Q_n) > y(Q_{n-1})` on the same page.

## 4. Multi-Slice Pagination & PDF Layout
- Solutions spanning multiple pages in the source PDF must be cleanly sliced into sequential images (`{qid}_1.png`, `{qid}_2.png`) and stitched into a composite `{qid}.png`.
- In `generateAnswerKeyPdf`, embed slices at full printable width (`CONTENT_WIDTH - 20`), triggering dynamic page breaks when remaining vertical space is insufficient.
- Suppress raw OCR text dumping whenever solution screenshots are present.
- If no screenshot exists (fallback), reflow and collapse short broken lines into readable paragraphs.

## 5. Interactive On-the-Fly Reclassification
- Never restrict syllabus reclassification to a separate review queue.
- Live preview canvases and inspection drawers must expose direct reclassification controls with optimistic UI updates, compendium auto-transfer, and mark recounting.

## 6. Cloud CDN Asset Distribution for Web Delivery
- **Decoupled Asset Architecture**: To maintain clean git repositories (< 15 KiB pushes) while supporting serverless web deployments (Vercel, Cloudflare, Netlify), raw image screenshot crops (`questions/`, `answers/`) MUST NOT be committed to Git.
- **Direct Cloud CDN Streaming**: Interactive web applications, student views, and Cambridge A4 print canvases MUST stream question and answer screenshots directly from the public Cloud Storage CDN (e.g. Supabase Storage `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/...`).
- **Zero Local Static Assumptions in Production**: Never assume `public/questions/*.png` exists in serverless runtime bundles. Always use centralized CDN URL resolvers (`getQuestionImageUrl`, `getAnswerImageUrl`) with local filesystem paths retained solely as a fallback for offline local development.

## 7. The Zero-Fallback Curation Invariant
- **No Silent Degradation to OCR Text**: A publication-grade compendium or curated worksheet MUST NEVER display raw OCR text dumps in place of examination questions or marking schemes.
- **Pre-Publication Audit**: Before publishing or freezing any worksheet manifest, audit every question ID against the asset store. Any question lacking verified, multi-slice visual solution crops (due to unsearchable scanned papers or missing mark schemes) MUST be curated out and replaced with an authentic banked question that has verified visual crops.

