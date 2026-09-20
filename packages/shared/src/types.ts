/**
 * PaperForge — Shared Domain Types
 * Strict typing across Singapore A-Level Question Processing Pipeline
 */

export type SingaporeSchoolCode =
  | 'RI'    // Raffles Institution
  | 'HCI'   // Hwa Chong Institution
  | 'NYJC'  // Nanyang Junior College
  | 'VJC'   // Victoria Junior College
  | 'ACJC'  // Anglo-Chinese Junior College
  | 'EJC'   // Eunoia Junior College
  | 'NJC'   // National Junior College
  | 'TJC'   // Temasek Junior College
  | 'RVHS'  // River Valley High School
  | 'DHS'   // Dunman High School
  | 'ASRJC' // Anderson Serangoon Junior College
  | 'JPJC'  // Jurong Pioneer Junior College
  | 'TMJC'  // Tampines Meridian Junior College
  | 'CJC'   // Catholic Junior College
  | 'SAJC'  // St. Andrew's Junior College
  | 'YIJC'; // Yishun Innova Junior College

export interface SingaporeSchoolInfo {
  code: SingaporeSchoolCode;
  name: string;
  fullName: string;
}

export const SINGAPORE_SCHOOLS: Record<SingaporeSchoolCode, SingaporeSchoolInfo> = {
  RI: { code: 'RI', name: 'Raffles', fullName: 'Raffles Institution' },
  HCI: { code: 'HCI', name: 'Hwa Chong', fullName: 'Hwa Chong Institution' },
  NYJC: { code: 'NYJC', name: 'Nanyang JC', fullName: 'Nanyang Junior College' },
  VJC: { code: 'VJC', name: 'Victoria JC', fullName: 'Victoria Junior College' },
  ACJC: { code: 'ACJC', name: 'Anglo-Chinese JC', fullName: 'Anglo-Chinese Junior College' },
  EJC: { code: 'EJC', name: 'Eunoia JC', fullName: 'Eunoia Junior College' },
  NJC: { code: 'NJC', name: 'National JC', fullName: 'National Junior College' },
  TJC: { code: 'TJC', name: 'Temasek JC', fullName: 'Temasek Junior College' },
  RVHS: { code: 'RVHS', name: 'River Valley', fullName: 'River Valley High School' },
  DHS: { code: 'DHS', name: 'Dunman High', fullName: 'Dunman High School' },
  ASRJC: { code: 'ASRJC', name: 'Anderson Serangoon JC', fullName: 'Anderson Serangoon Junior College' },
  JPJC: { code: 'JPJC', name: 'Jurong Pioneer JC', fullName: 'Jurong Pioneer Junior College' },
  TMJC: { code: 'TMJC', name: 'Tampines Meridian JC', fullName: 'Tampines Meridian Junior College' },
  CJC: { code: 'CJC', name: 'Catholic JC', fullName: 'Catholic Junior College' },
  SAJC: { code: 'SAJC', name: "St. Andrew's JC", fullName: "St. Andrew's Junior College" },
  YIJC: { code: 'YIJC', name: 'Yishun Innova JC', fullName: 'Yishun Innova Junior College' },
};

export type SubjectId = 'chemistry' | 'physics' | 'biology' | 'mathematics';

export interface SubjectMetadata {
  id: SubjectId;
  name: string;
  syllabusCode: string;
  level: string;
  themeColor: string;
}

export const SUBJECT_METADATA: Record<SubjectId, SubjectMetadata> = {
  chemistry: {
    id: 'chemistry',
    name: 'H2 Chemistry',
    syllabusCode: '9476',
    level: 'Higher 2 (H2)',
    themeColor: '#00e5ff',
  },
  physics: {
    id: 'physics',
    name: 'H2 Physics',
    syllabusCode: '9749',
    level: 'Higher 2 (H2)',
    themeColor: '#2563eb',
  },
  biology: {
    id: 'biology',
    name: 'H2 Biology',
    syllabusCode: '9744',
    level: 'Higher 2 (H2)',
    themeColor: '#10b981',
  },
  mathematics: {
    id: 'mathematics',
    name: 'H2 Mathematics',
    syllabusCode: '9758',
    level: 'Higher 2 (H2)',
    themeColor: '#a855f7',
  },
};

