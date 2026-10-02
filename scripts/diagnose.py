#!/usr/bin/env python3
"""
PaperForge Diagnostic & Health CLI (Doctor Pattern)
A persistent, repeatable tool for auditing PaperForge question banks, answer assets,
worksheet pairings, and compiled PDF integrity.

Usage:
    python3 scripts/diagnose.py                     # Full system health summary
    python3 scripts/diagnose.py --health            # Full system health summary
    python3 scripts/diagnose.py --question <id>     # Deep dive into a specific question
    python3 scripts/diagnose.py --crops             # Audit answer and diagram image crops
    python3 scripts/diagnose.py --pairing           # Check question paper to solution pairing
    python3 scripts/diagnose.py --pdf <path>        # Inspect compiled PDF quality & metrics
    python3 scripts/diagnose.py --json              # Output machine-readable JSON
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path

# Base paths relative to workspace root
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
STORE_PATH = WORKSPACE_ROOT / "packages" / "db" / ".paperforge-store.json"
ANSWERS_DIR = WORKSPACE_ROOT / "apps" / "web" / "public" / "answers"
DIAGRAMS_DIR = WORKSPACE_ROOT / "apps" / "web" / "public" / "diagrams"
PAPERS_DIR = WORKSPACE_ROOT / "papers" / "h2_mathematics"
DESKTOP_DIR = Path.home() / "Desktop"

SCHOOLS = [
    'ACJC', 'ASRJC', 'AJC', 'CJC', 'DHS', 'EJC', 'HCI', 'JPJC', 'JJC',
    'MI', 'MJC', 'NJC', 'NYJC', 'PJC', 'RI', 'RVHS', 'SAJC', 'SRJC',
    'TJC', 'TMJC', 'TPJC', 'VJC', 'YIJC', 'YJC'
]


def load_store():
    if not STORE_PATH.exists():
        return None
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load store from {STORE_PATH}: {e}", file=sys.stderr)
        return None


def get_answer_slices(qid):
    if not ANSWERS_DIR.exists():
        return []
    slices = []
    for f in ANSWERS_DIR.glob(f"{qid}_*.png"):
        m = re.match(rf"^{re.escape(qid)}_(\d+)\.png$", f.name)
        if m:
            slices.append((int(m.group(1)), f))
    slices.sort(key=lambda x: x[0])
    return [s[1] for s in slices]


def inspect_question(qid_query, store, as_json=False):
    if not store or "questions" not in store:
        print("[ERROR] Question store unavailable.", file=sys.stderr)
        return False

    questions = store.get("questions", [])
    matches = [
        q for q in questions
        if qid_query.lower() in str(q.get("id", "")).lower()
        or qid_query.lower() in str(q.get("school", "")).lower()
        or qid_query.lower() in str(q.get("metadata", {}).get("school", "")).lower()
        or qid_query.lower() in f"{q.get('school', '')} {q.get('year', '')}".lower()
    ]

    if not matches:
        print(f"[-] No questions found matching query: '{qid_query}'")
        return False

    results = []
    for q in matches[:10]:  # Limit display to top 10 matches
        qid = q.get("id", "")
        meta = q.get("metadata", {}) if isinstance(q.get("metadata"), dict) else {}
        prov = q.get("provenance", {}) if isinstance(q.get("provenance"), dict) else {}
        school = prov.get("school") or q.get("school") or meta.get("school") or (qid.split('-')[0].upper() if '-' in qid else "Unknown")
        year = prov.get("year") or q.get("year") or meta.get("year") or (qid.split('-')[1] if len(qid.split('-')) > 1 else "")
        paper_type = prov.get("paperType") or "PRELIM"
        paper_num = prov.get("paperNumber") or (2 if '-p2-' in qid else 1)
        paper = "PROMO" if paper_type == "PROMO" else f"P{paper_num}"
        display_prov = prov.get("display") or f"{school} {year} {paper_type} {paper}"
        qnum = q.get("questionNumber") or q.get("question_number") or prov.get("questionNumber") or meta.get("questionNumber")
        topic = q.get("topic") or q.get("topicName") or meta.get("topic") or "General"
        marks = q.get("marks") or q.get("max_marks") or q.get("maxMarks") or 0

        composite_path = ANSWERS_DIR / f"{qid}.png"
        slices = get_answer_slices(qid)
        diagram_path = DIAGRAMS_DIR / f"{qid}.png"

        source_id = q.get("sourceId") or q.get("source_id") or meta.get("sourceId")
        source_paper = q.get("sourcePaper") or q.get("source_paper") or meta.get("sourcePaper")
        if not source_paper and store and "sources" in store and source_id:
            for s in store["sources"]:
                if s.get("id") == source_id:
                    source_paper = s.get("filename")
                    break

        # Check answers store
        ans_text = q.get("answer") or q.get("answerContent") or q.get("answer_content") or ""
        if not ans_text and store and "answers" in store:
            for a in store["answers"]:
                if a.get("questionId") == qid or a.get("question_id") == qid:
                    ans_text = a.get("answerContent") or a.get("answer_content") or ""
                    break

        raw_q_text = q.get("textContent") or q.get("text_content") or q.get("text") or ""

        info = {
            "id": qid,
            "school": school,
            "year": year,
            "paper": paper,
            "questionNumber": qnum,
            "topic": topic,
            "marks": marks,
            "hasDiagramAsset": diagram_path.exists(),
            "hasAnswerComposite": composite_path.exists(),
            "answerSlicesCount": len(slices),
            "answerSliceFiles": [s.name for s in slices],
            "diagramFile": diagram_path.name if diagram_path.exists() else None,
            "sourcePaper": source_paper,
            "sourceId": source_id,
            "displayProvenance": display_prov,
            "textSnippet": (raw_q_text[:120] + "...") if len(raw_q_text) > 120 else raw_q_text,
            "answerSnippet": (ans_text[:120] + "...") if len(ans_text) > 120 else ans_text,
        }
        results.append(info)

    if as_json:
        print(json.dumps(results, indent=2))
        return True

    print(f"\n[+] Found {len(matches)} question(s) matching '{qid_query}' (showing top {len(results)}):")
    for item in results:
        print(f"\n--- Question: {item['id']} ---")
        print(f"  Provenance:   {item['displayProvenance']} (Q{item['questionNumber']})")
        print(f"  Source File:  {item['sourcePaper']} (ID: {item['sourceId']})")
        print(f"  Topic:        {item['topic']} ({item['marks']} marks)")
        print(f"  Diagram:      {'✓ Present' if item['hasDiagramAsset'] else '✗ None'} ({item['diagramFile'] or 'none'})")
        print(f"  Answer Crops: {'✓ Present' if item['hasAnswerComposite'] else '✗ None'} ({item['answerSlicesCount']} slice(s): {', '.join(item['answerSliceFiles']) or 'none'})")
        if item['textSnippet']:
            print(f"  Text Preview: {item['textSnippet']}")
        if item['answerSnippet']:
            print(f"  Ans Preview:  {item['answerSnippet']}")
    return True


def inspect_crops(as_json=False):
    ans_files = list(ANSWERS_DIR.glob("*.png")) if ANSWERS_DIR.exists() else []
    diag_files = list(DIAGRAMS_DIR.glob("*.png")) if DIAGRAMS_DIR.exists() else []

    composites = [f for f in ans_files if not re.search(r'_\d+\.png$', f.name)]
    slices = [f for f in ans_files if re.search(r'_\d+\.png$', f.name)]

    # Slice counts per question
    slice_distribution = {}
    for s in slices:
        m = re.match(r'^(.*)_(\d+)\.png$', s.name)
        if m:
            qid = m.group(1)
            slice_num = int(m.group(2))
            slice_distribution[qid] = max(slice_distribution.get(qid, 0), slice_num)

    distribution_counts = {}
    for qid, count in slice_distribution.items():
        distribution_counts[count] = distribution_counts.get(count, 0) + 1

    total_ans_bytes = sum(f.stat().st_size for f in ans_files)
    total_diag_bytes = sum(f.stat().st_size for f in diag_files)

    data = {
        "answersDir": str(ANSWERS_DIR),
        "totalAnswerFiles": len(ans_files),
        "answerComposites": len(composites),
        "answerSlices": len(slices),
        "questionsWithSlices": len(slice_distribution),
        "sliceCountDistribution": distribution_counts,
        "totalAnswerSizeMB": round(total_ans_bytes / (1024 * 1024), 2),
        "diagramsDir": str(DIAGRAMS_DIR),
        "totalDiagramFiles": len(diag_files),
        "totalDiagramSizeMB": round(total_diag_bytes / (1024 * 1024), 2),
    }

    if as_json:
        print(json.dumps(data, indent=2))
        return True

    print("\n=======================================================")
    print("         PAPERFORGE IMAGE ASSET AUDIT REPORT           ")
    print("=======================================================")
    print(f"Answer Key Directory:   {data['answersDir']}")
    print(f"Total Answer Assets:    {data['totalAnswerFiles']} PNGs ({data['totalAnswerSizeMB']} MB)")
    print(f"  - Composites:         {data['answerComposites']}")
    print(f"  - Slices:             {data['answerSlices']}")
    print(f"  - Unique Questions:   {data['questionsWithSlices']}")
    print("\nSlice Count Distribution (How many pages a solution spans):")
    for num_slices in sorted(distribution_counts.keys()):
        print(f"  {num_slices} slice(s): {distribution_counts[num_slices]} question(s)")

    print(f"\nQuestion Diagram Directory: {data['diagramsDir']}")
    print(f"Total Diagram Assets:       {data['totalDiagramFiles']} PNGs ({data['totalDiagramSizeMB']} MB)")
    print("=======================================================\n")
    return True


def inspect_pairing(as_json=False):
    if not PAPERS_DIR.exists():
        print(f"[ERROR] Papers directory not found at {PAPERS_DIR}", file=sys.stderr)
        return False

    pdf_files = sorted(list(PAPERS_DIR.glob("*.pdf")))
    qp_files = [f for f in pdf_files if "sol" not in f.name.lower() and "ans" not in f.name.lower() and "marking" not in f.name.lower()]
    sol_files = [f for f in pdf_files if f not in qp_files]

    paired = 0
    unpaired = []

    for qp in qp_files:
        stem = qp.stem.lower()
        # Find matching solution
        matched = False
        for sol in sol_files:
            sol_stem = sol.stem.lower()
            # Simple heuristic check
            common_words = set(re.findall(r'[a-z0-9]+', stem)) & set(re.findall(r'[a-z0-9]+', sol_stem))
            if len(common_words) >= 3:
                matched = True
                break
        if matched:
            paired += 1
        else:
            unpaired.append(qp.name)

    data = {
        "papersDir": str(PAPERS_DIR),
        "totalPdfFiles": len(pdf_files),
        "questionPapers": len(qp_files),
        "solutionFiles": len(sol_files),
        "pairedCount": paired,
        "unpairedCount": len(unpaired),
        "unpairedSamples": unpaired[:5],
    }

    if as_json:
        print(json.dumps(data, indent=2))
        return True

    print("\n=======================================================")
    print("         EXAM PAPER & SOLUTION PAIRING AUDIT           ")
    print("=======================================================")
    print(f"Total PDF Files:    {data['totalPdfFiles']}")
    print(f"Question Papers:    {data['questionPapers']}")
    print(f"Solution Files:     {data['solutionFiles']}")
    print(f"Pairing Status:     {paired}/{len(qp_files)} ({round((paired/len(qp_files))*100, 1) if qp_files else 0}%)")
    if unpaired:
        print(f"Unpaired Samples ({len(unpaired)} total):")
        for u in unpaired[:5]:
            print(f"  - {u}")
    print("=======================================================\n")
    return True


def inspect_pdf(pdf_path_str, as_json=False):
    target = Path(pdf_path_str)
    if not target.exists():
        # Check desktop
        desktop_target = DESKTOP_DIR / pdf_path_str
        if desktop_target.exists():
            target = desktop_target
        else:
            print(f"[ERROR] PDF file not found: {pdf_path_str}", file=sys.stderr)
            return False

    try:
        import fitz
    except ImportError:
        print("[ERROR] PyMuPDF (fitz) is not installed. Run `pip install pymupdf`.", file=sys.stderr)
        return False

    doc = fitz.open(str(target))
    page_count = len(doc)
    image_count = 0
    total_text_chars = 0
    pages_with_images = 0

    for page_idx in range(page_count):
        page = doc[page_idx]
        imgs = page.get_images()
        image_count += len(imgs)
        if imgs:
            pages_with_images += 1
        text = page.get_text()
        total_text_chars += len(text)

    # Check for character spillage
    broken_lines_detected = 0
    for page_idx in range(min(page_count, 20)):
        lines = [line.strip() for line in doc[page_idx].get_text().split("\n") if line.strip()]
        single_chars = sum(1 for line in lines if len(line) == 1)
        if len(lines) > 20 and single_chars / len(lines) > 0.4:
            broken_lines_detected += 1

    file_size_mb = round(target.stat().st_size / (1024 * 1024), 2)

    data = {
        "pdfPath": str(target),
        "fileSizeBytes": target.stat().st_size,
        "fileSizeMB": file_size_mb,
        "pageCount": page_count,
        "embeddedImageCount": image_count,
        "pagesWithImages": pages_with_images,
        "totalCharacters": total_text_chars,
        "characterSpillRisk": "DETECTED" if broken_lines_detected > 0 else "CLEAN",
        "verdict": "Publication Grade" if broken_lines_detected == 0 and image_count > 0 else "Needs Optimization",
    }

    if as_json:
        print(json.dumps(data, indent=2))
        return True

    print("\n=======================================================")
    print("             COMPILED PDF DIAGNOSTIC REPORT            ")
    print("=======================================================")
    print(f"File Path:          {data['pdfPath']}")
    print(f"File Size:          {data['fileSizeMB']} MB ({data['fileSizeBytes']} bytes)")
    print(f"Page Count:         {data['pageCount']} pages")
    print(f"Embedded Images:    {data['embeddedImageCount']} images across {data['pagesWithImages']} pages")
    print(f"Total Text Chars:   {data['totalCharacters']}")
    print(f"OCR Character Spill: {data['characterSpillRisk']}")
    print(f"Publication Verdict: {data['verdict']}")
    print("=======================================================\n")
    return True


def system_health(as_json=False):
    store = load_store()
    questions = store.get("questions", []) if store else []
    worksheets = store.get("worksheets", []) if store else []

    total_questions = len(questions)
    questions_with_diagrams = 0
    questions_with_answers = 0
    questions_with_slices = 0

    if ANSWERS_DIR.exists():
        existing_answers = set(f.stem for f in ANSWERS_DIR.glob("*.png"))
    else:
        existing_answers = set()

    if DIAGRAMS_DIR.exists():
        existing_diagrams = set(f.stem for f in DIAGRAMS_DIR.glob("*.png"))
    else:
        existing_diagrams = set()

    for q in questions:
        qid = q.get("id")
        if qid in existing_diagrams:
            questions_with_diagrams += 1
        if qid in existing_answers:
            questions_with_answers += 1
        if any(f.startswith(f"{qid}_") for f in existing_answers):
            questions_with_slices += 1

    # Check desktop deliverable
    desktop_key = DESKTOP_DIR / "WS-MATH-01_Functions_and_Graphs_AnswerKey (1).pdf"
    desktop_key_exists = desktop_key.exists()
    desktop_key_size_mb = round(desktop_key.stat().st_size / (1024 * 1024), 2) if desktop_key_exists else 0

    data = {
        "status": "HEALTHY" if total_questions > 0 and store is not None else "ERROR",
        "storePath": str(STORE_PATH),
        "totalQuestions": total_questions,
        "totalWorksheets": len(worksheets),
        "questionsWithDiagramScreenshots": questions_with_diagrams,
        "questionsWithAnswerScreenshots": questions_with_answers,
        "questionsWithMultiSliceScreenshots": questions_with_slices,
        "answerScreenshotCoveragePercent": round((questions_with_answers / total_questions) * 100, 1) if total_questions else 0,
        "desktopDeliverable": {
            "path": str(desktop_key),
            "exists": desktop_key_exists,
            "sizeMB": desktop_key_size_mb,
        }
    }

    if as_json:
        print(json.dumps(data, indent=2))
        return True

    print("\n=======================================================")
    print("             PAPERFORGE SYSTEM HEALTH CHECK            ")
    print("=======================================================")
    print(f"Overall Status:              {data['status']}")
    print(f"Database Store:              {data['storePath']}")
    print(f"Total Banked Questions:      {data['totalQuestions']}")
    print(f"Curated Worksheets:          {data['totalWorksheets']}")
    print(f"Diagram Screenshots:         {data['questionsWithDiagramScreenshots']}/{data['totalQuestions']}")
    print(f"Answer Screenshot Coverage:  {data['questionsWithAnswerScreenshots']}/{data['totalQuestions']} ({data['answerScreenshotCoveragePercent']}%)")
    print(f"Multi-Slice Solution Crops:  {data['questionsWithMultiSliceScreenshots']} questions")
    print("-------------------------------------------------------")
    print(f"Desktop Answer Key:          {'✓ Present' if desktop_key_exists else '✗ Missing'} ({desktop_key_size_mb} MB)")
    print(f"  Path: {desktop_key}")
    print("=======================================================\n")
    return True


def dump_paper(query, max_pages=5, start_page=1):
    if not PAPERS_DIR.exists():
        print(f"[ERROR] Papers directory not found at {PAPERS_DIR}", file=sys.stderr)
        return False
    matches = list(PAPERS_DIR.glob(f"*{query}*.pdf"))
    if not matches:
        print(f"[-] No PDF found matching query: {query}")
        return False
    target = matches[0]
    print(f"\n=======================================================")
    print(f"       DUMPING PAPER: {target.name}")
    print(f"=======================================================")
    import fitz
    doc = fitz.open(target)
    print(f"Total Pages: {len(doc)}")
    p_start = max(0, start_page - 1)
    p_end = min(len(doc), p_start + max_pages)
    for p in range(p_start, p_end):
        print(f"\n--- PAGE {p+1} ---")
        print(doc[p].get_text("text").strip())
    print("=======================================================\n")
    return True


def search_papers(query, max_results=10):
    if not PAPERS_DIR.exists():
        print(f"[ERROR] Papers directory not found at {PAPERS_DIR}", file=sys.stderr)
        return False
    print(f"\n[+] Searching 808 PDFs for: '{query}'...")
    import fitz
    matches = []
    for pdf_path in sorted(PAPERS_DIR.glob("*.pdf")):
        try:
            doc = fitz.open(pdf_path)
            for p_idx, page in enumerate(doc):
                txt = page.get_text("text")
                if query.lower() in txt.lower():
                    # Extract surrounding snippet
                    idx = txt.lower().find(query.lower())
                    start = max(0, idx - 100)
                    end = min(len(txt), idx + 200)
                    snippet = txt[start:end].replace('\n', ' ')
                    matches.append({
                        "file": pdf_path.name,
                        "page": p_idx + 1,
                        "snippet": snippet
                    })
                    if len(matches) >= max_results:
                        break
        except Exception:
            continue
        if len(matches) >= max_results:
            break

    if not matches:
        print(f"[-] No papers found containing text '{query}'")
        return False

    print(f"[✓] Found {len(matches)} match(es):")
    for m in matches:
        print(f"\n  File: {m['file']} (Page {m['page']})")
        print(f"  Snippet: ...{m['snippet']}...")
    print("=======================================================\n")
    return True


def inspect_sources(as_json=False):
    store = load_store()
    if not store or "sources" not in store:
        print("[ERROR] Sources store unavailable.", file=sys.stderr)
        return False
    sources = store.get("sources", [])
    print(f"\n=======================================================")
    print(f"            BANKED SOURCES AUDIT ({len(sources)} sources)      ")
    print(f"=======================================================")
    for s in sources:
        fn = s.get("filename", "")
        sch = s.get("school", "")
        yr = s.get("year", "")
        ptype = s.get("paperType", "")
        pnum = s.get("paperNumber", "")
        sid = s.get("id", "")
        print(f"ID: {sid.padEnd(40) if hasattr(sid, 'padEnd') else sid[:38]:<40} | {sch:<5} {yr} {ptype:<6} P{pnum} | File: {fn}")
    print("=======================================================\n")
    return True


def inspect_worksheets(ws_id=None, as_json=False):
    store = load_store()
    if not store or "worksheets" not in store:
        print("[ERROR] Worksheets store unavailable.", file=sys.stderr)
        return False
    worksheets = store.get("worksheets", [])
    if ws_id:
        worksheets = [w for w in worksheets if ws_id.lower() in w.get("id", "").lower() or ws_id.lower() in w.get("worksheetNumber", "").lower()]

    print(f"\n=======================================================")
    print(f"            CURATED WORKSHEETS AUDIT ({len(worksheets)} worksheets) ")
    print(f"=======================================================")
    q_map = {q["id"]: q for q in store.get("questions", [])}
    s_map = {s["id"]: s for s in store.get("sources", [])}

    for ws in worksheets:
        wnum = ws.get("worksheetNumber", "")
        title = ws.get("title", "")
        qids = ws.get("manifest", {}).get("questions", [])
        print(f"\nWorksheet: {wnum} ({ws.get('id')})")
        print(f"Title:     {title}")
        print(f"Questions: {len(qids)}")
        for idx, qid in enumerate(qids, 1):
            q = q_map.get(qid, {})
            sid = q.get("sourceId", "")
            src = s_map.get(sid, {})
            slices = get_answer_slices(qid)
            school = q.get("provenance", {}).get("school") or q.get("school") or (qid.split('-')[0].upper() if '-' in qid else "")
            year = q.get("provenance", {}).get("year") or q.get("year") or ""
            ptype = q.get("provenance", {}).get("paperType") or ""
            pnum = q.get("provenance", {}).get("paperNumber") or ""
            provenance = f"{school} {year} {ptype} P{pnum}".strip()
            slice_status = f"✓ {len(slices)} slice(s)" if slices else "✗ 0 slices (TEXT FALLBACK)"
            print(f"  {idx:2d}. [{qid}] {provenance:<24} | Slices: {slice_status:<16} | Source File: {src.get('filename', 'Unknown')}")
    print("=======================================================\n")
    return True


def main():
    parser = argparse.ArgumentParser(description="PaperForge Persistent Diagnostic & Health CLI")
    parser.add_argument("--health", action="store_true", help="Perform overall system health check (default)")
    parser.add_argument("--question", type=str, help="Inspect a specific question by ID, school, or keyword")
    parser.add_argument("--crops", action="store_true", help="Audit answer and diagram cropped PNG assets")
    parser.add_argument("--pairing", action="store_true", help="Inspect exam question paper and solution file pairing")
    parser.add_argument("--sources", action="store_true", help="Inspect all banked exam sources in the store")
    parser.add_argument("--worksheets", action="store_true", help="Inspect all curated worksheets")
    parser.add_argument("--worksheet", type=str, help="Inspect a specific worksheet by ID or number")
    parser.add_argument("--pdf", type=str, help="Inspect compiled PDF metrics, images, and layout quality")
    parser.add_argument("--dump-paper", type=str, help="Dump first few pages of an exam paper by filename")
    parser.add_argument("--start-page", type=int, default=1, help="Start page for dump-paper")
    parser.add_argument("--max-pages", type=int, default=5, help="Number of pages to dump")
    parser.add_argument("--search-papers", type=str, help="Search inside all PDF papers for text snippet")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    if args.sources:
        success = inspect_sources(as_json=args.json)
        sys.exit(0 if success else 1)

    if args.worksheets:
        success = inspect_worksheets(as_json=args.json)
        sys.exit(0 if success else 1)

    if args.worksheet:
        success = inspect_worksheets(ws_id=args.worksheet, as_json=args.json)
        sys.exit(0 if success else 1)

    if args.dump_paper:
        success = dump_paper(args.dump_paper, max_pages=args.max_pages, start_page=args.start_page)
        sys.exit(0 if success else 1)

    if args.search_papers:
        success = search_papers(args.search_papers)
        sys.exit(0 if success else 1)

    if args.question:
        store = load_store()
        success = inspect_question(args.question, store, as_json=args.json)
        sys.exit(0 if success else 1)

    if args.crops:
        success = inspect_crops(as_json=args.json)
        sys.exit(0 if success else 1)

    if args.pairing:
        success = inspect_pairing(as_json=args.json)
        sys.exit(0 if success else 1)

    if args.pdf:
        success = inspect_pdf(args.pdf, as_json=args.json)
        sys.exit(0 if success else 1)

    # Default to health check
    success = system_health(as_json=args.json)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
