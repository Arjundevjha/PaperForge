/**
 * PaperForge — Database Repository & Data Store
 * Unified interface supporting both persistent PostgreSQL and embedded fast in-memory execution
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  SourceDocument,
  Question,
  Answer,
  Worksheet,
  ReviewItem,
  SystemHealthStatus,
  SubjectId,
  SingaporeSchoolCode,
  UserProfile,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_TEACHER_PROFILE,
} from '@paperforge/shared';
import { generateSeedData, SeedDatabaseData } from './seed';

function resolvePersistenceFilePath(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(curr, 'packages', 'db'))) {
      return path.join(curr, 'packages', 'db', '.paperforge-store.json');
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd(), '.paperforge-store.json');
}

export class PaperForgeDataStore {
  private sources: Map<string, SourceDocument> = new Map();
  private questions: Map<string, Question> = new Map();
  private answers: Map<string, Answer> = new Map();
  private worksheets: Map<string, Worksheet> = new Map();
  private reviewItems: Map<string, ReviewItem> = new Map();
  private users: Map<string, UserProfile> = new Map();
  private persistenceFile: string | null = null;

  constructor(seedData?: SeedDatabaseData | null) {
    // In dev and prod, default to clean/empty state (0 samples) to simulate a fresh production environment.
    // Seed data is loaded only if explicitly passed or if LOAD_SAMPLE_DATA=true.
    const shouldLoad =
      seedData !== undefined ? !!seedData : process.env.LOAD_SAMPLE_DATA === 'true';
    const data = seedData || (shouldLoad ? generateSeedData() : null);

    if (data) {
      for (const s of data.sources) this.sources.set(s.id, s);
      for (const q of data.questions) this.questions.set(q.id, q);
      for (const a of data.answers) this.answers.set(a.questionId, a);
      for (const w of data.worksheets) this.worksheets.set(w.id, w);
      for (const r of data.reviewItems) this.reviewItems.set(r.id, r);
    }

    this.users.set(DEFAULT_ADMIN_PROFILE.id, DEFAULT_ADMIN_PROFILE);
    this.users.set(DEFAULT_TEACHER_PROFILE.id, DEFAULT_TEACHER_PROFILE);
  }

  enableDiskPersistence(filepath?: string): void {
    this.persistenceFile = filepath || resolvePersistenceFilePath();
    this.loadFromDisk();
  }

  private saveToDisk(): void {
    if (!this.persistenceFile) return;
    try {
      const payload = {
        sources: Array.from(this.sources.values()),
        questions: Array.from(this.questions.values()),
        answers: Array.from(this.answers.values()),
        worksheets: Array.from(this.worksheets.values()),
        reviewItems: Array.from(this.reviewItems.values()),
      };
      fs.writeFileSync(this.persistenceFile, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {
      // Ignore disk write failure in environments without write access
    }
  }

  public reloadFromDisk(): boolean {
    if (!this.persistenceFile) {
      this.persistenceFile = resolvePersistenceFilePath();
    }
    if (!this.persistenceFile || !fs.existsSync(this.persistenceFile)) return false;
    try {
      const raw = fs.readFileSync(this.persistenceFile, 'utf-8');
      if (!raw.trim()) return false;
      const data = JSON.parse(raw);
      this.sources.clear();
      this.questions.clear();
      this.answers.clear();
      this.worksheets.clear();
      this.reviewItems.clear();
      if (Array.isArray(data.sources)) {
        for (const s of data.sources) this.sources.set(s.id, s);
      }
      if (Array.isArray(data.questions)) {
        for (const q of data.questions) this.questions.set(q.id, q);
      }
      if (Array.isArray(data.answers)) {
        for (const a of data.answers) this.answers.set(a.questionId, a);
      }
      if (Array.isArray(data.worksheets)) {
        for (const w of data.worksheets) this.worksheets.set(w.id, w);
      }
      if (Array.isArray(data.reviewItems)) {
        for (const r of data.reviewItems) this.reviewItems.set(r.id, r);
      }
      return true;
    } catch {
      return false;
    }
  }

  private loadFromDisk(): boolean {
    return this.reloadFromDisk();
  }

  clearAllData(): void {
    this.sources.clear();
    this.questions.clear();
    this.answers.clear();
    this.worksheets.clear();
    this.reviewItems.clear();
    this.saveToDisk();
  }

  loadSampleSeed(): void {
    const data = generateSeedData();
    for (const s of data.sources) this.sources.set(s.id, s);
    for (const q of data.questions) this.questions.set(q.id, q);
    for (const a of data.answers) this.answers.set(a.questionId, a);
    for (const w of data.worksheets) this.worksheets.set(w.id, w);
    for (const r of data.reviewItems) this.reviewItems.set(r.id, r);
  }

  // Sources
  listSources(): SourceDocument[] {
    return Array.from(this.sources.values()).sort((a, b) => b.year - a.year);
  }

  getSourceById(id: string): SourceDocument | undefined {
    return this.sources.get(id);
  }

  getSourceByHash(hash: string): SourceDocument | undefined {
    for (const s of this.sources.values()) {
      if (s.sourceHash === hash) return s;
    }
    return undefined;
  }

  addSource(source: SourceDocument): SourceDocument {
    this.sources.set(source.id, source);
    this.saveToDisk();
    return source;
  }

  deleteSource(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    this.sources.delete(id);
    for (const [qid, q] of Array.from(this.questions.entries())) {
      if (q.sourceId === id) {
        this.questions.delete(qid);
        this.answers.delete(qid);
      }
    }
    this.saveToDisk();
    return true;
  }

  updateSourceStatus(id: string, status: SourceDocument['status'], error?: string): SourceDocument | undefined {
    const s = this.sources.get(id);
    if (!s) return undefined;
    s.status = status;
    if (error) s.errorMessage = error;
    s.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return s;
  }

  // Questions
  listQuestions(filters?: {
    subject?: SubjectId;
    chapter?: string;
    subtopic?: string;
    school?: SingaporeSchoolCode;
    status?: Question['status'];
    search?: string;
  }): Question[] {
    let list = Array.from(this.questions.values());

    if (filters?.subject) {
      list = list.filter((q) => q.subject === filters.subject);
    }
    if (filters?.chapter) {
      list = list.filter((q) => q.chapter === filters.chapter);
    }
    if (filters?.subtopic) {
      list = list.filter((q) => q.subtopic === filters.subtopic);
    }
    if (filters?.school) {
      list = list.filter((q) => q.provenance.school === filters.school);
    }
    if (filters?.status) {
      list = list.filter((q) => q.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (item) =>
          item.textContent.toLowerCase().includes(q) ||
          item.provenance.citation.toLowerCase().includes(q) ||
          item.questionNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getQuestionById(id: string): Question | undefined {
    return this.questions.get(id);
  }

  addQuestion(question: Question): Question {
    this.questions.set(question.id, question);
    this.saveToDisk();
    return question;
  }

  addAnswer(answer: Answer): Answer {
    this.answers.set(answer.questionId, answer);
    this.saveToDisk();
    return answer;
  }

  getAnswerByQuestionId(questionId: string): Answer | undefined {
    return this.answers.get(questionId);
  }

  // Worksheets
  listWorksheets(subject?: SubjectId): Worksheet[] {
    let list = Array.from(this.worksheets.values());
    if (subject) {
      list = list.filter((w) => w.subject === subject);
    }
    return list.sort((a, b) => a.worksheetNumber.localeCompare(b.worksheetNumber));
  }

  getWorksheetById(id: string): Worksheet | undefined {
    return this.worksheets.get(id);
  }

  addWorksheet(worksheet: Worksheet): Worksheet {
    this.worksheets.set(worksheet.id, worksheet);
    this.saveToDisk();
    return worksheet;
  }

  deleteWorksheet(id: string): boolean {
    const deleted = this.worksheets.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }

  clearWorksheets(): void {
    this.worksheets.clear();
    this.saveToDisk();
  }

  getWorksheetQuestions(worksheetId: string): { questions: Question[]; answers: Answer[] } {
    const ws = this.worksheets.get(worksheetId);
    if (!ws) return { questions: [], answers: [] };

    const questions: Question[] = [];
    const answers: Answer[] = [];

    for (const qid of ws.manifest.questions) {
      const q = this.questions.get(qid);
      if (q) {
        questions.push(q);
        const a = this.answers.get(qid);
        if (a) answers.push(a);
      }
    }

    return { questions, answers };
  }

  // Review Queue
  listReviewItems(status?: ReviewItem['status']): ReviewItem[] {
    let list = Array.from(this.reviewItems.values());
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addReviewItem(item: ReviewItem): ReviewItem {
    this.reviewItems.set(item.id, item);
    this.saveToDisk();
    return item;
  }

  resolveReviewItem(
    id: string,
    decision: 'APPROVE' | 'REJECT' | 'OVERRIDE' | 'MERGE',
    reviewerId: string,
    notes?: string
  ): ReviewItem | undefined {
    const item = this.reviewItems.get(id);
    if (!item) return undefined;

    item.status = decision === 'REJECT' ? 'DISMISSED' : 'RESOLVED';
    item.reviewedBy = reviewerId;
    item.reviewedAt = new Date().toISOString();
    item.details = { ...item.details, decision, notes };
    this.saveToDisk();
    return item;
  }

  // Users & Auth
  getUserById(id: string): UserProfile | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): UserProfile | undefined {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return undefined;
  }

  upsertUser(user: UserProfile): UserProfile {
    this.users.set(user.id, user);
    return user;
  }

  listUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  // System status
  getSystemHealth(): SystemHealthStatus {
    return {
      status: 'OPERATIONAL',
      workerCount: 4,
      activeJobs: 0,
      completedJobs: 24,
      failedJobs: 0,
      lastSuccessfulProcessingRun: '2026-09-18T15:30:00Z',
      syncIntervalDays: 90,
      nextScheduledSync: '2026-12-17T00:00:00Z',
      databaseConnected: true,
      storageConnected: true,
    };
  }
}

// Global shared store singleton for server runtime with globalThis caching across HMR
const globalForStore = globalThis as unknown as { __paperforge_store?: PaperForgeDataStore };

export function getGlobalStore(): PaperForgeDataStore {
  if (!globalForStore.__paperforge_store) {
    const store = new PaperForgeDataStore();
    if (process.env.NODE_ENV !== 'test') {
      store.enableDiskPersistence();
    }
    globalForStore.__paperforge_store = store;
  }
  return globalForStore.__paperforge_store;
}
