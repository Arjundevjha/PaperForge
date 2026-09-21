#!/usr/bin/env python3
"""
PaperForge — Dynamic PDF Question & Answer Extraction Worker
Extracts questions, marks, and diagrams from any uploaded Singapore examination PDF.
"""

import sys
import re
import json
import hashlib
import fitz

def extract_marks(text: str) -> int:
    patterns = [
        r'\[Total:\s*(\d+)\s*(?:marks?|m)?\]',
        r'\[(\d+)\s*(?:marks?|m)\]',
        r'\[(\d+)\]',
        r'\((\d+)\s*marks?\)',
        r'\b(\d+)\s*m\b',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if 0 < val <= 100:
                return val
    return 4  # Default reasonable mark if not specified

def parse_pdf(file_path: str, school: str, year: int, subject: str, paper_num: int):
    doc = fitz.open(file_path)
    source_hash = hashlib.sha256(open(file_path, 'rb').read()).hexdigest()
    
    questions = []
    current_q = None
    
    # Process pages (skip last page if it's an answer summary page with < 500 chars or "Answers")
    num_pages = len(doc)
    page_limit = num_pages - 1 if num_pages > 4 and "Answers" in doc[num_pages - 1].get_text('text') else num_pages
    
    for page_idx in range(page_limit):
        page = doc[page_idx]
        blocks = page.get_text('blocks')
        images = len(page.get_images())
        drawings = len(page.get_drawings())
        has_diagram = (images > 0 or drawings > 8)
        
        for b in blocks:
            text = b[4].strip()
            if not text:
                continue
            
            # Detect question header
            m = re.match(r'^(?:Question\s+)?(\d{1,2})(?:\.|\s+|\([a-z]\))\s*', text, re.IGNORECASE)
            # Question headers in standard Cambridge layout are near the left margin
            if m and (40 <= b[0] <= 85 or text.lower().startswith('question')):
                qnum = m.group(1)
                if int(qnum) <= 25:
                    if current_q and len(current_q['text'].strip()) > 10:
                        questions.append(current_q)
                    current_q = {
                        'num': qnum,
                        'text': text,
                        'page': page_idx + 1,
                        'has_diagram': has_diagram,
                        'bbox': [float(b[0]), float(b[1]), float(b[2]), float(b[3])]
                    }
                    continue
                    
            if current_q:
                current_q['text'] += '\n' + text
                if has_diagram:
                    current_q['has_diagram'] = True
                    
    if current_q and len(current_q['text'].strip()) > 10:
        questions.append(current_q)
        
    # Deduplicate question numbers if subpart blocks triggered multiple
    seen_nums = set()
    cleaned_questions = []
    for q in questions:
        if q['num'] not in seen_nums:
            seen_nums.add(q['num'])
            q['marks'] = extract_marks(q['text'])
            cleaned_questions.append(q)
            
    # Format output for PaperForge
    result = {
        'source': {
            'id': f"src_{school.lower()}_{subject.lower()}_{year}_p{paper_num}",
            'filename': file_path.split('/')[-1],
            'school': school,
            'year': year,
            'subject': subject,
            'paperType': 'PROMO',
            'paperNumber': paper_num,
            'sourceHash': source_hash,
            'storageKey': f"sources/{year}/{school}_{subject}_P{paper_num}.pdf",
            'pageCount': len(doc),
            'status': 'READY'
        },
        'questions': cleaned_questions
    }
    
    print(json.dumps(result))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}), file=sys.stderr)
        sys.exit(1)
        
    path = sys.argv[1]
    school = sys.argv[2] if len(sys.argv) > 2 else 'JPJC'
    year = int(sys.argv[3]) if len(sys.argv) > 3 else 2022
    subject = sys.argv[4] if len(sys.argv) > 4 else 'mathematics'
    paper_num = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    
    parse_pdf(path, school, year, subject, paper_num)
