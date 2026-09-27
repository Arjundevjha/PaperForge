import test from 'node:test';
import assert from 'node:assert/strict';
import { filterExamPapersAndAnswerKeys } from '../scripts/scrape_holygrail_h2math.ts';

test('filterExamPapersAndAnswerKeys isolates exam papers and answer keys from lecture notes', () => {
  const sampleItems = [
    {
      id: '1',
      slug: '2026-rvhs-prelim-p1',
      title: '2026 RVHS JC2 H2MA Prelim P1 Qn',
      type: 'Exam Papers',
      downloadUrl: 'https://api.grail.moe/note/download/1',
    },
    {
      id: '2',
      slug: 'asrjc-asp-solution',
      title: 'ASRJC H2 Mathematics ASP Solution',
      type: 'MYEs/CAs/Other Tests',
      downloadUrl: 'https://api.grail.moe/note/download/2',
    },
    {
      id: '3',
      slug: 'discrete-random-variables-notes',
      title: 'NYJC H2 Mathematics Lecture Notes - S3 Discrete Random Variables',
      type: 'Notes/Practices',
      downloadUrl: 'https://api.grail.moe/note/download/3',
    },
    {
      id: '4',
      slug: 'promo-solution-sharing',
      title: '2025 CJC JC1 H2 Math Promo Solution for sharing with students',
      type: 'Notes/Practices', // Even if tagged as notes, title keyword catches it
      downloadUrl: 'https://api.grail.moe/note/download/4',
    },
  ];

  const filtered = filterExamPapersAndAnswerKeys(sampleItems, 'papers');
  assert.equal(filtered.length, 3);
  assert.ok(filtered.some((i) => i.id === '1'));
  assert.ok(filtered.some((i) => i.id === '2'));
  assert.ok(filtered.some((i) => i.id === '4'));
  assert.ok(!filtered.some((i) => i.id === '3')); // Pure lecture note skipped

  const all = filterExamPapersAndAnswerKeys(sampleItems, 'all');
  assert.equal(all.length, 4);
});
