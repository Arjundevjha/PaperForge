#!/usr/bin/env python3
"""
PaperForge — High-Resolution Unified Answer Key Screenshot Generator
Extracts exact answer & marking scheme regions (equations, graphs, mark schemes, markers' comments)
directly from Singapore Junior College examination Solutions PDFs as crisp 200-DPI PNGs.
"""

import os
import re
import json
import fitz
from PIL import Image, ImageOps

PAPERS_DIR = 'papers/h2_mathematics'
OUTPUT_DIR = 'apps/web/public/answers'
STORE_PATH = 'packages/db/.paperforge-store.json'

os.makedirs(OUTPUT_DIR, exist_ok=True)

ALL_PDFS = sorted(os.listdir(PAPERS_DIR)) if os.path.exists(PAPERS_DIR) else []
SCHOOLS = ['ACJC', 'ASRJC', 'AJC', 'CJC', 'DHS', 'EJC', 'HCI', 'JPJC', 'JJC', 'MI', 'MJC', 'NJC', 'NYJC', 'PJC', 'RI', 'RVHS', 'SAJC', 'SRJC', 'TJC', 'TMJC', 'TPJC', 'VJC', 'YIJC', 'YJC']

def extract_meta(fn):
    if not fn:
        return {'sch': None, 'yr': None, 'p': None, 'typ': None, 'num': None, 'fn': ''}
    fn_lower = fn.lower()
    sch = None
    for s in SCHOOLS:
        if re.search(r'(?:^|[^a-z0-9])' + s.lower() + r'(?:[^a-z0-9]|$)', fn_lower):
            sch = s
            break
    yr_m = re.search(r'(?:^|[^0-9])(20[0-2]\d)(?:[^0-9]|$)', fn)
    yr = yr_m.group(1) if yr_m else None

    p_m = re.search(r'(?:^|[^a-z0-9])(?:p|paper)[ _]?([12])(?:[^a-z0-9]|$)', fn_lower)
    p = p_m.group(1) if p_m else None

    typ = None
    for t in ['prelim', 'promo', 'ct', 'timed', 'practice', 'revision']:
        if t in fn_lower:
            typ = t
            break

    num_m = re.search(r'_(\d{4,5})\.pdf$', fn)
    num = int(num_m.group(1)) if num_m else None

    return {'sch': sch, 'yr': yr, 'p': p, 'typ': typ, 'num': num, 'fn': fn}

