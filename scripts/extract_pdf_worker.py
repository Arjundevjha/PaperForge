#!/usr/bin/env python3
"""
PaperForge — Dynamic Examination Paper & Solutions Extraction Worker
Extracts questions, marks, diagrams, and step-by-step solutions from uploaded Singapore examination PDFs.
Supports multi-school/composite Singapore JC practice papers (e.g. EJC + DHS).
"""

import sys
import os
import re
import json
import hashlib
import fitz

ALL_JCS = [
    'RI', 'HCI', 'NYJC', 'VJC', 'ACJC', 'EJC', 'NJC', 'TJC',
    'RVHS', 'DHS', 'ASRJC', 'JPJC', 'TMJC', 'CJC', 'SAJC', 'YIJC'
]

def extract_marks(text: str) -> int:
    patterns = [
        r'\[Total:\s*(\d+)\s*(?:marks?|m)?\]',
        r'\[(\d+)\s*(?:marks?|m)\]',
        r'\[(\d+)\]',
    ]
    for pat in patterns:
        found_m = re.findall(pat, text, re.IGNORECASE)
        if found_m:
            subparts = [int(x) for x in found_m if 0 < int(x) <= 20]
            if subparts:
                return sum(subparts)
    return 4

def detect_metadata(doc, fallback_school='JPJC', fallback_year=2022):
    title_line = doc[0].get_text('text').strip().split('\n')[0]
    bracket_m = re.search(r'\[(.*?)\]', title_line)
    search_str = bracket_m.group(1).upper() if bracket_m else title_line.upper()
    
    detected_schools = [jc for jc in ALL_JCS if jc in search_str]
    if not detected_schools:
        first_page = doc[0].get_text('text').upper()
        detected_schools = [jc for jc in ALL_JCS if f' {jc} ' in f' {first_page} ']
        
    year_m = re.search(r'\b(20[12]\d)\b', title_line + ' ' + doc[0].get_text('text'))
    year = int(year_m.group(1)) if year_m else fallback_year
    
    primary_school = detected_schools[0] if detected_schools else fallback_school
    composite_attribution = ' + '.join(detected_schools) if len(detected_schools) > 1 else primary_school
    
    return {
        'title': title_line,
        'primary_school': primary_school,
        'composite_attribution': composite_attribution,
        'detected_schools': detected_schools if detected_schools else [primary_school],
        'year': year
    }

def parse_solutions(sol_path, max_q=25):
    if not sol_path or not os.path.exists(sol_path):
        return {}
    
    doc = fitz.open(sol_path)
    full_text = ''
    for i, page in enumerate(doc):
        full_text += f'\n[PAGE_{i+1}]\n' + page.get_text('text')
        
    sols = {}
    lines = full_text.split('\n')
    current_q = None
    current_chunk = []
    expected = 1
    
    for line in lines:
        stripped = line.strip()
        m = re.match(r'^(?:Q|Question\s*)?(\d{1,2})(?:[\s\.\:\(\]]|$)', stripped, re.IGNORECASE)
        is_heading = False
        if m and int(m.group(1)) == expected and expected <= max_q:
            if not re.search(r'[=+*/-]', stripped[:len(str(expected))+2]):
                is_heading = True
        
        if is_heading:
            if current_q is not None:
                sols[str(current_q)] = '\n'.join(current_chunk).strip()
            current_q = expected
            current_chunk = [line]
            expected += 1
        elif current_q is not None:
            current_chunk.append(line)
            
    if current_q is not None:
        sols[str(current_q)] = '\n'.join(current_chunk).strip()
        
    return sols

