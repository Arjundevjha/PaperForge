/**
 * PaperForge — Zod Runtime Validation Schemas
 * Guarantees zero-untrusted data injection across API and worker boundaries
 */

import { z } from 'zod';

export const SingaporeSchoolCodeSchema = z.enum([
  'RI', 'HCI', 'NYJC', 'VJC', 'ACJC', 'EJC', 'NJC', 'TJC',
  'RVHS', 'DHS', 'ASRJC', 'JPJC', 'TMJC', 'CJC', 'SAJC', 'YIJC',
]);

export const SubjectIdSchema = z.enum(['chemistry', 'physics', 'biology', 'mathematics']);

export const BoundingBoxSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

export const QuestionRegionSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  pageNumber: z.number().int().positive(),
  bbox: BoundingBoxSchema,
  regionOrder: z.number().int().nonnegative(),
});

export const QuestionProvenanceSchema = z.object({
  school: SingaporeSchoolCodeSchema,
  year: z.number().int().min(2000).max(2050),
  paperType: z.string().min(1),
  paperNumber: z.number().int().positive(),
  questionNumber: z.string().min(1),
  sourceDocumentId: z.string(),
  citation: z.string().min(1),
});

export const IngestionSourcePayloadSchema = z.object({
  filename: z.string().min(1),
  school: SingaporeSchoolCodeSchema,
  year: z.number().int().min(2000).max(2050),
  subject: SubjectIdSchema,
  paperType: z.enum(['PRELIM', 'PROMO', 'BLOCK_TEST', 'PRACTICE']),
  paperNumber: z.number().int().min(1).max(4),
  pageCount: z.number().int().positive(),
});

export const WorksheetManifestSchema = z.object({
  worksheetId: z.string().min(1),
  version: z.number().int().positive(),
  chapter: z.string().min(1),
  subject: SubjectIdSchema,
  questions: z.array(z.string().min(1)).min(1),
  totalMarks: z.number().int().nonnegative(),
  frozenAt: z.string().datetime(),
});

export const ReviewResolutionPayloadSchema = z.object({
  reviewItemId: z.string().min(1),
  decision: z.enum(['APPROVE', 'REJECT', 'OVERRIDE', 'MERGE']),
  resolutionNotes: z.string().optional(),
  overrideChapter: z.string().optional(),
  overrideMarks: z.number().int().optional(),
  reviewerId: z.string().min(1),
});
