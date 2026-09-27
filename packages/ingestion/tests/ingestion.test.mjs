import test from 'node:test';
import assert from 'node:assert';
import { detectMetadataFromFilename } from '../src/scanner.ts';
import { pairDiscoveredPdfs } from '../src/pairing.ts';
import { runWorkerPool } from '../src/worker-pool.ts';

test('detectMetadataFromFilename correctly extracts school, year, subject, and role', () => {
  const qp1 = detectMetadataFromFilename('RI_2024_H2_Math_Prelim_P1.pdf');
  assert.strictEqual(qp1.school, 'RI');
  assert.strictEqual(qp1.year, 2024);
  assert.strictEqual(qp1.subject, 'mathematics');
  assert.strictEqual(qp1.paperType, 'PRELIM');
  assert.strictEqual(qp1.paperNumber, 1);
  assert.strictEqual(qp1.role, 'QP');

  const ms1 = detectMetadataFromFilename('RI_2024_H2_Math_Prelim_P1_Solutions.pdf');
  assert.strictEqual(ms1.school, 'RI');
  assert.strictEqual(ms1.year, 2024);
  assert.strictEqual(ms1.role, 'MS');

  const qp2 = detectMetadataFromFilename('2023_HCI_C1_Promo_Math_P2_QP.pdf');
  assert.strictEqual(qp2.school, 'HCI');
  assert.strictEqual(qp2.year, 2023);
  assert.strictEqual(qp2.paperNumber, 2);
  assert.strictEqual(qp2.role, 'QP');

  const ms2 = detectMetadataFromFilename('2023_HCI_C1_Promo_Math_P2_MS.pdf');
  assert.strictEqual(ms2.role, 'MS');

  const practiceQp = detectMetadataFromFilename('Promo Practise Paper 3.pdf');
  assert.strictEqual(practiceQp.role, 'QP');

  const practiceMs = detectMetadataFromFilename('Promo Practise Paper 3 Solutions.pdf');
  assert.strictEqual(practiceMs.role, 'MS');
});

test('pairDiscoveredPdfs correctly pairs matching QPs and Answer Keys', () => {
  const files = [
    {
      path: '/tmp/RI_2024_P1.pdf',
      filename: 'RI_2024_P1.pdf',
      size: 1000,
      hash: 'hash-qp-ri-1',
      ...detectMetadataFromFilename('RI_2024_P1.pdf'),
    },
    {
      path: '/tmp/RI_2024_P1_Solutions.pdf',
      filename: 'RI_2024_P1_Solutions.pdf',
      size: 1500,
      hash: 'hash-ms-ri-1',
      ...detectMetadataFromFilename('RI_2024_P1_Solutions.pdf'),
    },
    {
      path: '/tmp/HCI_2023_P2.pdf',
      filename: 'HCI_2023_P2.pdf',
      size: 1200,
      hash: 'hash-qp-hci-2',
      ...detectMetadataFromFilename('HCI_2023_P2.pdf'),
    },
    {
      path: '/tmp/Orphan_Solution.pdf',
      filename: 'NYJC_2021_P1_Ans.pdf',
      size: 800,
      hash: 'hash-ms-nyjc-1',
      ...detectMetadataFromFilename('NYJC_2021_P1_Ans.pdf'),
    },
  ];

  const manifest = pairDiscoveredPdfs(files, '/tmp', 'local');
  assert.strictEqual(manifest.totalDiscovered, 4);
  assert.strictEqual(manifest.pairedCount, 1); // RI 2024 P1 has matching solution
  assert.strictEqual(manifest.unpairedQpCount, 1); // HCI 2023 P2 has no solution
  assert.strictEqual(manifest.orphanedMsCount, 1); // NYJC solution has no QP
  assert.strictEqual(manifest.duplicateCount, 0);

  const riSet = manifest.sets.find((s) => s.school === 'RI');
  assert.ok(riSet);
  assert.strictEqual(riSet.isComplete, true);
  assert.strictEqual(riSet.markScheme?.filename, 'RI_2024_P1_Solutions.pdf');
});

test('runWorkerPool processes items concurrently within limit', async () => {
  const items = [1, 2, 3, 4, 5, 6];
  let activeWorkers = 0;
  let maxActive = 0;

  const results = await runWorkerPool(
    items,
    async (item) => {
      activeWorkers++;
      maxActive = Math.max(maxActive, activeWorkers);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeWorkers--;
      return item * 2;
    },
    { concurrency: 3 }
  );

  assert.deepStrictEqual(results, [2, 4, 6, 8, 10, 12]);
  assert.ok(maxActive <= 3, `Max active workers ${maxActive} should be <= 3`);
});
