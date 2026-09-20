/**
 * PaperForge — PDF Buffer Security & Signature Validator
 * Protects against buffer injection, oversized uploads, and malformed files per SECURITY.md
 */

export interface PdfValidationResult {
  valid: boolean;
  fileSizeBytes: number;
  pdfVersion?: string;
  error?: string;
}

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 Megabytes limit

export function validatePdfBuffer(
  buffer: Buffer | Uint8Array,
  maxSizeBytes = MAX_PDF_SIZE_BYTES
): PdfValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, fileSizeBytes: 0, error: 'Empty buffer received' };
  }

  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      fileSizeBytes: buffer.length,
      error: `File size exceeds allowed limit of ${maxSizeBytes / (1024 * 1024)}MB`,
    };
  }

  // Check magic bytes: "%PDF-" (0x25, 0x50, 0x44, 0x46, 0x2d)
  if (
    buffer.length < 8 ||
    buffer[0] !== 0x25 || // %
    buffer[1] !== 0x50 || // P
    buffer[2] !== 0x44 || // D
    buffer[3] !== 0x46 || // F
    buffer[4] !== 0x2d    // -
  ) {
    return {
      valid: false,
      fileSizeBytes: buffer.length,
      error: 'Invalid file signature: Missing %PDF- header magic bytes',
    };
  }

  // Extract PDF version e.g. 1.4, 1.7
  const headerSlice = Buffer.from(buffer.slice(0, 12)).toString('ascii');
  const match = headerSlice.match(/%PDF-(\d+\.\d+)/);
  const pdfVersion = match ? match[1] : undefined;

  return {
    valid: true,
    fileSizeBytes: buffer.length,
    pdfVersion,
  };
}
