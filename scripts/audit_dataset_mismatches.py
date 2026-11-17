#!/usr/bin/env python3
"""
PaperForge — Persistent Diagnostic Script for Provenance, School, Paper & Solution Pairing Mismatches.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_all_answer_screenshots as g

STORE_PATH = 'packages/db/.paperforge-store.json'
PAPERS_DIR = 'papers/h2_mathematics'


def main():
    with open(STORE_PATH) as f:
        store = json.load(f)

    sources = {s['id']: s for s in store.get('sources', [])}
    questions = {q['id']: q for q in store.get('questions', [])}
    answers = {a['questionId']: a for a in store.get('answers', [])}
    worksheets = store.get('worksheets', [])

    ws_qids = []
    for w in worksheets:
        for qid in w.get('manifest', {}).get('questions', []):
            if qid not in ws_qids:
                ws_qids.append(qid)

    # 1. PDFs with sch=None in extract_meta
    all_pdfs = sorted(os.listdir(PAPERS_DIR)) if os.path.exists(PAPERS_DIR) else []
    no_sch_pdfs = [fn for fn in all_pdfs if g.extract_meta(fn)['sch'] is None]
    print(f"=== 1. PDFs with extract_meta['sch'] is None: {len(no_sch_pdfs)}/{len(all_pdfs)} ===")
    for fn in no_sch_pdfs[:40]:
        print(f"  - {fn}")
    if len(no_sch_pdfs) > 40:
        print(f"  ... and {len(no_sch_pdfs) - 40} more")

    # 2. School mismatches between q.id / provenance / source / source.filename
    sch_mismatches = []
    for qid in ws_qids:
        q = questions[qid]
        src = sources.get(q.get('sourceId'), {})
        fn = src.get('filename', '')
        fn_meta = g.extract_meta(fn)
        id_sch = qid.split('-')[0].upper()
        prov_sch = (q.get('provenance') or {}).get('school', '').upper()
        src_sch = (src.get('school') or '').upper()
        fn_sch = (fn_meta['sch'] or '').upper()

        if len({x for x in [id_sch, prov_sch, src_sch, fn_sch] if x}) > 1 or (fn_sch and id_sch != fn_sch):
            sch_mismatches.append((qid, id_sch, prov_sch, src_sch, fn_sch, fn))

    print(f"\n=== 2. Worksheet Qs with School Mismatches: {len(sch_mismatches)}/{len(ws_qids)} ===")
    for item in sch_mismatches[:25]:
        print(f"  {item[0]}: id={item[1]}, prov={item[2]}, src={item[3]}, fn_sch={item[4]} | {item[5]}")
    if len(sch_mismatches) > 25:
        print(f"  ... and {len(sch_mismatches) - 25} more")

    # 3. P1 vs P2 mismatches
    p_mismatches = []
    for qid, q in questions.items():
        src = sources.get(q.get('sourceId'), {})
        m_p = re.search(r'-p([12])-q', qid)
        id_p = int(m_p.group(1)) if m_p else None
        prov_p = (q.get('provenance') or {}).get('paperNumber')
        src_p = src.get('paperNumber')
        if id_p and ((prov_p and id_p != prov_p) or (src_p and id_p != src_p)):
            p_mismatches.append((qid, id_p, prov_p, src_p, src.get('filename', '')))

    print(f"\n=== 3. Questions with P1-vs-P2 Mismatch (id vs prov/src): {len(p_mismatches)}/{len(questions)} ===")
    ws_p_mismatches = [x for x in p_mismatches if x[0] in set(ws_qids)]
    print(f"  Of which in worksheets: {len(ws_p_mismatches)}/{len(ws_qids)}")
    for item in ws_p_mismatches[:15]:
        print(f"  {item[0]}: id_p={item[1]}, prov_p={item[2]}, src_p={item[3]} | {item[4]}")

    # 4. Cross-school or cross-paper solution pairings
    sol_issues = []
    sol_cache = {}
    for qid in ws_qids:
        q = questions[qid]
        src = sources.get(q.get('sourceId'), {})
        qp_fn = src.get('filename', '')
        is_promo = (q.get('provenance', {}).get('paperType') == 'PROMO' or 'promo' in qp_fn.lower() or 'promo' in qid.lower())
        paper_num = None if is_promo else q.get('provenance', {}).get('paperNumber')
        cache_key = (qp_fn, paper_num)
        if cache_key not in sol_cache:
            sol_cache[cache_key] = g.resolve_solution_file(qp_fn, paper_num)
        sol_fn = sol_cache[cache_key]
        qp_meta = g.extract_meta(qp_fn)
        sol_meta = g.extract_meta(sol_fn) if sol_fn else None
        if not sol_fn:
            sol_issues.append((qid, 'NO_SOL', qp_fn, None))
        elif qp_meta['sch'] and sol_meta['sch'] and qp_meta['sch'] != sol_meta['sch']:
            sol_issues.append((qid, 'CROSS_SCHOOL', qp_fn, sol_fn))
        elif qp_meta['sch'] and not sol_meta['sch']:
            sol_issues.append((qid, 'SOL_SCH_NONE', qp_fn, sol_fn))
        elif paper_num and sol_meta['p'] and str(paper_num) != str(sol_meta['p']):
            sol_issues.append((qid, 'CROSS_PAPER', qp_fn, sol_fn))

    print(f"\n=== 4. Current Solution Pairing Issues (Worksheet Qs): {len(sol_issues)}/{len(ws_qids)} ===")
    for item in sol_issues[:30]:
        print(f"  [{item[1]}] {item[0]}: QP={item[2]} -> SOL={item[3]}")
    if len(sol_issues) > 30:
        print(f"  ... and {len(sol_issues) - 30} more")


if __name__ == '__main__':
    main()
