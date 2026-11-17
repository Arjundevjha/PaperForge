#!/usr/bin/env python3
"""
PaperForge — Heal Source Schools, Paper Provenance, Topic/Subtopic IDs, and Diagram URLs.
Fixes school mismatches (e.g. MI/MJC/AJC sources wrongly tagged JPJC) and ensures
question.provenance, topicId, subtopicId, and diagramUrl are 100% consistent with sources.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_all_answer_screenshots as g

STORE_PATH = 'packages/db/.paperforge-store.json'
QUESTIONS_DIR = 'apps/web/public/questions'

CHAPTER_TO_TOPIC_ID = {
    'Functions and Graphs': 'math-01',
    'Sequences and Series': 'math-02',
    'Vectors': 'math-03',
    'Complex Numbers': 'math-04',
    'Calculus': 'math-05',
    'Probability and Statistics': 'math-06',
}

SUBTOPIC_TO_ID = {
    'Functions': 'math-01-01',
    'Graphs and Transformations': 'math-01-02',
    'Equations and Inequalities': 'math-01-03',
    'Sequences and Series': 'math-02-01',
    'Arithmetic and Geometric Progressions': 'math-02-02',
    'Binomial Series': 'math-02-03',
    'Vectors in 2D and 3D': 'math-03-01',
    'Lines and Planes in 3D': 'math-03-02',
    'Cartesian Form & Operations': 'math-04-01',
    'Roots of Polynomials': 'math-04-02',
    'Argand Diagrams & Geometric Loci': 'math-04-03',
    'Differentiation Techniques & Applications': 'math-05-01',
    'Integration Techniques & Applications': 'math-05-02',
    'Differential Equations': 'math-05-03',
    'Maclaurin Series': 'math-05-04',
    'Probability and Random Variables': 'math-06-01',
    'Normal Distribution': 'math-06-02',
    'Hypothesis Testing': 'math-06-03',
    'Correlation and Linear Regression': 'math-06-04',
    'Linear Regression': 'math-06-04',
}


def main():
    with open(STORE_PATH) as f:
        store = json.load(f)

    sources = store.get('sources', [])
    questions = store.get('questions', [])
    answers = store.get('answers', [])

    src_healed_sch = 0
    src_healed_paper = 0
    src_map = {}

    for s in sources:
        fn = s.get('filename', '')
        meta = g.extract_meta(fn)
        if meta['sch'] and s.get('school') != meta['sch']:
            s['school'] = meta['sch']
            src_healed_sch += 1
        if meta['yr'] and not s.get('year'):
            s['year'] = int(meta['yr'])

        is_promo = (meta['typ'] == 'promo') or ('promo' in fn.lower())
        expected_type = 'PROMO' if is_promo else 'PRELIM'
        expected_p = 1 if is_promo else (int(meta['p']) if meta['p'] else s.get('paperNumber', 1))

        if s.get('paperType') != expected_type or s.get('paperNumber') != expected_p:
            s['paperType'] = expected_type
            s['paperNumber'] = expected_p
            src_healed_paper += 1

        src_map[s['id']] = s

    q_healed_prov = 0
    q_mapped_topics = 0
    q_map = {}

    for q in questions:
        src = src_map.get(q.get('sourceId'))
        if src:
            school = src.get('school') or (q.get('provenance') or {}).get('school') or q['id'].split('-')[0].upper()
            year = src.get('year') or (q.get('provenance') or {}).get('year') or 2023
            paper_type = src.get('paperType') or 'PRELIM'
            paper_num = src.get('paperNumber') or 1
            qnum = str(q.get('questionNumber') or (q.get('provenance') or {}).get('questionNumber') or '1')
            subject = 'H2 Mathematics'
            display = f"{school} {year} {subject} {paper_type} P{paper_num} Q{qnum}"

            prev_prov = q.get('provenance') or {}
            if (
                prev_prov.get('school') != school
                or prev_prov.get('paperNumber') != paper_num
                or prev_prov.get('paperType') != paper_type
                or prev_prov.get('display') != display
            ):
                q_healed_prov += 1

            q['provenance'] = {
                'school': school,
                'year': year,
                'subject': subject,
                'paperType': paper_type,
                'paperNumber': paper_num,
                'questionNumber': qnum,
                'sourceId': q.get('sourceId'),
                'display': display,
            }

        topic_id = CHAPTER_TO_TOPIC_ID.get(q.get('chapter'))
        subtopic_id = SUBTOPIC_TO_ID.get(q.get('subtopic'))
        if topic_id:
            q['topicId'] = topic_id
            q_mapped_topics += 1
        if subtopic_id:
            q['subtopicId'] = subtopic_id

        q_png = os.path.join(QUESTIONS_DIR, f"{q['id']}.png")
        if os.path.exists(q_png):
            q['diagramUrl'] = f"/questions/{q['id']}.png"

        q_map[q['id']] = q

    for a in answers:
        q = q_map.get(a.get('questionId'))
        if q:
            if q.get('topicId'):
                a['topicId'] = q['topicId']
            if q.get('subtopicId'):
                a['subtopicId'] = q['subtopicId']
            if q.get('questionType'):
                a['questionType'] = q['questionType']

    with open(STORE_PATH, 'w') as f:
        json.dump(store, f, indent=2)

    print(f"[✓] Sources healed: school={src_healed_sch}, paper={src_healed_paper}")
    print(f"[✓] Questions healed: provenance={q_healed_prov}, topicId_mapped={q_mapped_topics}")


if __name__ == '__main__':
    main()