def resolve_solution_file(qp_fn, paper_num=None):
    if not qp_fn:
        return None

    qp_meta = extract_meta(qp_fn)
    if paper_num and not qp_meta['p']:
        qp_meta['p'] = str(paper_num)

    qp_path = os.path.join(PAPERS_DIR, qp_fn)

    # 1. Check if qp_fn itself explicitly contains solutions (must have explicit markers and not be a pure QP)
    if os.path.exists(qp_path) and not any(k in qp_fn.lower() for k in ['_qp_', '_questions_', '_qns_', '_question_paper_']):
        try:
            d = fitz.open(qp_path)
            if len(d) > 8:
                for page_idx in range(len(d) - 1, max(4, len(d) - 25), -1):
                    txt = d[page_idx].get_text('text').lower()
                    if any(w in txt for w in ['suggested solution', 'marking scheme', 'mark scheme', 'solutions to', 'examiners report', 'markers report']):
                        return qp_fn
        except Exception:
            pass

    # 2. Direct string substitutions
    subs = [
        (r'_QP_', '_Solutions_'),
        (r'_Question_paper_', '_Solutions_(w_Markers_Comments)_'),
        (r'_Questions_', '_Solutions_'),
        (r'_Qns_', '_Solutions_'),
        (r'_Question_', '_Solution_'),
        (r'_Qn_', '_Soln_'),
        (r'_\(QP\)_', '_(Soln)_'),
        (r'_\(Qn\)_', '_(Soln)_'),
        (r'_\(Qn\)_', '_(Solutions)_'),
        (r'_\(QP\)_', '_Solutions_'),
        (r'_QP\.', '_Solutions.'),
        (r'_Qn\.', '_Soln.'),
        (r'_Questions\.', '_Solutions.'),
        (r'_Question\.', '_Solution.'),
        (r'_Question\.', '_Solutions.'),
        (r'Promo_QP\.pdf_\d+\.pdf$', 'Promo_Solutions.pdf_9769.pdf'),
    ]
    for pat, rep in subs:
        cand = re.sub(pat, rep, qp_fn, flags=re.I)
        if cand != qp_fn and cand in ALL_PDFS:
            return cand

    # 3. Strict metadata match against candidate solution files
    sol_cands = []
    is_promo_qp = qp_meta['typ'] == 'promo' or 'promo' in qp_fn.lower()
    for cand in ALL_PDFS:
        if cand == qp_fn:
            continue
        cand_lower = cand.lower()
        if not any(k in cand_lower for k in ['sol', 'ans', 'ms', 'mark', 'report']):
            continue
        c_meta = extract_meta(cand)

        is_promo_cand = c_meta['typ'] == 'promo' or 'promo' in cand_lower

        # Strict separation: Promo must match Promo; Prelim must match Prelim
        if is_promo_qp and not is_promo_cand:
            continue
        if not is_promo_qp and is_promo_cand:
            continue

        # School must match
        if qp_meta['sch'] and c_meta['sch'] and qp_meta['sch'] != c_meta['sch']:
            continue
        # Year must match
        if qp_meta['yr'] and c_meta['yr'] and qp_meta['yr'] != c_meta['yr']:
            continue
        # Paper (P1 vs P2) must match for non-promo papers
        if not is_promo_qp and qp_meta['p'] and c_meta['p'] and qp_meta['p'] != c_meta['p']:
            continue

        score = 0
        if qp_meta['sch'] and c_meta['sch'] == qp_meta['sch']:
            score += 50
        if qp_meta['yr'] and c_meta['yr'] == qp_meta['yr']:
            score += 40
        if not is_promo_qp and qp_meta['p'] and c_meta['p'] == qp_meta['p']:
            score += 40
        if is_promo_qp and is_promo_cand:
            score += 50
        elif qp_meta['typ'] and c_meta['typ'] == qp_meta['typ']:
            score += 20
        if qp_meta['num'] and c_meta['num']:
            diff = abs(qp_meta['num'] - c_meta['num'])
            if diff <= 3:
                score += 120 - (diff * 10)
            elif diff <= 10:
                score += max(0, 20 - diff)
            elif (qp_meta['yr'] is None or c_meta['yr'] is None) and diff > 100:
                score -= 40
        sol_cands.append((score, cand))

    if sol_cands:
        sol_cands.sort(key=lambda x: -x[0])
        return sol_cands[0][1]

    return None

def find_solution_section_range(doc, paper_num=None):
    """
    Finds the (start_page, end_page) range in the solution PDF for the target paper number.
    Handles documents that bundle QP + Sol, or Paper 1 + Paper 2 solutions.
    """
    if len(doc) <= 4:
        return 0, len(doc)

    p1_start = None
    p2_start = None

    for p in range(len(doc)):
        txt = doc[p].get_text('text').lower()
        if any(w in txt for w in ['solution', 'marking scheme', 'mark scheme', 'suggested answer', 'markers\' report', 'markers’ report']):
            is_p1 = bool(re.search(r'(?:^|[^a-z0-9])(?:p|paper)[ _]?1(?:[^a-z0-9]|$)', txt))
            is_p2 = bool(re.search(r'(?:^|[^a-z0-9])(?:p|paper)[ _]?2(?:[^a-z0-9]|$)', txt))
            if is_p1 and p1_start is None:
                p1_start = p
            if is_p2 and p2_start is None:
                p2_start = p

    if paper_num == 2 and p2_start is not None:
        return p2_start, len(doc)
    if paper_num == 1 and p1_start is not None:
        end_p = p2_start if p2_start is not None and p2_start > p1_start else len(doc)
        return p1_start, end_p

    # If general solutions start is found
    for p in range(len(doc)):
        txt = doc[p].get_text('text').lower()
        if any(w in txt for w in ['solution', 'marking scheme', 'mark scheme', 'suggested answer']):
            return p, len(doc)

    return 0, len(doc)

