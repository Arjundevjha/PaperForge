import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STORE_PATH = ROOT / "packages" / "db" / ".paperforge-store.json"
ANSWERS_DIR = ROOT / "apps" / "web" / "public" / "answers"

def main():
    if not STORE_PATH.exists():
        print(f"Store file not found: {STORE_PATH}")
        return

    with open(STORE_PATH, "r", encoding="utf-8") as f:
        store = json.load(f)

    # Collect all question IDs active in worksheets
    active_qids = set()
    worksheets = store.get("worksheets", [])
    for ws in worksheets:
        q_ids = ws.get("questionIds", [])
        for qid in q_ids:
            active_qids.add(qid)
        manifest = ws.get("manifest", {})
        for qid in manifest.get("questions", []):
            active_qids.add(qid)

    print(f"Total active worksheet questions: {len(active_qids)}")

    # Check answers for each active question
    short_active = []
    missing_answers = []

    for qid in sorted(active_qids):
        ans_path = ANSWERS_DIR / f"{qid}.png"
        if not ans_path.exists():
            missing_answers.append(qid)
            continue

        try:
            with Image.open(ans_path) as img:
                if img.height < 120:
                    short_active.append({
                        "qid": qid,
                        "width": img.width,
                        "height": img.height
                    })
        except Exception as e:
            print(f"Error opening {ans_path}: {e}")

    print(f"\nMissing answers for active questions: {len(missing_answers)}")
    print(f"Short answers (< 120px) for active questions: {len(short_active)}")
    
    # Analyze each short answer and re-crop if a better crop is produced
    import generate_all_answer_screenshots as gen
    import fitz

    questions_map = {q['id']: q for q in store.get('questions', [])}
    sources_map = {s['id']: s for s in store.get('sources', [])}

    fixed_count = 0

    for sa in short_active:
        qid = sa['qid']
        q = questions_map.get(qid, {})
        sid = q.get('sourceId')
        src = sources_map.get(sid, {})
        qp_fn = src.get('filename')
        prov = q.get('provenance', {})
        is_promo = prov.get('paperType') == 'PROMO' or (qp_fn and 'promo' in qp_fn.lower()) or 'promo' in qid.lower()
        paper_num = None if is_promo else prov.get('paperNumber')
        if not paper_num and not is_promo:
            m_p = re.search(r'-p([12])-q', qid)
            paper_num = int(m_p.group(1)) if m_p else 1

        sol_fn = gen.resolve_solution_file(qp_fn, paper_num)
        print(f"\n--- {qid} (current: {sa['width']}x{sa['height']} px) ---")
        print(f"  QP:  {qp_fn}")
        print(f"  Sol: {sol_fn}")
        if sol_fn and (ROOT / "papers" / "h2_mathematics" / sol_fn).exists():
            doc = fitz.open(str(ROOT / "papers" / "h2_mathematics" / sol_fn))
            start_p, end_p = gen.find_solution_section_range(doc, paper_num, sol_fn=sol_fn)
            markers = gen.find_solution_markers(doc, start_p, end_p, sol_fn=sol_fn)
            target_q = int(q.get('questionNumber', 1))
            print(f"  Target Q: {target_q} | Found markers: {sorted(markers.keys())}")
            if target_q in markers:
                m = markers[target_q]
                print(f"  Marker Q{target_q}: Page {m['page']+1} at y0={m['y0']:.1f}, x0={m['x0']:.1f} | text='{m['text']}'")
                slices = gen.crop_solution_slices(doc, target_q, markers, end_p)
                if slices:
                    if len(slices) == 1:
                        composite = slices[0]
                    else:
                        total_h = sum(s.height for s in slices) + (len(slices) - 1) * 15
                        max_w = max(s.width for s in slices)
                        composite = Image.new('L', (max_w, total_h), 255)
                        curr_y = 0
                        for s in slices:
                            composite.paste(s, (0, curr_y))
                            curr_y += s.height + 15

                    if composite and composite.height >= 120:
                        out_path = ANSWERS_DIR / f"{qid}.png"
                        composite.save(str(out_path), optimize=True)
                        for s_idx, s_img in enumerate(slices, 1):
                            s_path = ANSWERS_DIR / f"{qid}_{s_idx}.png"
                            s_img.save(str(s_path), optimize=True)
                        print(f"  [✓] Successfully re-cropped {qid}: {composite.width}x{composite.height} px ({len(slices)} slices)")
                        fixed_count += 1
                    else:
                        print(f"  [-] Produced composite height {composite.height if composite else 0}px is still < 120px")
            else:
                print(f"  [!] Q{target_q} NOT in markers!")

    print(f"\n=======================================================")
    print(f"  RE-CROP SUMMARY: Fixed {fixed_count}/{len(short_active)} short answers")
    print(f"=======================================================")

if __name__ == "__main__":
    main()
