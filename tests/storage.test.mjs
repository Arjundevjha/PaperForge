import test from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('PaperForge Storage Engine: Production Bucket Connectivity & Worksheet Assets', () => {
  // 1. Verify Storage CLI status check
  const statusOutput = execSync('npx tsx scripts/storage_cli.ts --status', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  assert.ok(statusOutput.includes('BUCKET ONLINE'), 'Supabase storage bucket must be reported online');
  assert.ok(statusOutput.includes('paperforge'), 'Bucket name must be paperforge');

  // 2. Verify worksheets prefix listing
  const listOutput = execSync('npx tsx scripts/storage_cli.ts --list worksheets', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  assert.ok(listOutput.includes('WS-MATH-03_Vectors_Questions.pdf'), 'WS-MATH-03 Questions PDF must exist in worksheets/ prefix');
  assert.ok(listOutput.includes('WS-MATH-03_Vectors_AnswerKey.pdf'), 'WS-MATH-03 AnswerKey PDF must exist in worksheets/ prefix');
});
