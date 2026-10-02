#!/usr/bin/env python3
"""
PaperForge — High-Resolution Unified Question Screenshot Generator
Extracts exact question regions (text, mathematical typography, and integrated diagrams)
directly from Singapore Junior College examination PDFs as crisp 200-DPI PNGs.
"""

import os
import re
import json
import fitz
from PIL import Image, ImageOps

PAPERS_DIR = 'papers/h2_mathematics'
OUTPUT_DIR = 'apps/web/public/questions'
STORE_PATH = 'packages/db/.paperforge-store.json'

os.makedirs(OUTPUT_DIR, exist_ok=True)

INVALID_FOLLOWERS = set([
    '+', '-', '=', '*', '/', '<', '>', '≤', '≥', '±', '×', '÷',
    'π', 'θ', 'λ', 'μ', 'σ', 'α', 'β', 'x', 'y', 'z',
    'm', 's', 'k', 'cm', 'kg', 'mm'
])

def trim_whitespace(img, padding=24):
    """
    Trims excessive white margins around a rendered question image.
    Leaves generous padding around the active content to protect tall accents.
    """
    if img is None:
        return None
    try:
        if img.width <= 15 or img.height <= 15:
            return img
        gray = img.convert('L')
        inv = ImageOps.invert(gray)
        bbox = inv.getbbox()
        if not bbox:
            return img
        w, h = img.size
        x0 = max(0, bbox[0] - padding)
        y0 = max(0, bbox[1] - padding)
        x1 = min(w, bbox[2] + padding)
        y1 = min(h, bbox[3] + padding)
        if x1 - x0 < 10 or y1 - y0 < 10:
            return img
        return img.crop((x0, y0, x1, y1))
    except Exception:
        return img

def find_markers_sequential(doc):
    """
    Extracts strictly sequential question markers (1, 2, 3...) using span/line bounding boxes.
    Eliminates false positives from inline math formulas (e.g. '3 \pi', '2x + y', '[2]').
    """
    start_p = 0
    if len(doc) > 1:
        txt0 = doc[0].get_text('text').upper()
        if 'INSTRUCTIONS' in txt0 or 'CANDIDATE' in txt0 or 'INDEX NO' in txt0:
            start_p = 1

    raw_candidates = []
    for p_idx in range(start_p, len(doc)):
        page = doc[p_idx]
        pdict = page.get_text('dict')

        for b in pdict.get('blocks', []):
            if 'lines' not in b:
                continue
            for l in b['lines']:
                y0, y1 = l['bbox'][1], l['bbox'][3]
                x0, x1 = l['bbox'][0], l['bbox'][2]
                if y0 < 25 or y1 > 790 or x0 > 150:
                    continue

                line_text = ''.join(s['text'] for s in l['spans']).strip()
                if not line_text:
                    continue

                if re.match(r'^\s*Answers\s*$', line_text, re.IGNORECASE):
                    break

                m_explicit = re.match(r'^(?:Question\s+|Q\s*)([1-9]|1[0-5])([\.\:\s\(\[].*|$)', line_text, re.IGNORECASE)
                m_bare = re.match(r'^([1-9]|1[0-5])([\.\:\s\(\[].*|$)', line_text)
                is_explicit = bool(m_explicit)
                m = m_explicit or m_bare

                if m:
                    qnum = int(m.group(1))
                    rest = m.group(2).strip()
                    first_tok = rest.split()[0] if rest else ''
                    if first_tok in INVALID_FOLLOWERS or first_tok.startswith(('+', '-', '=', '<', '>', '≤', '≥')):
                        continue
                    if line_text.startswith('[') or re.match(r'^\[\d+\]$', line_text):
                        continue
                    if any(k in line_text.lower() for k in ['mark', 'ln', 'cos', 'sin', 'tan', 'sec']):
                        continue

                    raw_candidates.append({
                        'qnum': qnum,
                        'page': p_idx,
                        'y0': y0,
                        'y1': y1,
                        'x0': x0,
                        'x1': x1,
                        'line': line_text[:40],
                        'explicit': is_explicit
                    })

    if not raw_candidates:
        return {}

    # Target left margin calculation
    explicit_x0s = [c['x0'] for c in raw_candidates if c['explicit']]
    min_x0 = min(c['x0'] for c in raw_candidates)
    target_margin_x0 = min(explicit_x0s) if explicit_x0s else min_x0

    # Clean candidates: discard indented numbers (e.g. math expressions, sub-equations)
    clean_candidates = []
    for c in raw_candidates:
        if c['explicit']:
            clean_candidates.append(c)
        elif c['x0'] <= target_margin_x0 + 15:
            clean_candidates.append(c)

    cands_by_q = {}
    for c in clean_candidates:
        cands_by_q.setdefault(c['qnum'], []).append(c)

    markers = {}
    last_page = start_p
    last_y = 0.0
    for q in range(1, 16):
        cands = cands_by_q.get(q, [])
        valid = [c for c in cands if c['page'] > last_page or (c['page'] == last_page and c['y0'] > last_y + 12)]
        if valid:
            explicit_valid = [c for c in valid if c['explicit']]
            best = explicit_valid[0] if explicit_valid else valid[0]
            markers[q] = best
            last_page = best['page']
            last_y = best['y0']

    return markers

