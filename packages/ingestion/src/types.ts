import { SingaporeSchoolCode, SubjectId } from '@paperforge/shared';

export type FileRole = 'QP' | 'MS' | 'UNKNOWN';

export interface DiscoveredPdf {
  path: string;
  filename: string;
  size: number;
  hash: string;
  school: SingaporeSchoolCode;
  year: number;
  subject: SubjectId;
  paperType: 'PROMO' | 'PRELIM' | 'PRACTICE';
  paperNumber: number;
  role: FileRole;
  cleanTitle: string;
}

export interface PairedPaperSet {
  id: string;
  title: string;
  school: SingaporeSchoolCode;
  year: number;
  subject: SubjectId;
  paperType: 'PROMO' | 'PRELIM' | 'PRACTICE';
  paperNumber: number;
  questionPaper: DiscoveredPdf;
  markScheme: DiscoveredPdf | null;
  isComplete: boolean;
}

export interface ScanManifest {
  sourceType: 'local' | 'bucket';
  sourceLocation: string;
  totalDiscovered: number;
  pairedCount: number;
  unpairedQpCount: number;
  orphanedMsCount: number;
  duplicateCount: number;
  sets: PairedPaperSet[];
  duplicates: DiscoveredPdf[];
  unpaired: DiscoveredPdf[];
  scannedAt: string;
}

export interface IngestionJobResult {
  setId: string;
  title: string;
  success: boolean;
  questionsCount: number;
  answersCount: number;
  totalMarks: number;
  durationMs: number;
  error?: string;
}

export interface BulkRunReport {
  startedAt: string;
  finishedAt: string;
  totalSets: number;
  successfulSets: number;
  failedSets: number;
  totalQuestionsIngested: number;
  totalAnswersIngested: number;
  totalDurationMs: number;
  results: IngestionJobResult[];
}
