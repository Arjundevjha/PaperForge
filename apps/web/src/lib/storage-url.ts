/**
 * PaperForge — Cloud Storage CDN URL Helper
 * Resolves high-resolution question and answer screenshot URLs from the public
 * Supabase Storage CDN bucket, with seamless fallback for local development.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'paperforge';

const SUPABASE_CDN_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`
  : '';

export function getQuestionImageUrl(qid: string): string {
  if (SUPABASE_CDN_BASE) {
    return `${SUPABASE_CDN_BASE}/questions/${qid}.png`;
  }
  return `/questions/${qid}.png`;
}

export function getAnswerImageUrl(qid: string, customDiagramUrl?: string): string {
  if (SUPABASE_CDN_BASE) {
    return `${SUPABASE_CDN_BASE}/answers/${qid}.png`;
  }
  return customDiagramUrl || `/answers/${qid}.png`;
}