def crop_question(doc, qnum, markers, sorted_qnums):
    """
    Crops the exact region for a single question, including its equations and diagrams.
    Returns (Image, extracted_text). Never clumps multiple questions or entire pages.
    """
    if qnum not in markers:
        return None, ''

    m = markers[qnum]
    p_idx = m['page']
    page = doc[p_idx]

    # Bound start_y by preceding question on the same page
    q_idx = sorted_qnums.index(qnum) if qnum in sorted_qnums else -1
    if q_idx > 0:
        prev_m = markers[sorted_qnums[q_idx - 1]]
        if prev_m['page'] == p_idx:
            prev_blocks = [
                b for b in page.get_text('blocks')
                if b[1] >= prev_m['y0'] and b[3] <= m['y0'] and b[4].strip()
            ]
            prev_bottom = max((b[3] for b in prev_blocks), default=prev_m['y0'])
            start_y = max(prev_bottom + 3.0, m['y0'] - 16.0)
        else:
            start_y = max(20.0, m['y0'] - 16.0)
    else:
        start_y = max(20.0, m['y0'] - 16.0)

    # Determine end_y
    next_idx = q_idx + 1 if q_idx >= 0 and q_idx + 1 < len(sorted_qnums) else -1
    has_next_same_page = False
    next_m = None

    footer_pat = re.compile(r'©|Turn\s+over|Prelim|\bpage\b|^\s*\d+\s*$|Section\s+[AB]\b|End\s+of\s+(?:Paper|Section)', re.I)

    if next_idx > 0 and next_idx < len(sorted_qnums):
        next_m = markers[sorted_qnums[next_idx]]
        if next_m['page'] == p_idx:
            has_next_same_page = True
            end_y = min(775.0, next_m['y0'] - 14.0)
        else:
            # Question runs to end of current page before footer / section boundary
            blocks = [
                b for b in page.get_text('blocks')
                if b[1] >= m['y0'] and b[3] <= 750 and b[4].strip() and not footer_pat.search(b[4].strip())
            ]
            last_y1 = max((b[3] for b in blocks), default=m['y0'] + 120.0)
            end_y = min(760.0, last_y1 + 4.0)
    else:
        # Last question
        blocks = [
            b for b in page.get_text('blocks')
            if b[1] >= m['y0'] and b[3] <= 750 and b[4].strip() and not footer_pat.search(b[4].strip())
        ]
        last_y1 = max((b[3] for b in blocks), default=m['y0'] + 120.0)
        end_y = min(760.0, last_y1 + 4.0)

    if end_y - start_y < 40:
        end_y = min(760.0, start_y + 140)

    rect = fitz.Rect(35, start_y, 570, end_y)
    pix1 = page.get_pixmap(clip=rect, dpi=200, colorspace=fitz.csGRAY)
    img1 = Image.frombytes("L", [pix1.width, pix1.height], pix1.samples)
    text1 = page.get_text('text', clip=rect)

    # Check cross-page continuation onto next page
    if not has_next_same_page and p_idx + 1 < len(doc):
        page2 = doc[p_idx + 1]
        p2_end_y = (next_m['y0'] - 12.0) if (next_m and next_m['page'] == p_idx + 1) else 750.0

        p2_blocks = [
            b for b in page2.get_text('blocks')
            if b[1] >= 25.0 and b[3] <= p2_end_y and b[4].strip() and not footer_pat.search(b[4].strip())
        ]
        if p2_blocks and (max(b[3] for b in p2_blocks) - min(b[1] for b in p2_blocks)) > 20:
            last_p2_y1 = max(b[3] for b in p2_blocks)
            rect2 = fitz.Rect(35, 25.0, 570, min(760.0, last_p2_y1 + 6.0))
            pix2 = page2.get_pixmap(clip=rect2, dpi=200, colorspace=fitz.csGRAY)
            img2 = Image.frombytes("L", [pix2.width, pix2.height], pix2.samples)
            text2 = page2.get_text('text', clip=rect2)

            combined = Image.new("L", (max(img1.width, img2.width), img1.height + img2.height + 10), 255)
            combined.paste(img1, (0, 0))
            combined.paste(img2, (0, img1.height + 10))
            return trim_whitespace(combined, padding=24), (text1 + '\n' + text2).strip()

    return trim_whitespace(img1, padding=24), text1.strip()

