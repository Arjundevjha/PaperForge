import test from 'node:test';
import assert from 'node:assert';
import { generateQuestionPaperPdf, generateAnswerKeyPdf } from '../src/compiler.ts';

test('generateQuestionPaperPdf generates non-empty valid PDF byte array', async () => {
  const pdfBytes = await generateQuestionPaperPdf({
    worksheetNumber: 'WS-01',
    chapterTitle: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    subject: 'chemistry',
    totalMarks: 8,
    questions: [
      {
        questionNumber: '1(a)',
        textContent: 'Define the term electrophilic addition and describe the test for unsaturation using aqueous bromine.',
        marks: 3,
        citation: '[RI 2025 H2 Chemistry PRELIM P2 Q1(a)]',
      },
      {
        questionNumber: '1(b)',
        textContent: 'Deduce the structural formula of Compound X and draw the major product formed.',
        marks: 5,
        citation: '[HCI 2024 H2 Chemistry PRELIM P3 Q4(b)]',
      },
    ],
  });

  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 1000);

  // PDF magic bytes: %PDF-
  const header = Buffer.from(pdfBytes.slice(0, 5)).toString();
  assert.strictEqual(header, '%PDF-');
});

test('generateAnswerKeyPdf generates non-empty valid answer key PDF', async () => {
  const pdfBytes = await generateAnswerKeyPdf({
    worksheetNumber: 'WS-01',
    chapterTitle: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
    subject: 'chemistry',
    totalMarks: 8,
    answers: [
      {
        questionNumber: '1(a)',
        answerContent: 'Electrophilic addition is an addition reaction where an electrophile attacks an unsaturated double bond. Test: Brownish-red bromine decolourises rapidly.',
        markSchemeNotes: '1m for definition; 1m for observation; 1m for conditions (dark).',
        marks: 3,
        citation: '[RI 2025 H2 Chemistry PRELIM P2 Q1(a)]',
      },
      {
        questionNumber: '1(b)',
        answerContent: 'Compound X is 2-methylbut-2-ene. Major product is 2-bromo-2-methylbutane following Markovnikov addition.',
        markSchemeNotes: '2m for Markovnikov carbocation stability reasoning, 3m for structure.',
        marks: 5,
        citation: '[HCI 2024 H2 Chemistry PRELIM P3 Q4(b)]',
      },
    ],
  });

  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 1000);
  const header = Buffer.from(pdfBytes.slice(0, 5)).toString();
  assert.strictEqual(header, '%PDF-');
});

test('validatePdfBuffer validates authentic PDF magic signature and rejects invalid files', async () => {
  const { validatePdfBuffer } = await import('../src/validator.ts');

  // Valid PDF bytes
  const validBuffer = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');
  const validResult = validatePdfBuffer(validBuffer);
  assert.strictEqual(validResult.valid, true);
  assert.strictEqual(validResult.pdfVersion, '1.7');

  // Corrupt non-PDF bytes (e.g. text/html/executable)
  const corruptBuffer = Buffer.from('<html><body>Fake PDF</body></html>');
  const invalidResult = validatePdfBuffer(corruptBuffer);
  assert.strictEqual(invalidResult.valid, false);
  assert.ok(invalidResult.error?.includes('Missing %PDF-'));

  // Oversized buffer
  const largeResult = validatePdfBuffer(validBuffer, 10); // max 10 bytes limit
  assert.strictEqual(largeResult.valid, false);
  assert.ok(largeResult.error?.includes('exceeds allowed limit'));
});
