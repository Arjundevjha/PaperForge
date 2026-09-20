/**
 * PaperForge — Deduplication Hash Utilities
 * Normalization and cryptographic fingerprinting
 */

import { createHash } from 'node:crypto';

export function hashBuffer(buffer: Buffer | Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function normalizeText(raw: string): string {
  return raw
    .normalize('NFKD')
    .toLowerCase()
    // remove LaTeX math delimiters if present
    .replace(/[$$\\]/g, ' ')
    // normalize whitespace
    .replace(/\s+/g, ' ')
    // strip non-alphanumeric except basic math ops
    .replace(/[^a-z0-9+\-=/*()]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashNormalizedText(raw: string): string {
  const norm = normalizeText(raw);
  return createHash('sha256').update(norm).digest('hex');
}
