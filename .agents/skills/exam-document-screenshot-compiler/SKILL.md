---
name: exam-document-screenshot-compiler
description: End-to-end pipeline and best practices for pairing examination papers with solutions, extracting authentic high-resolution question and marking scheme screenshots, and compiling print-ready Cambridge A4 PDFs in PaperForge.
---

# Academic Exam & Solution Document Compilation Engine

This skill documents the complete pipeline, architecture, and operational procedures for ingesting, pairing, cropping, and compiling Singapore-Cambridge GCE A-Level examination question papers and teacher answer keys.

---

## 1. Core Architectural Principle

> **Textual scanning & extraction is for classification, search, and indexing ONLY.**  
> **Direct high-resolution screenshot cropping is for document compilation, PDF generation, visual rendering, and print canvases.**

### Why Text-to-PDF Rendering Fails in Math Exams:
Mathematical PDF streams (fractions, radical signs, matrices, coordinate sketches) store equations as absolute-positioned glyphs. Decoders convert these into thousands of single-character lines (`d\ny\nd\nx\n2\n/\n=`).
Attempting to line-wrap and render these text streams creates hundreds of inflated, broken pages. Screenshots preserve authentic handwriting, graphs, and mark allocations with 100% fidelity.

---

## 2. Solution Document Resolution Algorithm

When pairing question papers to solution PDFs:

1. **Internal Bundled Solutions**:
   Check if the question paper itself contains a solution section at the back (> 8 pages with "Solutions" / "Marking Scheme" after page 4).
2. **Direct Replacement Patterns**:
   Apply regex replacements:
   - `_QP_` $\rightarrow$ `_Solutions_`
   - `_Question_paper_` $\rightarrow$ `_Solutions_(w_Markers_Comments)_`
   - `_Questions_` $\rightarrow$ `_Solutions_`
   - `_Qn_` $\rightarrow$ `_Soln_`
   - `_(QP)_` $\rightarrow$ `_(Soln)_`
3. **Strict Multi-Field Metadata Scoring**:
   Candidate solution files must strictly match:
   - **School**: RI, HCI, NYJC, VJC, ACJC, EJC, NJC, TJC, DHS, RVHS, JPJC, TMJC, CJC, SAJC, YIJC, MI, etc.
   - **Year**: 2012–2026.
   - **Paper Number**: `P1` vs `P2` (Paper 1 vs Paper 2). Must never cross-pair.
   - **Exam Type**: Prelim, Promo, CT, Timed Practice.
   - **Never** rely on numeric ID proximity alone without school/paper validation.
4. **Section Range Detection**:
   In PDFs bundling Paper 1 and Paper 2 solutions (e.g. ACJC 2024 Prelim, SAJC 2024 Prelim):
   - Locate `p1_start` and `p2_start`.
   - Constrain question searching for Paper 1 to `[p1_start, p2_start)`.
   - Constrain question searching for Paper 2 to `[p2_start, len(doc))`.

---

## 3. Noise-Immune Monotonic Marker Detection

To accurately locate question and solution markers (1..15) without false positives:

```python
def find_solution_markers(doc, start_p=0, end_p=None):
    if end_p is None:
        end_p = len(doc)
    markers = {}
    for p_idx in range(start_p, end_p):
        page = doc[p_idx]
        blocks = page.get_text('dict').get('blocks', [])
        for b in blocks:
            if 'lines' not in b:
                continue
            for l in b['lines']:
                y0, y1 = l['bbox'][1], l['bbox'][3]
                x0, x1 = l['bbox'][0], l['bbox'][2]
                # Filter out headers and footers
                if y0 < 35 or y0 > 720 or x0 > 145:
                    continue
                text = ''.join(s['text'] for s in l['spans']).strip()
                if not text or re.search(r'\b(?:page|\d+\s+of)\b', text, re.I):
                    continue

                # Match question markers: 1, 2, Q1, Qn 1, Solution 1, 1(a), 1(i)
                m = re.match(r'^(?:(?:Question|Qn|Q|Soln|Solution(?:\s+for)?)\s*)?([1-9]|1[0-5])(?:[\.\:\)\(\]]|\s+[a-z\(\[]|\s*$)', text, re.I)
                if m:
                    qnum = int(m.group(1))
                    if text.startswith('[') or 'mark' in text.lower():
                        continue
                    markers.setdefault(qnum, []).append({'page': p_idx, 'y0': y0, 'y1': y1, 'x0': x0, 'text': text})

    # Enforce strictly monotonic page and y progression
    resolved = {}
    last_page = start_p
    last_y = 0.0
    for q in range(1, 16):
        cands = markers.get(q, [])
        valid = [c for c in cands if c['page'] > last_page or (c['page'] == last_page and c['y0'] > last_y + 12)]
        if valid:
            resolved[q] = valid[0]
            last_page = valid[0]['page']
            last_y = valid[0]['y0']

    return resolved
```

---

## 4. Multi-Slice Pagination & PDF Layout

1. **Multi-Page Solutions**:
   - Solutions spanning multiple pages in the source document are saved as sequential slices: `{qid}_1.png`, `{qid}_2.png`, etc.
   - Slices are concatenated into `{qid}.png` for modal viewers and web matrix drawers.
2. **PDF Layout Invariants (`packages/pdf/src/compiler.ts`)**:
   - Resolve slices using `resolveAnswerSlices(questionId, diagramUrl)`.
   - Scale slices to full printable width (`CONTENT_WIDTH - 20`).
   - If a slice exceeds single-page printable height (`A4_HEIGHT - 130`), scale to fit height while preserving aspect ratio.
   - Trigger a dynamic page break (`doc.addPage([A4_WIDTH, A4_HEIGHT])`) whenever `y - scaledHeight < 60`.
   - **Suppress text dumping**: Never print `answerContent` if screenshots were embedded.
3. **Clean Fallback Reflow**:
   If no screenshot exists, collapse short broken lines ($\le 4$ characters) into coherent paragraphs before wrapping to prevent vertical character spills.

---

## 5. Verification & Test Protocol

When modifying extraction or PDF compilation code:
1. `npm test` — Ensure all unit and invariant tests pass (38/38).
2. `npm run test:fallow` — Ensure 0 dead-code warnings across all entry points.
3. Recompile sample answer key and inspect with PyMuPDF:
   - Confirm page count is consistent with question count (1–2 pages per question).
   - Verify 0 broken single-letter text lines.
4. Verify Next.js production build (`npm --workspace=apps/web run build`).