export type SourceProcessingStatus =
  | 'DISCOVERED'
  | 'DOWNLOADING'
  | 'DOWNLOADED'
  | 'VALIDATING'
  | 'PARSING'
  | 'SEGMENTING'
  | 'MATCHING'
  | 'CLASSIFYING'
  | 'DEDUPLICATING'
  | 'REVIEW_REQUIRED'
  | 'READY'
  | 'FAILED';

export interface SourceDocument {
  id: string;
  filename: string;
  school: SingaporeSchoolCode;
  year: number;
  subject: SubjectId;
  paperType: 'PRELIM' | 'PROMO' | 'BLOCK_TEST' | 'PRACTICE';
  paperNumber: number; // e.g. 1, 2, 3, 4
  sourceHash: string; // SHA-256 of entire source PDF
  storageKey: string;
  pageCount: number;
  status: SourceProcessingStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type BoundingBox = [number, number, number, number]; // [x0, y0, x1, y1] in points

export interface QuestionRegion {
  id: string;
  questionId: string;
  pageNumber: number;
  bbox: BoundingBox;
  regionOrder: number;
}

export interface QuestionProvenance {
  school: SingaporeSchoolCode;
  year: number;
  paperType: string;
  paperNumber: number;
  questionNumber: string;
  sourceDocumentId: string;
  citation: string; // e.g. [RI 2025 H2 Chemistry Prelim P2 Q7(b)(ii)]
}

export type QuestionStatus = 'DRAFT' | 'READY' | 'PUBLISHED' | 'FLAGGED' | 'EXCLUDED';

export interface Question {
  id: string;
  sourceId: string;
  questionNumber: string;
  parentQuestionId?: string | null;
  subject: SubjectId;
  chapter: string;
  subtopic?: string | null;
  syllabusVersionId: string;
  textContent: string;
  marks?: number | null;
  textHash: string;
  visualHash?: string | null;
  regions: QuestionRegion[];
  provenance: QuestionProvenance;
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerRegion {
  id: string;
  answerId: string;
  pageNumber: number;
  bbox: BoundingBox;
  regionOrder: number;
}

export interface Answer {
  id: string;
  sourceId: string;
  questionId: string;
  questionNumber: string;
  answerContent: string;
  answerHash: string;
  markSchemeNotes?: string;
  regions?: AnswerRegion[];
  provenance: QuestionProvenance;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'AUTO_MATCHED';
}

export interface WorksheetManifest {
  worksheetId: string;
  version: number;
  chapter: string;
  subject: SubjectId;
  questions: string[]; // Ordered array of Question IDs
  totalMarks: number;
  frozenAt: string;
}

export interface Worksheet {
  id: string;
  worksheetNumber: string; // e.g. 'WS-01'
  title: string;
  subject: SubjectId;
  chapter: string;
  syllabusVersionId: string;
  version: number;
  questionCount: number;
  totalMarks: number;
  status: 'DRAFT' | 'READY' | 'PUBLISHED';
  sourceCoverage: SingaporeSchoolCode[];
  manifest: WorksheetManifest;
  questionPdfStorageKey?: string;
  answerPdfStorageKey?: string;
  generatedAt: string;
  updatedAt: string;
}

export type DedupOutcome = 'EXACT_DUPLICATE' | 'LIKELY_DUPLICATE' | 'POSSIBLE_VARIANT' | 'UNIQUE';

export interface DedupComparisonResult {
  sourceQuestionId: string;
  targetQuestionId: string;
  outcome: DedupOutcome;
  textSimilarity: number;
  structureSimilarity: number;
  markMatch: boolean;
  notes: string;
}

export type ReviewIssueType =
  | 'AMBIGUOUS_BOUNDARY'
  | 'MISSING_DIAGRAM'
  | 'UNMATCHED_ANSWER'
  | 'UNCERTAIN_CLASSIFICATION'
  | 'POSSIBLE_DUPLICATE';

export interface ReviewItem {
  id: string;
  entityType: 'QUESTION' | 'ANSWER' | 'WORKSHEET' | 'SOURCE';
  entityId: string;
  issueType: ReviewIssueType;
  confidence: number;
  details: Record<string, unknown>;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface SystemHealthStatus {
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  workerCount: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  lastSuccessfulProcessingRun: string;
  syncIntervalDays: number;
  nextScheduledSync: string;
  databaseConnected: boolean;
  storageConnected: boolean;
}
