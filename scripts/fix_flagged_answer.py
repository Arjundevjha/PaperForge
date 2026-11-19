#!/usr/bin/env python3
"""
PaperForge — Cloud Auto-Fix Agent for Flagged Answer Mismatches
Executed by GitHub Actions on `repository_dispatch` (paperforge_fix_mismatch),
`workflow_dispatch`, or scheduled sweep.

Workflow per flagged item:
1. Fetch question, current answer, and same-school/year candidate answers & sources from Supabase.
2. If a matching solution PDF (_MS_.pdf) exists in Supabase Storage, download & re-crop the
   exact question number with PyMuPDF, upload to `answers/<question_id>.png`, and mark VERIFIED.
3. Otherwise, use Groq to check whether a nearby/same-school candidate answer matches, or
   generate an AI worked-solution diagnosis in `review_items.details`.
"""

import argparse
import json
import os
import re
import sys
import tempfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import fitz  # PyMuPDF
import requests


def get_env(name: str, required: bool = False) -> Optional[str]:
    val = os.environ.get(name, "").strip()
    if required and not val:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val or None


class SupabaseClient:
    def __init__(self, url: str, service_key: str, bucket: str = "paperforge"):
        self.url = url.rstrip("/")
        self.key = service_key
        self.bucket = bucket
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        }

    def get(self, table: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
        resp = requests.get(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=params,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        return data if isinstance(data, list) else []

    def patch(self, table: str, params: Dict[str, str], body: Dict[str, Any]) -> None:
        resp = requests.patch(
            f"{self.url}/rest/v1/{table}",
            headers={**self.headers, "Prefer": "return=minimal"},
            params=params,
            json=body,
            timeout=20,
        )
        resp.raise_for_status()

    def list_storage(self, prefix: str) -> List[Dict[str, Any]]:
        resp = requests.post(
            f"{self.url}/storage/v1/object/list/{self.bucket}",
            headers=self.headers,
            json={"prefix": prefix, "limit": 200},
            timeout=20,
        )
        if not resp.ok:
            return []
        data = resp.json()
        return data if isinstance(data, list) else []

    def download_storage(self, object_path: str) -> Optional[bytes]:
        resp = requests.get(
            f"{self.url}/storage/v1/object/{self.bucket}/{object_path}",
            headers={"apikey": self.key, "Authorization": f"Bearer {self.key}"},
            timeout=60,
        )
        if not resp.ok:
            return None
        return resp.content

    def upload_storage(self, object_path: str, data: bytes, content_type: str = "image/png") -> str:
        resp = requests.post(
            f"{self.url}/storage/v1/object/{self.bucket}/{object_path}",
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            data=data,
            timeout=60,
        )
        resp.raise_for_status()
        return f"{self.url}/storage/v1/object/public/{self.bucket}/{object_path}"


def crop_question_from_solution_pdf(pdf_bytes: bytes, question_number: str) -> Optional[bytes]:
    """Locate question_number in a solution PDF and render a crisp 200-DPI PNG crop."""
    q_num_clean = re.sub(r"[^0-9]", "", str(question_number or ""))
    if not q_num_clean:
        return None

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    q_pattern = re.compile(rf"(?:^|\n)\s*(?:Q(?:uestion)?\s*)?{re.escape(q_num_clean)}\s*[\.\):]", re.I)
    next_num = str(int(q_num_clean) + 1)
    next_pattern = re.compile(rf"(?:^|\n)\s*(?:Q(?:uestion)?\s*)?{re.escape(next_num)}\s*[\.\):]", re.I)

    start_page = None
    start_y = 0.0
    for idx, page in enumerate(doc):
        text = page.get_text("text")
        if q_pattern.search(text):
            start_page = idx
            blocks = page.get_text("blocks")
            for b in blocks:
                if q_pattern.search(b[4] or ""):
                    start_y = max(0.0, b[1] - 12.0)
                    break
            break

    if start_page is None:
        return None

    page = doc[start_page]
    rect = page.rect
    end_y = rect.height - 20.0
    for b in page.get_text("blocks"):
        if b[1] > start_y + 20.0 and next_pattern.search(b[4] or ""):
            end_y = max(start_y + 80.0, b[1] - 10.0)
            break

    clip = fitz.Rect(20.0, start_y, rect.width - 20.0, min(rect.height - 10.0, end_y))
    pix = page.get_pixmap(dpi=200, clip=clip)
    return pix.tobytes("png")


def call_groq_matcher(
    groq_key: str,
    question: Dict[str, Any],
    current_answer: Optional[Dict[str, Any]],
    candidates: List[Dict[str, Any]],
    reason: str,
) -> Optional[Dict[str, Any]]:
    """Ask Groq to evaluate candidate answers or produce a worked-solution fallback."""
    cand_summaries = [
        {
            "answerId": c.get("id"),
            "questionId": c.get("question_id"),
            "citation": (c.get("provenance") or {}).get("citation"),
            "solutionSourceFilename": c.get("solution_source_filename"),
            "answerContent": (c.get("answer_content") or "")[:400],
        }
        for c in candidates[:10]
    ]

    prompt = (
        "You are PaperForge's answer-pairing QA agent for Singapore H2 A-Level Mathematics.\n"
        f"Flag reason: {reason}\n"
        f"Question ID: {question.get('id')}\n"
        f"Question Provenance: {json.dumps(question.get('provenance') or {})}\n"
        f"Question Text:\n{(question.get('text_content') or '')[:1500]}\n\n"
        f"Current Paired Answer:\n{json.dumps(current_answer or {}, default=str)[:800]}\n\n"
        f"Same-School/Year Candidate Answers:\n{json.dumps(cand_summaries, default=str)}\n\n"
        "Respond strictly in JSON with keys:\n"
        '- "matchedAnswerId": string or null (only if one of the candidates clearly matches this exact question)\n'
        '- "confidence": number 0..1\n'
        '- "diagnosis": concise string explaining what went wrong\n'
        '- "workedSolution": concise LaTeX/markdown worked solution fallback for the question\n'
    )

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
        json={
            "model": "openai/gpt-oss-120b",
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=45,
    )
    if not resp.ok:
        return None
    content = resp.json()["choices"][0]["message"]["content"]
    return json.loads(content)


def find_storage_solution_pdf(sb: SupabaseClient, school: str, year: Any, paper_num: Any) -> Optional[str]:
    for prefix in ["sources", "papers", ""]:
        items = sb.list_storage(prefix)
        for item in items:
            name = item.get("name") or ""
            if not name.lower().endswith(".pdf"):
                continue
            upper = name.upper()
            if school.upper() in upper and str(year) in upper and ("_MS_" in upper or "SOL" in upper):
                if not paper_num or f"P{paper_num}" in upper:
                    return f"{prefix}/{name}".lstrip("/")
    return None


def process_flagged_item(
    sb: SupabaseClient,
    groq_key: Optional[str],
    question_id: str,
    review_item: Optional[Dict[str, Any]],
    reason: str,
    dry_run: bool = False,
) -> Dict[str, Any]:
    questions = sb.get("questions", {"id": f"eq.{question_id}", "select": "*"})
    if not questions:
        return {"questionId": question_id, "status": "SKIPPED", "reason": "Question not found"}

    question = questions[0]
    prov = question.get("provenance") or {}
    school = prov.get("school", "")
    year = prov.get("year", "")
    paper_num = prov.get("paperNumber", "")
    q_num = prov.get("questionNumber", "")

    answers = sb.get("answers", {"question_id": f"eq.{question_id}", "select": "*"})
    current_answer = answers[0] if answers else None
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Try PDF re-crop if raw _MS_.pdf exists in Supabase Storage
    storage_pdf_path = find_storage_solution_pdf(sb, school, year, paper_num)
    if storage_pdf_path and not dry_run:
        pdf_bytes = sb.download_storage(storage_pdf_path)
        if pdf_bytes:
            png_bytes = crop_question_from_solution_pdf(pdf_bytes, q_num)
            if png_bytes:
                public_url = sb.upload_storage(f"answers/{question_id}.png", png_bytes, "image/png")
                if current_answer:
                    sb.patch(
                        "answers",
                        {"id": f"eq.{current_answer['id']}"},
                        {
                            "diagram_url": public_url,
                            "verification_status": "VERIFIED",
                            "solution_source_filename": os.path.basename(storage_pdf_path),
                        },
                    )
                if review_item:
                    sb.patch(
                        "review_items",
                        {"id": f"eq.{review_item['id']}"},
                        {
                            "status": "RESOLVED",
                            "reviewed_by": "paperforge-cloud-agent",
                            "reviewed_at": now_iso,
                            "details": {
                                **(review_item.get("details") or {}),
                                "resolution": "Re-cropped from Storage solution PDF",
                                "storagePdfPath": storage_pdf_path,
                                "diagramUrl": public_url,
                            },
                        },
                    )
                return {"questionId": question_id, "status": "RESOLVED_RECROP", "url": public_url}

    # 2. Fall back to Groq candidate matching & worked-solution diagnosis
    candidates: List[Dict[str, Any]] = []
    if school and year:
        candidates = sb.get(
            "answers",
            {
                "select": "id,question_id,provenance,solution_source_filename,answer_content,diagram_url",
                "limit": "40",
            },
        )
        candidates = [
            c
            for c in candidates
            if c.get("question_id") != question_id
            and (c.get("provenance") or {}).get("school") == school
            and str((c.get("provenance") or {}).get("year")) == str(year)
        ]

    ai_result = (
        call_groq_matcher(groq_key, question, current_answer, candidates, reason)
        if groq_key
        else None
    )

    if dry_run:
        return {
            "questionId": question_id,
            "status": "DRY_RUN",
            "storagePdfPath": storage_pdf_path,
            "candidateCount": len(candidates),
            "aiResult": ai_result,
        }

    if ai_result and ai_result.get("matchedAnswerId") and float(ai_result.get("confidence", 0)) >= 0.85:
        matched = next((c for c in candidates if c["id"] == ai_result["matchedAnswerId"]), None)
        if matched and current_answer:
            sb.patch(
                "answers",
                {"id": f"eq.{current_answer['id']}"},
                {
                    "diagram_url": matched.get("diagram_url"),
                    "answer_content": matched.get("answer_content") or current_answer.get("answer_content"),
                    "solution_source_filename": matched.get("solution_source_filename"),
                    "verification_status": "VERIFIED",
                },
            )
            if review_item:
                sb.patch(
                    "review_items",
                    {"id": f"eq.{review_item['id']}"},
                    {
                        "status": "RESOLVED",
                        "reviewed_by": "paperforge-cloud-agent",
                        "reviewed_at": now_iso,
                        "details": {
                            **(review_item.get("details") or {}),
                            "aiDiagnosis": ai_result.get("diagnosis"),
                            "swappedFromAnswerId": matched["id"],
                        },
                    },
                )
            return {"questionId": question_id, "status": "RESOLVED_AI_SWAP", "matchedAnswerId": matched["id"]}

    # Otherwise leave PENDING with rich AI diagnosis & worked-solution fallback for 1-click approval
    if review_item:
        sb.patch(
            "review_items",
            {"id": f"eq.{review_item['id']}"},
            {
                "details": {
                    **(review_item.get("details") or {}),
                    "agentCheckedAt": now_iso,
                    "storagePdfFound": bool(storage_pdf_path),
                    "aiDiagnosis": (ai_result or {}).get("diagnosis")
                    or "No raw _MS_.pdf in Supabase Storage; queued for manual/local re-crop.",
                    "aiSuggestedSolution": (ai_result or {}).get("workedSolution"),
                }
            },
        )
    return {"questionId": question_id, "status": "DIAGNOSED_PENDING"}


def main() -> int:
    parser = argparse.ArgumentParser(description="PaperForge Cloud Mismatch Auto-Fix Agent")
    parser.add_argument("--question-id", default=os.environ.get("QUESTION_ID", "").strip())
    parser.add_argument("--review-item-id", default=os.environ.get("REVIEW_ITEM_ID", "").strip())
    parser.add_argument("--reason", default=os.environ.get("FLAG_REASON", "Flagged answer mismatch").strip())
    parser.add_argument("--sweep", action="store_true", help="Process all PENDING MISMATCH_FLAGGED items")
    parser.add_argument("--dry-run", action="store_true", help="Inspect without mutating Supabase")
    args = parser.parse_args()

    sb_url = get_env("SUPABASE_URL") or get_env("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = get_env("SUPABASE_SERVICE_ROLE_KEY")
    groq_key = get_env("GROQ_API_KEY")

    if not sb_url or not sb_key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; exiting cleanly.", file=sys.stderr)
        return 1

    sb = SupabaseClient(sb_url, sb_key)
    results: List[Dict[str, Any]] = []

    if args.question_id and not args.sweep:
        rev_items = (
            sb.get("review_items", {"id": f"eq.{args.review_item_id}", "select": "*"})
            if args.review_item_id
            else sb.get(
                "review_items",
                {
                    "entity_id": f"eq.{args.question_id}",
                    "status": "eq.PENDING",
                    "order": "created_at.desc",
                    "limit": "1",
                    "select": "*",
                },
            )
        )
        results.append(
            process_flagged_item(
                sb,
                groq_key,
                args.question_id,
                rev_items[0] if rev_items else None,
                args.reason,
                dry_run=args.dry_run,
            )
        )
    else:
        pending = sb.get(
            "review_items",
            {"status": "eq.PENDING", "issue_type": "eq.MISMATCH_FLAGGED", "select": "*", "limit": "25"},
        )
        for item in pending:
            qid = (item.get("details") or {}).get("questionId") or item.get("entity_id")
            if not qid:
                continue
            reason = (item.get("details") or {}).get("reason") or "Flagged mismatch"
            results.append(
                process_flagged_item(sb, groq_key, qid, item, reason, dry_run=args.dry_run)
            )

    print(json.dumps({"processed": len(results), "results": results}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
