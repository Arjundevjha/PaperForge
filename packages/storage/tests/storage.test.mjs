import test from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { LocalStorageProvider } from '../src/local-provider.ts';
import { getStorageProvider } from '../src/index.ts';

test('LocalStorageProvider handles full file lifecycle (upload, download, exists, list, delete)', async () => {
  const testDir = path.resolve(process.cwd(), 'scratch', 'test_storage');
  const provider = new LocalStorageProvider(testDir);

  const samplePdf = Buffer.from('%PDF-1.4\n%Test paper bytes\n%%EOF');
  const targetPath = 'incoming/2024/TEST_PROMO_P1_QP.pdf';

  // 1. Upload
  const uploadResult = await provider.upload(targetPath, samplePdf, 'application/pdf');
  assert.strictEqual(uploadResult.storageKey, targetPath);
  assert.ok(uploadResult.publicUrl?.includes('TEST_PROMO_P1_QP.pdf'));

  // 2. Exists
  const exists = await provider.exists(targetPath);
  assert.strictEqual(exists, true);

  // 3. Download
  const downloaded = await provider.download(targetPath);
  assert.strictEqual(downloaded.toString('utf-8'), samplePdf.toString('utf-8'));

  // 4. List
  const list = await provider.list('incoming/2024');
  assert.ok(list.length >= 1);
  assert.strictEqual(list[0].name, 'TEST_PROMO_P1_QP.pdf');

  // 5. Delete
  await provider.delete(targetPath);
  const existsAfterDelete = await provider.exists(targetPath);
  assert.strictEqual(existsAfterDelete, false);

  // Cleanup test directory
  await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
});

test('getStorageProvider factory returns working provider', async () => {
  const provider = getStorageProvider('local');
  assert.ok(provider);
  assert.strictEqual(typeof provider.upload, 'function');
  assert.strictEqual(typeof provider.download, 'function');
  assert.strictEqual(typeof provider.getPublicUrl, 'function');
});
