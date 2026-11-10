import json

STORE_PATH = 'packages/db/.paperforge-store.json'

def main():
    with open(STORE_PATH, 'r') as f:
        store = json.load(f)

    ws = next((w for w in store['worksheets'] if w['id'] == 'ws_math_01_02_graphs'), None)
    if not ws:
        print('Error: ws_math_01_02_graphs not found')
        return

    qids = ws['manifest']['questions']
    print(f'Current question count: {len(qids)}')

    # Replacements:
    # jpjc-2021-p1-q12 (758 marks AP/GP) -> jpjc-2022-p1-q08 (7 marks Graphs)
    # hci-2023-p1-q17 (32 marks AP/GP) -> njc-2024-p1-q04 (6 marks Graphs)
    new_qids = []
    replaced = 0
    for qid in qids:
        if qid == 'jpjc-2021-p1-q12':
            new_qids.append('jpjc-2022-p1-q08')
            replaced += 1
            print('Replaced jpjc-2021-p1-q12 -> jpjc-2022-p1-q08')
        elif qid == 'hci-2023-p1-q17':
            new_qids.append('njc-2024-p1-q04')
            replaced += 1
            print('Replaced hci-2023-p1-q17 -> njc-2024-p1-q04')
        else:
            new_qids.append(qid)

    ws['manifest']['questions'] = new_qids
    ws['questionCount'] = len(new_qids)

    # Recalculate marks
    q_map = {q['id']: q for q in store['questions']}
    tot_marks = sum(q_map[qid].get('marks', 0) for qid in new_qids if qid in q_map)
    ws['totalMarks'] = tot_marks
    ws['manifest']['totalMarks'] = tot_marks
    print(f'New total marks: {tot_marks} (was previously inflated to 1921)')

    with open(STORE_PATH, 'w') as f:
        json.dump(store, f, indent=2)

    print(f'Successfully updated {STORE_PATH} ({replaced} questions replaced).')

if __name__ == '__main__':
    main()
