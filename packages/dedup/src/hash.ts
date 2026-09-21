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
    // strip punctuation including parentheses, commas, colons, brackets
    .replace(/[^a-z0-9+\-=/*]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashNormalizedText(raw: string): string {
  const norm = normalizeText(raw);
  return createHash('sha256').update(norm).digest('hex');
}

export function computeVisualHash(diagramData: Buffer | Uint8Array | string | null | undefined): string | null {
  if (!diagramData) return null;
  if (typeof diagramData === 'string') {
    if (!diagramData.trim()) return null;
    return createHash('sha256').update(diagramData.trim()).digest('hex');
  }
  if (diagramData.length === 0) return null;
  return createHash('sha256').update(diagramData).digest('hex');
}