def find_solution_markers(doc, start_p=0, end_p=None):
    """
    Finds reliable question number markers (1..15) across pages in the specified range.
    Eliminates footer page numbers, mark allocations, and out-of-order noise.
    """
    if end_p is None:
        end_p = len(doc)

    markers = {}
    candidates = []
    for p_idx in range(start_p, end_p):
        page = doc[p_idx]
        blocks = page.get_text('dict').get('blocks', [])
        for b in blocks:
            if 'lines' not in b:
                continue
            for l in b['lines']:
                y0, y1 = l['bbox'][1], l['bbox'][3]
                x0, x1 = l['bbox'][0], l['bbox'][2]
                if y0 < 30 or y0 > 790 or x0 > 150:
                    continue
                text = ''.join(s['text'] for s in l['spans']).strip()
                if not text:
                    continue
                if re.search(r'\b(?:page|\d+\s+of|turn\s+over|www\.)\b', text, re.I):
                    continue

                m_explicit = re.match(r'^(?:Suggested\s+)?(?:Question|Qn|Q|Soln|Solution|Answer|Marking\s+Scheme)(?:\s+(?:to|for))?\s*(?:Question|Qn|Q)?\s*([1-9]|1[0-5])(?:[\.\:\)\(\]]|\s+|$)', text, re.I)
                m_bare = re.match(r'^([1-9]|1[0-5])(?:[\.\:\)\(\]]|\s+|$)', text)

                is_explicit = bool(m_explicit)
                m = m_explicit or m_bare
                if m:
                    qnum = int(m.group(1))
                    if text.startswith('[') or any(k in text.lower() for k in ['mark', 'ln', 'cos', 'sin', 'tan', 'sec']):
                        continue
                    candidates.append({
                        'page': p_idx,
                        'qnum': qnum,
                        'y0': y0,
                        'y1': y1,
                        'x0': x0,
                        'text': text,
                        'explicit': is_explicit,
                    })

    if not candidates:
        return {}

    # Determine left margin for question column
    explicit_x0s = [c['x0'] for c in candidates if c['explicit']]
    min_x0 = min(c['x0'] for c in candidates)
    target_margin_x0 = min(explicit_x0s) if explicit_x0s else min_x0

    # Clean candidates: discard indented bare numbers (which are math steps, equations, vectors)
    clean_candidates = []
    for c in candidates:
        if c['explicit']:
            clean_candidates.append(c)
        elif c['x0'] <= target_margin_x0 + 15:
            clean_candidates.append(c)

    markers_by_q = {}
    for c in clean_candidates:
        markers_by_q.setdefault(c['qnum'], []).append(c)

    # Monotonic resolution: ensure page(Q_N) >= page(Q_{N-1})
    resolved = {}
    last_page = start_p
    last_y = 0.0
    for q in range(1, 16):
        cands = markers_by_q.get(q, [])
        valid = [c for c in cands if c['page'] > last_page or (c['page'] == last_page and c['y0'] > last_y + 12)]
        if valid:
            explicit_valid = [c for c in valid if c['explicit']]
            best = explicit_valid[0] if explicit_valid else valid[0]
            resolved[q] = best
            last_page = best['page']
            last_y = best['y0']

    return resolved

def trim_whitespace(img, padding=24):
    if img is None:
        return None
    try:
        gray = img.convert('L')
        inv = ImageOps.invert(gray)
        bbox = inv.getbbox()
        if not bbox:
            return img
        w, h = img.size
        return img.crop((
            max(0, bbox[0] - padding),
            max(0, bbox[1] - padding),
            min(w, bbox[2] + padding),
            min(h, bbox[3] + padding)
        ))
    except Exception:
        return img

def crop_solution_slices(doc, qnum, markers, max_p=None):
    if qnum not in markers:
        return []

    if max_p is None:
        max_p = len(doc)

    m = markers[qnum]
    start_p = m['page']
    start_y = max(20.0, m['y0'] - 16.0)

    sorted_qs = sorted(markers.keys())
    idx = sorted_qs.index(qnum)
    next_m = markers[sorted_qs[idx + 1]] if idx + 1 < len(sorted_qs) else None

    # Limit solution to at most 3 pages
    end_p = next_m['page'] if next_m else min(max_p - 1, start_p + 2)
    if end_p - start_p > 2:
        end_p = start_p + 2

    end_y = (next_m['y0'] - 4.0) if (next_m and next_m['page'] == end_p) else 750.0

    slices = []
    for p in range(start_p, end_p + 1):
        page = doc[p]
        y0 = start_y if p == start_p else 35.0
        y1 = end_y if p == end_p else 750.0

        if y1 - y0 < 25:
            continue

        rect = fitz.Rect(25, y0, 575, y1)
        pix = page.get_pixmap(clip=rect, dpi=200, colorspace=fitz.csGRAY)
        img = Image.frombytes('L', [pix.width, pix.height], pix.samples)
        trimmed = trim_whitespace(img, padding=24)
        if trimmed and trimmed.width > 30 and trimmed.height > 30:
            slices.append(trimmed)

    return slices

