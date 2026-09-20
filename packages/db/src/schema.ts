/**
 * PaperForge — Drizzle ORM Schema
 * Matches DATA_MODEL.md specification exactly
 */

import { pgTable, text, integer, timestamp, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

export const sourcesTable = pgTable('sources', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  school: text('school').notNull(),
  year: integer('year').notNull(),
  subject: text('subject').notNull(),
  paperType: text('paper_type').notNull(),
  paperNumber: integer('paper_number').notNull(),
  sourceHash: text('source_hash').notNull().unique(),
  storageKey: text('storage_key').notNull(),
  pageCount: integer('page_count').notNull(),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const questionsTable = pgTable('questions', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').references(() => sourcesTable.id).notNull(),
  questionNumber: text('question_number').notNull(),
  parentQuestionId: text('parent_question_id'),
  subject: text('subject').notNull(),
  chapter: text('chapter').notNull(),
  subtopic: text('subtopic'),
  syllabusVersionId: text('syllabus_version_id').notNull(),
  textContent: text('text_content').notNull(),
  marks: integer('marks'),
  textHash: text('text_hash').notNull(),
  visualHash: text('visual_hash'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const questionRegionsTable = pgTable('question_regions', {
  id: text('id').primaryKey(),
  questionId: text('question_id').references(() => questionsTable.id).notNull(),
  pageNumber: integer('page_number').notNull(),
  x0: doublePrecision('x0').notNull(),
  y0: doublePrecision('y0').notNull(),
  x1: doublePrecision('x1').notNull(),
  y1: doublePrecision('y1').notNull(),
  regionOrder: integer('region_order').notNull(),
});

export const answersTable = pgTable('answers', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').references(() => sourcesTable.id).notNull(),
  questionId: text('question_id').references(() => questionsTable.id).notNull(),
  questionNumber: text('question_number').notNull(),
  answerContent: text('answer_content').notNull(),
  answerHash: text('answer_hash').notNull(),
  markSchemeNotes: text('mark_scheme_notes'),
  status: text('status').notNull(),
});

export const answerRegionsTable = pgTable('answer_regions', {
  id: text('id').primaryKey(),
  answerId: text('answer_id').references(() => answersTable.id).notNull(),
  pageNumber: integer('page_number').notNull(),
  x0: doublePrecision('x0').notNull(),
  y0: doublePrecision('y0').notNull(),
  x1: doublePrecision('x1').notNull(),
  y1: doublePrecision('y1').notNull(),
  regionOrder: integer('region_order').notNull(),
});

export const worksheetsTable = pgTable('worksheets', {
  id: text('id').primaryKey(),
  worksheetNumber: text('worksheet_number').notNull(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  chapter: text('chapter').notNull(),
  syllabusVersionId: text('syllabus_version_id').notNull(),
  version: integer('version').notNull(),
  questionCount: integer('question_count').notNull(),
  totalMarks: integer('total_marks').notNull(),
  status: text('status').notNull(),
  sourceCoverage: jsonb('source_coverage').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const worksheetQuestionsTable = pgTable('worksheet_questions', {
  worksheetId: text('worksheet_id').references(() => worksheetsTable.id).notNull(),
  questionId: text('question_id').references(() => questionsTable.id).notNull(),
  position: integer('position').notNull(),
});

export const reviewItemsTable = pgTable('review_items', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  issueType: text('issue_type').notNull(),
  confidence: doublePrecision('confidence').notNull(),
  details: jsonb('details').notNull(),
  status: text('status').notNull(),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('TEACHER'), // 'ADMIN' | 'TEACHER'
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogsTable = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