def extract_questions_from_pdf(doc):
    ans_page = None
    ans_y = None
    for p_idx in range(len(doc)):
        for b in doc[p_idx].get_text('blocks'):
            if re.match(r'^\s*Answers\s*$', b[4].strip(), re.IGNORECASE):
                ans_page = p_idx
                ans_y = b[1]
                break
        if ans_page is not None:
            break

    markers = []
    expected_q = 1
    
    for p_idx in range(len(doc)):
        page = doc[p_idx]
        for block in page.get_text('dict')['blocks']:
            if 'lines' in block:
                for line in block['lines']:
                    for span in line['spans']:
                        text_s = span['text'].strip()
                        if re.match(r'^\d+$', text_s) and int(text_s) == expected_q:
                            if span['bbox'][0] < 70 and ('bold' in span['font'].lower() or span['size'] >= 11):
                                if ans_page is None or p_idx < ans_page or (p_idx == ans_page and span['bbox'][1] < ans_y):
                                    markers.append({
                                        'qnum': expected_q,
                                        'page': p_idx,
                                        'y0': span['bbox'][1],
                                        'bbox': list(span['bbox'])
                                    })
                                    expected_q += 1
                                    
    # Fallback to block parsing if bold font markers weren't detected
    if not markers:
        for p_idx in range(len(doc)):
            if ans_page is not None and p_idx > ans_page:
                break
            page = doc[p_idx]
            for b in page.get_text('blocks'):
                if re.match(r'^\s*Answers\s*$', b[4].strip(), re.IGNORECASE):
                    break
                m = re.match(r'^(?:Question\s+)?(\d{1,2})(?:\.|\s+|\([a-z]\))\s*', b[4].strip(), re.IGNORECASE)
                if m and (40 <= b[0] <= 85):
                    qnum = int(m.group(1))
                    if qnum == expected_q:
                        markers.append({
                            'qnum': expected_q,
                            'page': p_idx,
                            'y0': b[1],
                            'bbox': [b[0], b[1], b[2], b[3]]
                        })
                        expected_q += 1

    questions = []
    for idx, m in enumerate(markers):
        qnum = m['qnum']
        start_page = m['page']
        start_y = m['y0'] - 5
        
        end_page = markers[idx + 1]['page'] if idx + 1 < len(markers) else (ans_page if ans_page is not None else len(doc) - 1)
        end_y = markers[idx + 1]['y0'] if idx + 1 < len(markers) else (ans_y if ans_y is not None else 9999.0)
        
        q_text_parts = []
        has_diagram = False
        
        for p in range(start_page, end_page + 1):
            if ans_page is not None and p > ans_page:
                continue
            page = doc[p]
            for b in page.get_text('blocks'):
                bx0, by0, bx1, by1, btext = b[0], b[1], b[2], b[3], b[4]
                if p == start_page and by1 < start_y:
                    continue
                if p == end_page:
                    if idx + 1 < len(markers) and by0 >= end_y - 15:
                        continue
                    if idx + 1 == len(markers) and ans_y is not None and by0 >= ans_y - 5:
                        continue
                if re.match(r'^\s*Answers\s*$', btext.strip(), re.IGNORECASE) and (ans_page is not None and p >= ans_page):
                    continue
                q_text_parts.append(btext.strip())
                
            if len(page.get_images()) > 0 or len(page.get_drawings()) > 8:
                has_diagram = True
                
        full_q_text = '\n'.join(q_text_parts).strip()
        marks = extract_marks(full_q_text)
        
        questions.append({
            'num': str(qnum),
            'text': full_q_text,
            'page': start_page + 1,
            'has_diagram': has_diagram,
            'bbox': [56.7, max(50.0, start_y), 538.5, min(750.0, start_y + 250)],
            'marks': marks
        })
        
    return questions

def parse_pdf(file_path: str, sol_path: str = None, fallback_school: str = 'JPJC', fallback_year: int = 2022, subject: str = 'mathematics', paper_num: int = 1):
    doc = fitz.open(file_path)
    source_hash = hashlib.sha256(open(file_path, 'rb').read()).hexdigest()
    
    meta = detect_metadata(doc, fallback_school, fallback_year)
    questions = extract_questions_from_pdf(doc)
    sols = parse_solutions(sol_path, max_q=len(questions) or 25) if sol_path else {}
    
    for q in questions:
        q['solution'] = sols.get(q['num'], None)
            
    result = {
        'source': {
            'id': f"src_{meta['primary_school'].lower()}_{subject.lower()}_{meta['year']}_p{paper_num}",
            'filename': file_path.split('/')[-1],
            'title': meta['title'],
            'school': meta['primary_school'],
            'composite_attribution': meta['composite_attribution'],
            'detected_schools': meta['detected_schools'],
            'year': meta['year'],
            'subject': subject,
            'paperType': 'PROMO',
            'paperNumber': paper_num,
            'sourceHash': source_hash,
            'storageKey': f"sources/{meta['year']}/{meta['primary_school']}_{subject}_P{paper_num}.pdf",
            'pageCount': len(doc),
            'status': 'READY'
        },
        'questions': questions
    }
    
    print(json.dumps(result))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}), file=sys.stderr)
        sys.exit(1)
        
    qp_path = sys.argv[1]
    sol_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != 'none' else None
    school = sys.argv[3] if len(sys.argv) > 3 else 'JPJC'
    year = int(sys.argv[4]) if len(sys.argv) > 4 else 2022
    subject = sys.argv[5] if len(sys.argv) > 5 else 'mathematics'
    paper_num = int(sys.argv[6]) if len(sys.argv) > 6 else 1
    
    parse_pdf(qp_path, sol_path, school, year, subject, paper_num)