def main():
    print('================================================================')
    print('  PAPERFORGE — HIGH-RESOLUTION ANSWER KEY SCREENSHOT ENGINE')
    print('================================================================\n')

    with open(STORE_PATH, 'r') as f:
        store = json.load(f)

    sources = {s['id']: s for s in store.get('sources', [])}
    questions = {q['id']: q for q in store.get('questions', [])}
    answers = {a['questionId']: a for a in store.get('answers', [])}

    # Collect all questions used across all worksheets
    used_qids = []
    for w in store.get('worksheets', []):
        used_qids.extend(w.get('manifest', {}).get('questions', []))
    used_qids = list(dict.fromkeys(used_qids))

    print(f'[i] Processing answer screenshots for {len(used_qids)} worksheet questions...')

    # Cache opened documents, ranges, and markers
    doc_cache = {}
    markers_cache = {}

    success_count = 0
    missing_count = 0

    for idx, qid in enumerate(used_qids, 1):
        q = questions.get(qid)
        if not q:
            continue

        sid = q.get('sourceId')
        src = sources.get(sid)
        qp_fn = src.get('filename') if src else None
        if not qp_fn:
            missing_count += 1
            continue

        is_promo = (
            q.get('provenance', {}).get('paperType') == 'PROMO'
            or 'promo' in qp_fn.lower()
            or 'promo' in qid.lower()
        )
        paper_num = None if is_promo else q.get('provenance', {}).get('paperNumber')
        if not paper_num and not is_promo:
            m_p = re.search(r'-p([12])-q', qid)
            paper_num = int(m_p.group(1)) if m_p else 1

        sol_fn = resolve_solution_file(qp_fn, paper_num)
        if not sol_fn:
            missing_count += 1
            continue

        sol_path = os.path.join(PAPERS_DIR, sol_fn)
        if not os.path.exists(sol_path):
            missing_count += 1
            continue

        cache_key = f'{sol_fn}_{paper_num}'
        if cache_key not in markers_cache:
            try:
                if sol_fn not in doc_cache:
                    doc_cache[sol_fn] = fitz.open(sol_path)
                doc = doc_cache[sol_fn]
                start_p, end_p = find_solution_section_range(doc, paper_num)
                markers = find_solution_markers(doc, start_p, end_p)
                markers_cache[cache_key] = (markers, end_p)
            except Exception as e:
                missing_count += 1
                continue

        doc = doc_cache[sol_fn]
        markers, end_p = markers_cache[cache_key]

        qn_str = str(q.get('questionNumber', '1'))
        if qn_str.isdigit():
            qn = int(qn_str)
        else:
            m_id = re.search(r'q(\d+)$', qid)
            qn = int(m_id.group(1)) if m_id else 1

        slices = crop_solution_slices(doc, qn, markers, end_p)
        if slices:
            # Save slices
            for s_idx, s_img in enumerate(slices, 1):
                slice_path = os.path.join(OUTPUT_DIR, f'{qid}_{s_idx}.png')
                s_img.save(slice_path, optimize=True)

            # Save primary image (either single page or combined)
            main_path = os.path.join(OUTPUT_DIR, f'{qid}.png')
            if len(slices) == 1:
                slices[0].save(main_path, optimize=True)
            else:
                total_h = sum(s.height for s in slices) + (len(slices) - 1) * 15
                max_w = max(s.width for s in slices)
                combined = Image.new('L', (max_w, total_h), 255)
                curr_y = 0
                for s in slices:
                    combined.paste(s, (0, curr_y))
                    curr_y += s.height + 15
                combined.save(main_path, optimize=True)

            # Update Answer record in store
            a = answers.get(qid)
            if a:
                a['diagramUrl'] = f'/answers/{qid}.png'

            success_count += 1
        else:
            missing_count += 1

        if idx % 100 == 0 or idx == len(used_qids):
            print(f'[{idx}/{len(used_qids)}] Progress: {success_count} cropped, {missing_count} unmatched/fallback.')

    print(f'\n[✓] Answer screenshot pipeline complete: {success_count}/{len(used_qids)} cropped ({success_count/len(used_qids)*100:.1f}%), {missing_count} fallbacks.')

    with open(STORE_PATH, 'w') as f:
        json.dump(store, f, indent=2)

    print(f'[✓] Updated {STORE_PATH} with answer screenshot diagramUrls.')

if __name__ == '__main__':
    main()