def main():
    print('================================================================')
    print('  PAPERFORGE — QUESTION SCREENSHOT CROPPING PIPELINE (V2)')
    print('================================================================\n')

    with open(STORE_PATH, 'r') as f:
        store = json.load(f)

    sources = {s['id']: s for s in store.get('sources', [])}
    questions = store.get('questions', [])

    by_fn = {}
    for q in questions:
        sid = q.get('sourceId')
        src = sources.get(sid)
        if src and src.get('filename'):
            fn = src['filename']
            if fn not in by_fn:
                by_fn[fn] = []
            by_fn[fn].append(q)

    print(f'[i] Processing {len(questions)} questions across {len(by_fn)} examination papers...')

    total_success = 0
    total_fallback = 0

    for idx, (fn, qlist) in enumerate(by_fn.items(), 1):
        pdf_path = os.path.join(PAPERS_DIR, fn)
        if not os.path.exists(pdf_path):
            alt_path = os.path.join('storage/pdfs/incoming/2022/JPJC', fn)
            if os.path.exists(alt_path):
                pdf_path = alt_path
            else:
                continue

        try:
            doc = fitz.open(pdf_path)
        except Exception:
            continue

        markers = find_markers_sequential(doc)
        sorted_qnums = sorted(markers.keys())

        for q in qlist:
            qid = q['id']
            qn_str = q.get('questionNumber', '')
            if qn_str.isdigit():
                qn = int(qn_str)
            else:
                m_id = re.search(r'q(\d+)$', qid)
                qn = int(m_id.group(1)) if m_id else 1

            out_file = os.path.join(OUTPUT_DIR, f'{qid}.png')

            img, crop_text = crop_question(doc, qn, markers, sorted_qnums)
            if img and img.width > 20 and img.height > 20:
                try:
                    img.save(out_file, optimize=True)
                    q['diagramUrl'] = f'/questions/{qid}.png'
                    if len(crop_text) > 15:
                        q['textContent'] = crop_text
                    total_success += 1
                except Exception as e:
                    print(f'Error saving {qid}: {e}')
            else:
                total_fallback += 1
                # If existing file is a full-page clumped capture, remove it so it cannot contaminate worksheets
                if os.path.exists(out_file):
                    try:
                        from PIL import Image
                        with Image.open(out_file) as existing:
                            if existing.height > 1350:
                                os.remove(out_file)
                    except Exception:
                        pass

        if idx % 20 == 0 or idx == len(by_fn):
            print(f'[{idx}/{len(by_fn)}] Papers processed: {total_success} cropped, {total_fallback} un-isolated.')

    print(f'\n[✓] All questions processed: {total_success} high-res crops, {total_fallback} page captures.')
    print(f'[+] Updating {STORE_PATH} with screenshot references...')

    with open(STORE_PATH, 'w') as f:
        json.dump(store, f, indent=2)

    print('[✓] Local data store successfully updated.')

if __name__ == '__main__':
    main()
